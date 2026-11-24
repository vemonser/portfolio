#!/usr/bin/env node
/**
 * Render one project (or all) into video/out/<slug>/.
 *
 *   npm run render -- anom-creative
 *   npm run render -- all
 *
 * Videos are rendered twice on purpose: a high-quality intermediate from
 * Remotion, then an H.264 encode at a CRF chosen to fit the size budget. The
 * CRF ladder never re-encodes a previous delivery file.
 */
import { execFileSync } from "node:child_process";
import {
  mkdir,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { PROJECTS, routeKey } from "../src/showcase/projects.ts";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VIDEO_ROOT = path.resolve(HERE, "..");
const ENTRY = "src/index.ts";
const REMOTION = path.join(VIDEO_ROOT, "node_modules", ".bin", "remotion");
const OUT_ROOT = path.join(VIDEO_ROOT, "out");
const TMP_ROOT = path.join(VIDEO_ROOT, ".tmp", "render");

const BUDGET = 3 * 1024 * 1024;
// Continuous live footage costs more than the stepped camera. Let it stay at
// CRF 32 instead of degrading to 35 just to hit exactly 3 MB.
const LIVE_BUDGET = 3.6 * 1024 * 1024;
const CRF_LADDER = [23, 26, 29, 32, 35];
const FPS = 30;

const arg = process.argv[2];
if (!arg || arg === "--help" || arg === "help") {
  console.log("Usage: node video/scripts/render.mjs <project-slug|all>");
  console.log(`Projects: ${PROJECTS.map((p) => p.slug).join(", ")}`);
  process.exit(arg ? 0 : 1);
}

const selected =
  arg === "all" ? PROJECTS : PROJECTS.filter((project) => project.slug === arg);
if (selected.length === 0) {
  console.error(`Unknown project "${arg}".`);
  console.error(`Valid: ${PROJECTS.map((p) => p.slug).join(", ")}, all`);
  process.exit(1);
}

const mb = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;
const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

function run(command, args, options = {}) {
  try {
    return execFileSync(command, args, {
      cwd: VIDEO_ROOT,
      encoding: "utf8",
      timeout: 30 * 60 * 1000,
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });
  } catch (error) {
    if (error.stdout) console.error(String(error.stdout).slice(-4000));
    if (error.stderr) console.error(String(error.stderr).slice(-8000));
    throw error;
  }
}

function renderIntermediate(id, outPath) {
  run(REMOTION, [
    "render",
    ENTRY,
    id,
    outPath,
    "--codec=h264",
    "--crf=12",
    "--x264-preset=veryfast",
    "--pixel-format=yuv420p",
    "--muted",
    "--concurrency=2",
    "--overwrite",
    "--log=error",
  ]);
}

function transcode(input, output, crf) {
  run("ffmpeg", [
    "-y",
    "-i",
    input,
    "-c:v",
    "libx264",
    "-preset",
    "slow",
    "-crf",
    String(crf),
    "-pix_fmt",
    "yuv420p",
    "-movflags",
    "+faststart",
    "-an",
    "-r",
    String(FPS),
    output,
  ]);
}

function probe(file) {
  const raw = run("ffprobe", [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_streams",
    "-show_format",
    file,
  ]);
  const data = JSON.parse(raw);
  const video = data.streams.find((stream) => stream.codec_type === "video");
  const audio = data.streams.filter((stream) => stream.codec_type === "audio");
  return {
    width: Number(video?.width ?? 0),
    height: Number(video?.height ?? 0),
    codec: video?.codec_name ?? "?",
    pixFmt: video?.pix_fmt ?? "?",
    duration: Number(data.format?.duration ?? 0),
    audio: audio.length,
  };
}

/** moov before mdat in the top-level box order means faststart. */
async function isFaststart(file) {
  const buffer = await readFile(file);
  let offset = 0;
  const order = [];
  while (offset + 8 <= buffer.length && order.length < 40) {
    let size = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    order.push(type);
    if (size === 1) {
      size = Number(buffer.readBigUInt64BE(offset + 8));
    }
    if (!Number.isFinite(size) || size < 8) break;
    offset += size;
  }
  const moov = order.indexOf("moov");
  const mdat = order.indexOf("mdat");
  return moov !== -1 && mdat !== -1 && moov < mdat;
}

async function renderVideo({ id, output, label, poster, budget = BUDGET }) {
  const intermediate = path.join(TMP_ROOT, `${id}.mp4`);
  console.log(`\n→ ${label}  (${id})`);
  const started = Date.now();
  renderIntermediate(id, intermediate);

  const attempts = [];
  let chosen = null;
  for (const crf of CRF_LADDER) {
    transcode(intermediate, output, crf);
    const { size } = await stat(output);
    attempts.push({ crf, size });
    console.log(`    CRF ${crf}: ${mb(size)}`);
    chosen = { crf, size };
    if (size <= budget) break;
  }

  const meta = probe(output);
  const faststart = await isFaststart(output);

  if (poster) {
    run("ffmpeg", [
      "-y",
      "-i",
      intermediate,
      "-frames:v",
      "1",
      "-q:v",
      "2",
      poster,
    ]);
  }

  console.log(
    `    ${meta.width}x${meta.height} · ${meta.duration.toFixed(2)}s · ` +
      `audio streams: ${meta.audio} · faststart: ${faststart ? "yes" : "NO"} · ` +
      `CRF ${chosen.crf} · ${((Date.now() - started) / 1000).toFixed(0)}s`,
  );

  await rm(intermediate, { force: true });

  return {
    file: output,
    id,
    label,
    width: meta.width,
    height: meta.height,
    duration: meta.duration,
    size: chosen.size,
    crf: chosen.crf,
    attempts,
    audio: meta.audio,
    faststart,
    budget,
  };
}

async function renderStill({ id, pngPath, webpPath, label }) {
  console.log(`\n→ ${label}  (${id})`);
  run(REMOTION, [
    "still",
    ENTRY,
    id,
    pngPath,
    "--frame=0",
    "--overwrite",
    "--log=error",
  ]);
  await sharp(pngPath)
    .webp({ quality: 85, effort: 6 })
    .toFile(webpPath);
  const { size } = await stat(webpPath);
  const meta = await sharp(webpPath).metadata();
  await rm(pngPath, { force: true });
  console.log(`    ${meta.width}x${meta.height} · ${kb(size)}`);
  return {
    file: webpPath,
    label,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    size,
  };
}

async function ensureCaptures(project) {
  const manifestPath = path.join(
    VIDEO_ROOT,
    "src",
    "showcase",
    "captures.generated.json",
  );
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const entry = manifest.projects?.[project.slug];
  if (!entry) {
    throw new Error(
      `No captures for ${project.slug}. Run: npm run capture -- ${project.slug}`,
    );
  }
  const missing = project.routes
    .map((route) => routeKey(route))
    .filter((key) => !entry.routes?.[key]?.desktop || !entry.routes?.[key]?.mobile);
  if (missing.length > 0) {
    throw new Error(
      `Missing desktop/mobile captures for ${project.slug}: ${missing.join(", ")}. ` +
        `Run: npm run capture -- ${project.slug}`,
    );
  }

  const missingScroll = project.routes
    .filter((route) => route.liveScroll)
    .map((route) => routeKey(route))
    .filter((key) => !entry.routes?.[key]?.scroll);
  if (missingScroll.length > 0) {
    throw new Error(
      `Missing real-scroll recording for ${project.slug}: ${missingScroll.join(", ")}. ` +
        `Run: npm run capture -- ${project.slug}`,
    );
  }
}

await mkdir(TMP_ROOT, { recursive: true });
const videos = [];
const stills = [];

for (const project of selected) {
  console.log(`\n━━ ${project.name} (${project.slug}) ━━`);
  await ensureCaptures(project);

  const outDir = path.join(OUT_ROOT, project.slug);
  await mkdir(outDir, { recursive: true });

  for (const route of project.routes) {
    const key = routeKey(route);
    const base = `desktop-${key}`;
    videos.push(
      await renderVideo({
        id: `Desktop-${project.slug}-${key}`,
        output: path.join(outDir, `${base}.mp4`),
        poster: path.join(outDir, `${base}.poster.jpg`),
        label: `${project.slug} · ${base}`,
        budget: route.liveScroll ? LIVE_BUDGET : BUDGET,
      }),
    );
  }

  videos.push(
    await renderVideo({
      id: `Mobile-${project.slug}`,
      output: path.join(outDir, "mobile.mp4"),
      poster: path.join(outDir, "mobile.poster.jpg"),
      label: `${project.slug} · mobile`,
    }),
  );

  stills.push(
    await renderStill({
      id: `Stills-${project.slug}`,
      pngPath: path.join(TMP_ROOT, `${project.slug}-stills.png`),
      webpPath: path.join(outDir, "mobile-stills.webp"),
      label: `${project.slug} · mobile stills`,
    }),
  );
}

console.log("\n\nDELIVERABLES\n");
const rows = [
  ["file", "resolution", "duration", "size", "crf", "audio", "faststart"],
  ...videos.map((video) => [
    path.relative(VIDEO_ROOT, video.file),
    `${video.width}x${video.height}`,
    `${video.duration.toFixed(2)}s`,
    mb(video.size),
    String(video.crf),
    video.audio === 0 ? "none" : `${video.audio} stream(s)`,
    video.faststart ? "yes" : "NO",
  ]),
  ...stills.map((still) => [
    path.relative(VIDEO_ROOT, still.file),
    `${still.width}x${still.height}`,
    "still",
    kb(still.size),
    "—",
    "—",
    "—",
  ]),
];

const widths = rows[0].map((_, column) =>
  Math.max(...rows.map((row) => String(row[column]).length)),
);
for (const [index, row] of rows.entries()) {
  console.log(
    row
      .map((cell, column) => String(cell).padEnd(widths[column]))
      .join("  "),
  );
  if (index === 0) {
    console.log(widths.map((width) => "─".repeat(width)).join("  "));
  }
}

const overBudget = videos.filter((video) => video.size > video.budget);
if (overBudget.length > 0) {
  console.log("\nOver the 3 MB budget at maximum CRF:");
  for (const video of overBudget) {
    console.log(`  - ${path.relative(VIDEO_ROOT, video.file)}: ${mb(video.size)}`);
  }
}

const badStreams = videos.filter(
  (video) => video.audio !== 0 || !video.faststart,
);
if (badStreams.length > 0) {
  console.error("\nEncoding contract violated:");
  for (const video of badStreams) {
    console.error(
      `  - ${path.relative(VIDEO_ROOT, video.file)}: audio=${video.audio}, faststart=${video.faststart}`,
    );
  }
  process.exitCode = 1;
}

await writeFile(
  path.join(OUT_ROOT, "last-render.json"),
  `${JSON.stringify({ generatedAt: new Date().toISOString(), videos, stills }, null, 2)}\n`,
);

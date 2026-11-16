#!/usr/bin/env node
/**
 * Verifies the Phase 0 media deliverables exist and match the agreed shapes.
 * Real check, not a manifest: exits non-zero on any mismatch. Used by the
 * Evidence Gate as the command behind the video/stills criteria.
 */
import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";
import path from "node:path";

import sharp from "sharp";

const errors = [];
const records = [];

function check(condition, message) {
  if (!condition) errors.push(message);
}

function file(relative) {
  const absolute = path.resolve(relative);
  const exists = (() => {
    try {
      return statSync(absolute).isFile();
    } catch {
      return false;
    }
  })();
  check(exists, `missing artifact: ${relative}`);
  return exists ? absolute : null;
}

function probe(relative) {
  const absolute = file(relative);
  if (!absolute) return null;
  const json = JSON.parse(
    String(
      execFileSync("ffprobe", [
        "-v",
        "error",
        "-select_streams",
        "v:0",
        "-show_entries",
        "stream=width,height,codec_name",
        "-show_entries",
        "format=duration,size",
        "-of",
        "json",
        absolute,
      ]),
    ),
  );
  const stream = json.streams?.[0];
  const format = json.format;
  return {
    file: relative,
    width: stream?.width,
    height: stream?.height,
    codec: stream?.codec_name,
    duration: Number(format?.duration ?? 0),
    bytes: Number(format?.size ?? 0),
  };
}

async function image(relative) {
  const absolute = file(relative);
  if (!absolute) return null;
  const meta = await sharp(absolute).metadata();
  return {
    file: relative,
    width: meta.width,
    height: meta.height,
    bytes: statSync(absolute).size,
  };
}

// AC-3 — video A
const videoA = probe("public/lab/video/anom-creative-directed.webm");
if (videoA) {
  check(
    videoA.width === 1280 && videoA.height === 800,
    `video A is ${videoA.width}x${videoA.height}, expected 1280x800`,
  );
  check(videoA.codec === "vp9", `video A codec is ${videoA.codec}`);
  check(
    videoA.duration >= 8 && videoA.duration <= 12,
    `video A duration is ${videoA.duration}s, expected 8-12s`,
  );
  check(videoA.bytes < 3 * 1024 * 1024, "video A is over 3 MB");
}
records.push({ criterion: "AC-3", videoA });
const poster = await image("public/lab/video/anom-creative-poster.webp");
check(Boolean(poster), "video A poster is missing");
records.push({ criterion: "AC-3", poster });

// AC-4 — stills
const stillNames = [
  ["cover", 2880, 1800],
  ["sectionA", 2880, 1800],
  ["sectionB", 2880, 1800],
  ["detail", 1600, 1000],
  ["mobile-trio", 1600, 1000],
];
for (const [name, width, height] of stillNames) {
  const frame = await image(`public/lab/stills/anom-creative/${name}.webp`);
  if (!frame) continue;
  check(
    frame.width === width && frame.height === height,
    `${name} is ${frame.width}x${frame.height}, expected ${width}x${height}`,
  );
  records.push({ criterion: "AC-4", frame });
}

// AC-5 — video B
for (const [name, codec] of [
  ["mp4", "h264"],
  ["webm", "vp9"],
]) {
  const render = probe(`public/lab/video/b-anom-showreel.${name}`);
  if (!render) continue;
  check(
    render.width === 1920 && render.height === 1080,
    `showreel ${name} is ${render.width}x${render.height}, expected 1920x1080`,
  );
  check(
    render.codec === codec,
    `showreel ${name} codec is ${render.codec}, expected ${codec}`,
  );
  check(
    Math.abs(render.duration - 10) < 0.5,
    `showreel ${name} duration is ${render.duration}s, expected 10s`,
  );
  records.push({ criterion: "AC-5", render });
}

// AC-1/AC-6 — review screenshots
for (const [relative, width, height] of [
  ["public/lab/hero-c/rest-1440.webp", 1440, 900],
  ["public/lab/hero-c/stir-1440.webp", 1440, 900],
  ["public/lab/hero-c/rest-390.webp", 780, 1688],
  ["public/lab/hero-c/reduced-1440.webp", 1440, 900],
  ["public/lab/cursor/view-dark.webp", 1440, 900],
  ["public/lab/cursor/play.webp", 1440, 900],
  ["public/lab/cursor/text.webp", 1440, 900],
]) {
  const shot = await image(relative);
  if (!shot) continue;
  check(
    shot.width === width && shot.height === height,
    `${relative} is ${shot.width}x${shot.height}, expected ${width}x${height}`,
  );
  records.push({ criterion: "AC-1", shot });
}

const gallery = await image("public/lab/gallery-1440.webp");
if (gallery) {
  check(gallery.width === 1440, `gallery is ${gallery.width}px wide`);
  records.push({ criterion: "AC-6", gallery });
}

console.log(JSON.stringify({ ok: errors.length === 0, records, errors }, null, 2));
if (errors.length > 0) {
  process.exitCode = 1;
}

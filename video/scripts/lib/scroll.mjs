/**
 * Real-scroll recording for the live compositions.
 *
 * A tall screenshot can show layout but not the site's on-view animations.
 * Chromium's screencast captures the actual page while it is scrolled with a
 * sine ease. Raw frames carry timestamps, so the assembled clip keeps the
 * real cadence instead of inventing a frame rate.
 */
import { execFileSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  dismissCookieBanners,
  measureSections,
  openPage,
  primePage,
  waitForPreloader,
} from "./browser.mjs";

export const SCROLL_VIEWPORT = { width: 1600, height: 948 };
export const SCROLL_FPS = 30;
export const START_HOLD_MS = 1500;
export const HOLD_MS = 800;
export const END_HOLD_MS = 1200;
/** Average speed while travelling between dwell points. */
export const MOVE_SPEED = 800;
export const MIN_MOVE_MS = 900;
export const MAX_MOVE_MS = 3000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function run(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      timeout: 30 * 60 * 1000,
      maxBuffer: 64 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (error) {
    if (error.stderr) console.error(String(error.stderr).slice(-8000));
    throw error;
  }
}

/**
 * The page is lazy: at 1600px it starts around 7,800px tall and grows past
 * 10,000px once project media is requested. Measure in a separate context so
 * the recording context can aim at the real bottom.
 */
export async function measureFinalHeight(browser, url) {
  const { context, page } = await openPage(
    browser,
    { viewport: SCROLL_VIEWPORT, deviceScaleFactor: 1 },
    url,
  );
  try {
    await waitForPreloader(page);
    await dismissCookieBanners(page);
    const primed = await primePage(page, SCROLL_VIEWPORT.height);
    const sections = await measureSections(page);
    return { height: primed.height, stops: sections.map((s) => s.offsetY) };
  } finally {
    await context.close();
  }
}

/**
 * Turns section tops into dwell points: drop a stop that is too close to the
 * next one, and insert a midpoint across a section taller than two screens
 * (the Anom project stack). Keeps the list short enough to stay readable.
 */
export function buildDwellStops(raw, maxScroll) {
  const height = SCROLL_VIEWPORT.height;
  const sorted = raw
    .filter((value) => Number.isFinite(value))
    .map((value) => Math.round(Math.min(maxScroll, Math.max(0, value))))
    .sort((a, b) => a - b);

  const unique = [];
  for (const value of sorted) {
    if (unique.length === 0 || value - unique[unique.length - 1] >= 200) {
      unique.push(value);
    }
  }
  if (unique[0] !== 0) unique.unshift(0);
  if (unique[unique.length - 1] !== maxScroll) unique.push(maxScroll);

  const cleaned = [];
  for (let i = 0; i < unique.length; i += 1) {
    const next = unique[i + 1];
    // A stop 200-330px before the next one is a tiny slide, not a section.
    if (next !== undefined && next - unique[i] < height * 0.35) continue;
    cleaned.push(unique[i]);
  }
  if (cleaned[0] !== 0) cleaned.unshift(0);
  if (cleaned[cleaned.length - 1] !== maxScroll) cleaned.push(maxScroll);

  const expanded = [];
  for (let i = 0; i < cleaned.length; i += 1) {
    expanded.push(cleaned[i]);
    const next = cleaned[i + 1];
    if (next !== undefined && next - cleaned[i] > height * 2.2) {
      expanded.push(Math.round((cleaned[i] + next) / 2));
    }
  }

  if (expanded.length <= 9) return expanded;
  const capped = [expanded[0]];
  for (let i = 1; i < 8; i += 1) {
    capped.push(expanded[Math.round((i * (expanded.length - 1)) / 8)]);
  }
  capped.push(expanded[expanded.length - 1]);
  return [...new Set(capped)].sort((a, b) => a - b);
}

export function buildDwellPlan(stops) {
  const segments = [];
  let cursor = 0;
  for (let i = 0; i < stops.length; i += 1) {
    const isFirst = i === 0;
    const isLast = i === stops.length - 1;
    const hold = isFirst ? START_HOLD_MS : isLast ? END_HOLD_MS : HOLD_MS;
    segments.push({ kind: "hold", start: cursor, end: cursor + hold, y: stops[i] });
    cursor += hold;

    if (!isLast) {
      const distance = stops[i + 1] - stops[i];
      const move = Math.min(
        MAX_MOVE_MS,
        Math.max(MIN_MOVE_MS, (distance / MOVE_SPEED) * 1000),
      );
      segments.push({
        kind: "move",
        start: cursor,
        end: cursor + Math.round(move),
        from: stops[i],
        to: stops[i + 1],
      });
      cursor += Math.round(move);
    }
  }
  return { segments, durationMs: cursor };
}

function buildConcatList(frames) {
  const lines = ["ffconcat version 1.0"];
  for (let i = 0; i < frames.length; i += 1) {
    const frame = frames[i];
    const next = frames[i + 1];
    // The first frame can include the post-loader settle; keep the hero
    // dwell but ignore any extra dead time before the plan starts.
    const firstCap = (START_HOLD_MS + 300) / 1000;
    const duration = next
      ? Math.max(
          1 / 60,
          Math.min(i === 0 ? firstCap : 1, next.ts - frame.ts),
        )
      : END_HOLD_MS / 1000;
    lines.push(`file '${frame.file}'`);
    lines.push(`duration ${duration.toFixed(4)}`);
  }
  // The concat demuxer applies a file's duration when the next file starts;
  // repeat the last frame so the bottom hold survives.
  const last = frames[frames.length - 1];
  lines.push(`file '${last.file}'`);
  return `${lines.join("\n")}\n`;
}

/**
 * Records one route, assembles it, and returns its manifest entry.
 */
export async function recordSmoothScroll(
  browser,
  {
    url,
    finalHeight,
    frameDir,
    outputPath,
    publicSrc,
    stops = [],
  },
) {
  await rm(frameDir, { recursive: true, force: true });
  await mkdir(frameDir, { recursive: true });

  const { context, page } = await openPage(
    browser,
    { viewport: SCROLL_VIEWPORT, deviceScaleFactor: 1 },
    url,
  );

  try {
    await waitForPreloader(page);
    await dismissCookieBanners(page);

    // The site's custom cursor is a 12px fixed dot that sits at the centre in
    // a headless browser. It is chrome, not content.
    await page.evaluate(() => {
      for (const el of document.querySelectorAll("body *")) {
        const style = getComputedStyle(el);
        if (style.position !== "fixed" || style.pointerEvents !== "none") {
          continue;
        }
        const rect = el.getBoundingClientRect();
        if (rect.width <= 24 && rect.height <= 24) {
          el.style.display = "none";
        }
      }
    });

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await sleep(900);

    const cdp = await context.newCDPSession(page);
    await cdp.send("Page.enable");

    const frames = [];
    const writes = new Set();
    let index = 0;

    cdp.on("Page.screencastFrame", (event) => {
      const file = `frame-${String(index).padStart(5, "0")}.jpg`;
      frames.push({ file, ts: event.metadata.timestamp });
      index += 1;
      const write = writeFile(
        path.join(frameDir, file),
        Buffer.from(event.data, "base64"),
      ).finally(() => writes.delete(write));
      writes.add(write);
      cdp
        .send("Page.screencastFrameAck", { sessionId: event.sessionId })
        .catch(() => {});
    });

    await cdp.send("Page.startScreencast", {
      format: "jpeg",
      quality: 92,
      everyNthFrame: 1,
    });

    // A short beat so the screencast has a frame before the plan starts.
    await sleep(400);

    const maxScroll = Math.max(0, finalHeight - SCROLL_VIEWPORT.height);
    const dwellStops = buildDwellStops(stops, maxScroll);
    const plan = buildDwellPlan(dwellStops);
    console.log(
      `  dwells ${dwellStops.length}: ${dwellStops.join(", ")} ` +
        `(${(plan.durationMs / 1000).toFixed(1)}s)`,
    );

    await page.evaluate(
      async ({ segments, duration }) => {
        // Each segment is either a hold (the page is alive; its own
        // animations keep running) or an eased move. Sine easing per move
        // gives zero velocity at both ends, so the dwell feels like a hand
        // scroll that stopped to look, not a slider snap.
        window.__scrollSamples = [];
        const started = performance.now();
        let lastSample = 0;
        await new Promise((resolve) => {
          const tick = (now) => {
            const elapsed = Math.min(duration, now - started);
            const segment =
              segments.find(
                (s) => elapsed >= s.start && elapsed <= s.end,
              ) ?? segments[segments.length - 1];

            let y = segment.y;
            if (segment.kind === "move") {
              const t = Math.min(
                1,
                (elapsed - segment.start) /
                  Math.max(1, segment.end - segment.start),
              );
              y =
                segment.from +
                (segment.to - segment.from) * (0.5 - 0.5 * Math.cos(Math.PI * t));
            }

            const max = Math.max(
              0,
              Math.max(
                document.documentElement.scrollHeight,
                document.body ? document.body.scrollHeight : 0,
              ) - innerHeight,
            );
            window.scrollTo(0, Math.min(max, y));
            if (now - lastSample > 400) {
              window.__scrollSamples.push({
                t: Math.round(now - started),
                y: Math.round(window.scrollY),
              });
              lastSample = now;
            }
            if (elapsed < duration) requestAnimationFrame(tick);
            else resolve();
          };
          requestAnimationFrame(tick);
        });
        window.__scrollSamples.push({
          t: Math.round(performance.now() - started),
          y: Math.round(window.scrollY),
        });
      },
      { segments: plan.segments, duration: plan.durationMs },
    );

    const samples = await page
      .evaluate(() => window.__scrollSamples ?? [])
      .catch(() => []);
    const lastSample = samples[samples.length - 1];
    if (lastSample) {
      const seconds = lastSample.t / 1000;
      console.log(
        `  scroll path: ${lastSample.y}px in ${seconds.toFixed(1)}s ` +
          `· ${dwellStops.length} dwells`,
      );
    }

    await sleep(200);
    await cdp.send("Page.stopScreencast").catch(() => {});
    await sleep(300);
    await Promise.all([...writes]);

    if (frames.length < 10) {
      throw new Error(`Screencast only produced ${frames.length} frames`);
    }

    const listPath = path.join(frameDir, "frames.txt");
    await writeFile(listPath, buildConcatList(frames));

    run("ffmpeg", [
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      listPath,
      "-vf",
      `fps=${SCROLL_FPS},format=yuv420p`,
      "-c:v",
      "libx264",
      "-preset",
      "slow",
      "-crf",
      "12",
      "-movflags",
      "+faststart",
      "-an",
      outputPath,
    ]);

    const probe = JSON.parse(
      run("ffprobe", [
        "-v",
        "error",
        "-print_format",
        "json",
        "-show_streams",
        "-show_format",
        outputPath,
      ]),
    );
    const stream = probe.streams.find((s) => s.codec_type === "video");
    const duration = Number(probe.format.duration);

    await rm(frameDir, { recursive: true, force: true });

    return {
      src: publicSrc,
      width: Number(stream.width),
      height: Number(stream.height),
      duration,
      frames: frames.length,
      fps: SCROLL_FPS,
    };
  } finally {
    await context.close();
  }
}

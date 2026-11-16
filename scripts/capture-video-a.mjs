#!/usr/bin/env node
/**
 * Video A — a directed-scroll case-study clip captured from the live site.
 *
 * One recording per target: a quick preload pass (trimmed off), back to top,
 * then four eased hops with holds long enough for the site's own entrance
 * animations to land. The encoded file is 1280x800 VP9, silent, and the poster
 * is a 2x still from the archive anchor — deliberately not the hero still.
 *
 * Output stays in public/lab (a Phase 0 review surface); the production
 * public/work captures are never touched. Standalone: guards main() behind
 * direct invocation so the config can be imported by tests.
 */
import { execFileSync } from "node:child_process";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "@playwright/test";
import sharp from "sharp";

const DESKTOP = { width: 1440, height: 900 };
const OUT_ROOT = path.resolve("public", "lab", "video");

/** Scroll targets are absolute pixels, measured on the live page at 1440x900. */
export const DIRECTED_TARGETS = [
  {
    slug: "anom-creative",
    url: "https://anomcreative.com/",
    anchors: [
      { name: "hero", y: 0, hold: 1200 },
      { name: "intro", y: 940, hold: 850, glide: 900 },
      { name: "work", y: 3050, hold: 900, glide: 1200 },
      { name: "archive", y: 5439, hold: 900, glide: 1000 },
      { name: "clients", y: 7525, hold: 900, glide: 1200 },
      { name: "close", y: 9007, hold: 1100, glide: 1000 },
    ],
    posterAnchor: "archive",
  },
];

const HIDE_CSS = `
  html { scrollbar-width: none !important; }
  html::-webkit-scrollbar { display: none !important; }
  html { scroll-behavior: auto !important; }
  * { cursor: none !important; }
  [class*="cookie" i],
  [id*="cookie" i],
  [class*="consent" i],
  [id*="consent" i],
  [class*="chat" i],
  [id*="chat" i],
  [class*="intercom" i],
  [id*="intercom" i],
  [aria-label*="cookie" i],
  [class*="pointer-events-none"][class*="fixed"][class*="rounded-full"] {
    display: none !important;
  }
`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function preload(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(900);

  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 700) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(60);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(900);
}

/** Ease in-out with a rAF loop so the recording sees every intermediate frame. */
async function glideTo(page, from, to, duration) {
  await page.evaluate(
    ({ start, end, ms }) =>
      new Promise((resolve) => {
        const started = performance.now();
        const ease = (t) =>
          t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const frame = (now) => {
          const t = Math.min(1, (now - started) / ms);
          window.scrollTo(0, start + (end - start) * ease(t));
          if (t < 1) requestAnimationFrame(frame);
          else resolve();
        };
        requestAnimationFrame(frame);
      }),
    { start: from, end: to, ms: duration },
  );
}

async function captureTarget(browser, target) {
  await mkdir(OUT_ROOT, { recursive: true });

  const recordedAt = Date.now();
  const context = await browser.newContext({
    viewport: DESKTOP,
    deviceScaleFactor: 1,
    recordVideo: { dir: OUT_ROOT, size: DESKTOP },
  });
  const page = await context.newPage();
  await page.goto(target.url, { waitUntil: "load", timeout: 60_000 });
  await page.addStyleTag({ content: HIDE_CSS });

  // Footer/chat overlays can mount late; remove them once more after settle.
  await preload(page);
  await page.addStyleTag({ content: HIDE_CSS });

  const scrollStartedAt = Date.now();
  const introSeconds = Math.max(0, (scrollStartedAt - recordedAt) / 1000 - 0.15);

  let current = await page.evaluate(() => window.scrollY);
  const maxScroll = await page.evaluate(
    () => document.body.scrollHeight - window.innerHeight,
  );
  for (const anchor of target.anchors) {
    const destination = Math.min(anchor.y, maxScroll);
    if (Math.abs(destination - current) > 2) {
      await glideTo(page, current, destination, anchor.glide ?? 1000);
      current = destination;
    }
    await sleep(anchor.hold);

    if (anchor.name === target.posterAnchor) {
      // A 1x poster frame from the recording viewport is the fallback; the 2x
      // pass below replaces it with a crisp one.
      await page.screenshot({
        path: path.join(OUT_ROOT, `${target.slug}-poster-1x.png`),
      });
    }
  }

  const video = page.video();
  await context.close();
  const rawPath = await video.path();

  const webm = path.join(OUT_ROOT, `${target.slug}-directed.webm`);
  execFileSync("ffmpeg", [
    "-y",
    "-ss",
    introSeconds.toFixed(2),
    "-i",
    rawPath,
    "-c:v",
    "libvpx-vp9",
    "-crf",
    "30",
    "-b:v",
    "0",
    "-an",
    "-vf",
    "scale=1280:800",
    "-row-mt",
    "1",
    "-deadline",
    "good",
    "-cpu-used",
    "2",
    "-pix_fmt",
    "yuv420p",
    webm,
  ]);
  await rm(rawPath, { force: true });

  // 2x poster from the same anchored composition, without any clip chrome.
  const posterContext = await browser.newContext({
    viewport: DESKTOP,
    deviceScaleFactor: 2,
  });
  const posterPage = await posterContext.newPage();
  await posterPage.goto(target.url, { waitUntil: "load", timeout: 60_000 });
  await posterPage.addStyleTag({ content: HIDE_CSS });
  await preload(posterPage);
  const posterAnchor = target.anchors.find(
    (anchor) => anchor.name === target.posterAnchor,
  );
  if (posterAnchor) {
    await posterPage.evaluate((top) => window.scrollTo(0, top), posterAnchor.y);
    await posterPage.waitForTimeout(1200);
  }
  await posterPage.addStyleTag({ content: HIDE_CSS });
  const posterPng = await posterPage.screenshot();
  const poster = path.join(OUT_ROOT, `${target.slug}-poster.webp`);
  await sharp(posterPng).webp({ quality: 92, effort: 6 }).toFile(poster);
  await posterContext.close();

  const probe = execFileSync("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "v:0",
    "-show_entries",
    "stream=width,height,r_frame_rate,codec_name",
    "-show_entries",
    "format=duration,size",
    "-of",
    "json",
    webm,
  ]);
  const meta = JSON.parse(String(probe));
  const { size } = await stat(webm);
  const { size: posterSize } = await stat(poster);
  const info = {
    target: target.slug,
    video: {
      path: webm,
      bytes: size,
      duration: Number(meta.format?.duration ?? 0),
      width: meta.streams?.[0]?.width,
      height: meta.streams?.[0]?.height,
      codec: meta.streams?.[0]?.codec_name,
      fps: meta.streams?.[0]?.r_frame_rate,
    },
    poster: { path: poster, bytes: posterSize },
    trimmedIntroSeconds: Number(introSeconds.toFixed(2)),
  };
  await writeFile(
    path.join(OUT_ROOT, `${target.slug}.json`),
    `${JSON.stringify(info, null, 2)}\n`,
  );

  // The 1x screenshot was only a fallback during the recording.
  await rm(path.join(OUT_ROOT, `${target.slug}-poster-1x.png`), { force: true });

  return info;
}

async function main() {
  const browser = await chromium.launch();
  for (const target of DIRECTED_TARGETS) {
    process.stdout.write(`→ recording ${target.slug} …\n`);
    const info = await captureTarget(browser, target);
    process.stdout.write(`${JSON.stringify(info, null, 2)}\n`);
  }
  await browser.close();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

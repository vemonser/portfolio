#!/usr/bin/env node
/**
 * Captures real media for every live project into public/work/<slug>/.
 * Re-runnable (idempotent): overwrites its own output. Run `pnpm capture:work`
 * whenever a live site changes. Standalone: guards main() behind direct
 * invocation so tests can import CAPTURE_TARGETS without launching a browser.
 */
import { execFileSync } from "node:child_process";
import { mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "@playwright/test";
import sharp from "sharp";

export const CAPTURE_TARGETS = [
  { slug: "anom-creative", url: "https://anomcreative.com/" },
  { slug: "fambam", url: "https://fambam.vemonser7.workers.dev/" },
  { slug: "advrt", url: "https://advrt.vercel.app/" },
  { slug: "al-ghaith", url: "https://alghaithac.com/" },
];

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const PUBLIC_ROOT = path.resolve("public", "work");

/** Wait for the page to settle, then scroll through once so lazy media
 *  loads, then return to top. Mirrors scripts/editorial-evidence.mjs. */
async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1200);
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 700) {
    await page.evaluate((value) => window.scrollTo(0, value), y);
    await page.waitForTimeout(70);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
}

async function scrollToFraction(page, fraction) {
  await page.evaluate(
    (f) =>
      window.scrollTo(
        0,
        (document.body.scrollHeight - window.innerHeight) * f,
      ),
    fraction,
  );
  await page.waitForTimeout(700); // let scroll-triggered animations finish
}

async function saveWebp(pngBuffer, outPath) {
  await sharp(pngBuffer).webp({ quality: 82 }).toFile(outPath);
}

async function captureStills(browser, target, outDir) {
  // Desktop — deviceScaleFactor 2 for crisp frames; video context stays 1×.
  const desktop = await browser.newContext({
    viewport: DESKTOP,
    deviceScaleFactor: 2,
  });
  const dPage = await desktop.newPage();
  await dPage.goto(target.url, { waitUntil: "load", timeout: 60_000 });
  await settle(dPage);
  await saveWebp(await dPage.screenshot({ type: "png" }), `${outDir}/hero.webp`);
  await scrollToFraction(dPage, 0.45);
  await saveWebp(await dPage.screenshot({ type: "png" }), `${outDir}/mid-1.webp`);
  await scrollToFraction(dPage, 0.9);
  await saveWebp(await dPage.screenshot({ type: "png" }), `${outDir}/mid-2.webp`);
  await desktop.close();

  // Mobile — three screens.
  const mobile = await browser.newContext({
    viewport: MOBILE,
    deviceScaleFactor: 2,
  });
  const mPage = await mobile.newPage();
  await mPage.goto(target.url, { waitUntil: "load", timeout: 60_000 });
  await settle(mPage);
  for (const [i, fraction] of [0, 0.5, 1].entries()) {
    await scrollToFraction(mPage, fraction);
    await saveWebp(await mPage.screenshot({ type: "png" }), `${outDir}/m-${i + 1}.webp`);
  }
  await mobile.close();
}

async function captureVideo(browser, target, outDir) {
  // Recording starts with the context, so slow pages accumulate dead time
  // before the first scroll. Remember that offset and trim it off below.
  const recordedAt = Date.now();
  const context = await browser.newContext({
    viewport: DESKTOP,
    recordVideo: { dir: outDir, size: DESKTOP },
  });
  const page = await context.newPage();
  await page.goto(target.url, { waitUntil: "load", timeout: 60_000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1200);
  const introSeconds = Math.max(0, (Date.now() - recordedAt) / 1000 - 0.3);

  // Slow programmatic scroll: ~8 s top → bottom in 60 steps.
  const steps = 60;
  const stepMs = 8000 / steps;
  for (let i = 1; i <= steps; i += 1) {
    await page.evaluate(
      (f) =>
        window.scrollTo(
          0,
          (document.body.scrollHeight - window.innerHeight) * f,
        ),
      i / steps,
    );
    await page.waitForTimeout(stepMs);
  }
  await page.waitForTimeout(600);

  const video = page.video();
  await context.close();
  const rawPath = await video.path();

  // Compress: VP8, no audio, 1280 wide, constrained quality → ~1 MB for 9 s.
  execFileSync("ffmpeg", [
    "-y", "-ss", introSeconds.toFixed(2), "-i", rawPath,
    "-c:v", "libvpx", "-crf", "34", "-b:v", "0", "-an",
    "-vf", "scale=1280:-2",
    "-deadline", "good", "-cpu-used", "2",
    path.join(outDir, "scroll.webm"),
  ]);
  await rm(rawPath, { force: true });
}

async function main() {
  const browser = await chromium.launch();
  for (const target of CAPTURE_TARGETS) {
    const outDir = path.join(PUBLIC_ROOT, target.slug);
    await mkdir(outDir, { recursive: true });
    process.stdout.write(`→ ${target.slug} …\n`);
    await captureStills(browser, target, outDir);
    await captureVideo(browser, target, outDir);
  }
  await browser.close();

  // Report sizes so a blown budget is visible immediately.
  for (const target of CAPTURE_TARGETS) {
    const outDir = path.join(PUBLIC_ROOT, target.slug);
    const files = await Promise.all(
      ["hero.webp", "mid-1.webp", "mid-2.webp", "m-1.webp", "m-2.webp",
        "m-3.webp", "scroll.webm"].map(async (name) => {
        const { size } = await stat(path.join(outDir, name));
        return `${name}: ${(size / 1024).toFixed(0)} KiB`;
      }),
    );
    process.stdout.write(`${target.slug}\n  ${files.join("\n  ")}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

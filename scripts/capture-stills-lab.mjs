#!/usr/bin/env node
/**
 * Still-capture lab for the new art direction.
 *
 * One project, five frames: cover (scroll 0), section A (the intro statement),
 * section B (the archive grid), a 16:10 detail crop from that grid, and a
 * three-screen mobile composite. Every frame is settled: reduced motion, fonts
 * and images ready, banners/chat/scrollbar/cursor hidden, animations at their
 * end state, 2x DPR, 16:10.
 *
 * Output stays in public/lab/stills; public/work is untouched.
 */
import { mkdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "@playwright/test";
import sharp from "sharp";

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const OUT_ROOT = path.resolve("public", "lab", "stills");

export const STILL_TARGETS = [
  {
    slug: "anom-creative",
    url: "https://anomcreative.com/",
    frames: {
      cover: { y: 0 },
      sectionA: { y: 940 },
      sectionB: { y: 5290 },
    },
    // CSS-pixel crop of the archive grid, 16:10, from the 2x section B frame.
    detail: { x: 36, y: 370, width: 760, height: 475 },
    mobile: [0, 0.32, 0.62],  },
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

async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  await page.waitForTimeout(900);

  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 700) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(60);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(700);
}

async function shoot(page, file) {
  // `animations: disabled` fast-forwards finite entrance animations to their
  // settled state; infinite loops stop on their initial frame.
  const png = await page.screenshot({ animations: "disabled" });
  await sharp(png).webp({ quality: 92, effort: 6 }).toFile(file);
  return file;
}

async function captureDesktop(browser, target) {
  const context = await browser.newContext({
    viewport: DESKTOP,
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(target.url, { waitUntil: "load", timeout: 60_000 });
  await page.addStyleTag({ content: HIDE_CSS });
  await settle(page);
  await page.addStyleTag({ content: HIDE_CSS });

  const outDir = path.join(OUT_ROOT, target.slug);
  await mkdir(outDir, { recursive: true });

  const files = {};

  for (const [name, anchor] of Object.entries(target.frames)) {
    await page.evaluate((top) => window.scrollTo(0, top), anchor.y);
    await page.waitForTimeout(1100);
    await page.addStyleTag({ content: HIDE_CSS });
    files[name] = await shoot(page, path.join(outDir, `${name}.webp`));
  }

  // The detail is a crop of the archive frame at 2x.
  const sectionB = path.join(outDir, "sectionB.webp");
  const crop = target.detail;
  files.detail = path.join(outDir, "detail.webp");
  await sharp(sectionB)
    .extract({
      left: crop.x * 2,
      top: crop.y * 2,
      width: crop.width * 2,
      height: crop.height * 2,
    })
    .resize(1600, 1000)
    .webp({ quality: 92, effort: 6 })
    .toFile(files.detail);

  await context.close();
  return { files, outDir };
}

async function captureMobile(browser, target, outDir) {
  const context = await browser.newContext({
    viewport: MOBILE,
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await page.goto(target.url, { waitUntil: "load", timeout: 60_000 });
  await page.addStyleTag({ content: HIDE_CSS });
  await settle(page);
  await page.addStyleTag({ content: HIDE_CSS });

  const maxScroll = await page.evaluate(
    () => document.body.scrollHeight - window.innerHeight,
  );
  const screens = [];
  for (const fraction of target.mobile) {
    await page.evaluate((top) => window.scrollTo(0, top), maxScroll * fraction);
    await page.waitForTimeout(1000);
    await page.addStyleTag({ content: HIDE_CSS });
    const png = await page.screenshot({ animations: "disabled" });
    screens.push(png);
  }
  await context.close();

  // Three phones on a 1600x1000 charcoal sheet, 16:10.
  const phoneHeight = 900;
  const phoneWidth = Math.round((MOBILE.width / MOBILE.height) * phoneHeight);
  const gap = 40;
  const total = phoneWidth * 3 + gap * 2;
  const left = Math.round((1600 - total) / 2);
  const composites = await Promise.all(
    screens.map(async (png, index) => ({
      input: await sharp(png)
        .resize(phoneWidth, phoneHeight, { fit: "cover" })
        .toBuffer(),
      left: left + index * (phoneWidth + gap),
      top: 50,
    })),
  );

  const mobileFile = path.join(outDir, "mobile-trio.webp");
  await sharp({
    create: {
      width: 1600,
      height: 1000,
      channels: 3,
      background: { r: 11, g: 11, b: 10 },
    },
  })
    .composite(composites)
    .webp({ quality: 92, effort: 6 })
    .toFile(mobileFile);

  return { file: mobileFile, phoneWidth, phoneHeight };
}

async function main() {
  const browser = await chromium.launch();
  try {
    for (const target of STILL_TARGETS) {
      process.stdout.write(`→ stills ${target.slug} …\n`);
      const { files, outDir } = await captureDesktop(browser, target);
      const mobile = await captureMobile(browser, target, outDir);

      const records = {};
      for (const [name, file] of Object.entries(files)) {
        const { size } = await stat(file);
        const meta = await sharp(file).metadata();
        records[name] = {
          path: file,
          bytes: size,
          width: meta.width,
          height: meta.height,
        };
      }
      const mobileMeta = await sharp(mobile.file).metadata();
      const mobileSize = await stat(mobile.file);
      records.mobile = {
        path: mobile.file,
        bytes: mobileSize.size,
        width: mobileMeta.width,
        height: mobileMeta.height,
        phone: [mobile.phoneWidth, mobile.phoneHeight],
      };

      await writeFile(
        path.join(outDir, "stills.json"),
        `${JSON.stringify({ target: target.slug, frames: records }, null, 2)}\n`,
      );
      process.stdout.write(`${JSON.stringify(records, null, 2)}\n`);
    }
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

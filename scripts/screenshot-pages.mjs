#!/usr/bin/env node
/**
 * Responsive screenshot sweep.
 *
 * Captures a full-page screenshot of every public route at each common
 * viewport size, scrolling each page first so scroll-triggered reveal
 * animations settle into their final state.
 *
 *   node scripts/screenshot-pages.mjs [outDir]
 *
 * Requires a running dev server (default http://localhost:3000).
 */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.argv[2] ?? "/tmp/opencode/portfolio-shots";

// [label, width, height] — the most common device viewports.
const VIEWPORTS = [
  ["mobile-sm", 360, 640],
  ["mobile", 390, 844],
  ["tablet", 768, 1024],
  ["laptop", 1366, 768],
  ["desktop", 1920, 1080],
  ["wide", 2560, 1440],
];

const ROUTES = [
  ["home", "/"],
  ["work", "/work"],
  ["about", "/about"],
  ["blog", "/blog"],
  ["contact", "/contact"],
  ["work-anom-creative", "/work/anom-creative"],
  ["work-fambam", "/work/fambam"],
  ["work-advrt", "/work/advrt"],
  ["work-al-ghaith", "/work/al-ghaith"],
  ["blog-two-directions", "/blog/two-directions"],
  ["blog-calm-motion", "/blog/calm-motion"],
];

const slug = (s) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");

async function settle(page) {
  // Walk the page in steps to fire IntersectionObserver / ScrollTrigger reveals,
  // then return to the top so the full-page shot starts from the hero.
  await page.evaluate(async () => {
    const step = Math.floor(window.innerHeight * 0.75);
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    const max = document.body.scrollHeight;
    for (let y = 0; y <= max; y += step) {
      window.scrollTo(0, y);
      await sleep(140);
    }
    window.scrollTo(0, 0);
    await sleep(300);
  });
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const results = [];

  for (const [vpLabel, width, height] of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();

    for (const [routeLabel, path] of ROUTES) {
      const url = `${BASE}${path}`;
      const file = join(OUT, `${vpLabel}__${slug(routeLabel)}.png`);
      try {
        const res = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
        await page.waitForTimeout(800); // fonts + first paint of WebGL/GSAP
        await settle(page);
        await page.screenshot({ path: file, fullPage: true });
        results.push({ vp: vpLabel, size: `${width}x${height}`, route: path, status: res?.status() ?? "ok", file });
        console.log(`ok  ${vpLabel}  ${path}  (${res?.status() ?? "?"})`);
      } catch (err) {
        results.push({ vp: vpLabel, size: `${width}x${height}`, route: path, status: "ERROR", error: String(err), file });
        console.error(`ERR ${vpLabel}  ${path}  ${err}`);
      }
    }
    await context.close();
  }

  await browser.close();
  const failures = results.filter((r) => r.status === "ERROR" || (typeof r.status === "number" && r.status >= 400));
  console.log(`\nDone. ${results.length} shots -> ${OUT}`);
  if (failures.length) {
    console.log(`Failures (${failures.length}):`);
    for (const f of failures) console.log(`  ${f.vp} ${f.route} -> ${f.status} ${f.error ?? ""}`);
    process.exitCode = 1;
  }
}

main();
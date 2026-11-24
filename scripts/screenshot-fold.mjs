#!/usr/bin/env node
/** Above-the-fold (viewport-only) captures for quick responsive QA. */
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = process.argv[2] ?? "/tmp/opencode/portfolio-fold";

const VIEWPORTS = [
  ["mobile-sm", 360, 640],
  ["mobile", 390, 844],
  ["tablet", 768, 1024],
  ["laptop", 1366, 768],
  ["desktop", 1920, 1080],
  ["wide", 2560, 1440],
];
const ROUTES = [
  ["home", "/"], ["work", "/work"], ["about", "/about"], ["blog", "/blog"],
  ["contact", "/contact"], ["work-anom-creative", "/work/anom-creative"],
  ["work-fambam", "/work/fambam"], ["work-advrt", "/work/advrt"],
  ["work-al-ghaith", "/work/al-ghaith"], ["blog-two-directions", "/blog/two-directions"],
  ["blog-calm-motion", "/blog/calm-motion"],
];
const slug = (s) => s.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");

await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
for (const [vpLabel, width, height] of VIEWPORTS) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await context.newPage();
  for (const [routeLabel, path] of ROUTES) {
    try {
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 45000 });
      await page.waitForTimeout(900);
      await page.screenshot({ path: join(OUT, `${vpLabel}__${slug(routeLabel)}.png`), fullPage: false });
      console.log(`ok  ${vpLabel}  ${path}`);
    } catch (e) { console.error(`ERR ${vpLabel} ${path} ${e}`); }
  }
  await context.close();
}
await browser.close();
console.log(`fold shots -> ${OUT}`);
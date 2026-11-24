#!/usr/bin/env node
/**
 * Objective responsive-health checks per route × viewport.
 * Flags horizontal overflow, elements spilling outside the viewport,
 * broken images, and console errors. No vision required.
 *
 *   node scripts/responsive-check.mjs
 */
import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const VIEWPORTS = [
  ["mobile-sm", 360, 640], ["mobile", 390, 844], ["tablet", 768, 1024],
  ["laptop", 1366, 768], ["desktop", 1920, 1080], ["wide", 2560, 1440],
];
const ROUTES = [
  ["home", "/"], ["work", "/work"], ["about", "/about"], ["blog", "/blog"],
  ["contact", "/contact"], ["work-anom-creative", "/work/anom-creative"],
  ["work-fambam", "/work/fambam"], ["work-advrt", "/work/advrt"],
  ["work-al-ghaith", "/work/al-ghaith"], ["blog-two-directions", "/blog/two-directions"],
  ["blog-calm-motion", "/blog/calm-motion"],
];

const probe = () => {
  const vw = window.innerWidth;
  const docOverflow = document.documentElement.scrollWidth - vw;
  const offenders = [];
  for (const el of document.querySelectorAll("body *")) {
    const cs = getComputedStyle(el);
    if (cs.position === "fixed") continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const over = Math.round(r.right - vw);
    if (over > 2 && r.width > 4) {
      offenders.push({
        tag: el.tagName.toLowerCase(),
        cls: (el.className || "").toString().slice(0, 48),
        right: Math.round(r.right), over,
      });
    }
  }
  offenders.sort((a, b) => b.over - a.over);
  const brokenImgs = [...document.images]
    .filter((i) => i.complete && i.currentSrc && i.naturalWidth === 0)
    .map((i) => i.currentSrc).slice(0, 6);
  return {
    docOverflow,
    offenders: offenders.slice(0, 5),
    offenderCount: offenders.length,
    brokenImgs,
    imgCount: document.images.length,
  };
};

const browser = await chromium.launch();
let issues = 0;
const rows = [];
for (const [vp, width, height] of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 120)); });
  page.on("pageerror", (e) => errors.push("PAGEERROR " + String(e).slice(0, 120)));
  for (const [label, path] of ROUTES) {
    errors.length = 0;
    try {
      await page.goto(`${BASE}${path}`, { waitUntil: "networkidle", timeout: 45000 });
      await page.waitForTimeout(700);
      const r = await page.evaluate(probe);
      const bad = r.docOverflow > 2 || r.offenderCount > 0 || r.brokenImgs.length > 0 || errors.length > 0;
      if (bad) issues++;
      rows.push({ vp, width, label, path, ...r, errors: [...errors], bad });
    } catch (e) {
      issues++;
      rows.push({ vp, width, label, path, bad: true, fatal: String(e).slice(0, 120) });
    }
  }
  await ctx.close();
}
await browser.close();

for (const r of rows) {
  if (!r.bad) continue;
  console.log(`\n[${r.vp} ${r.width}px] ${r.path}`);
  if (r.fatal) { console.log("  FATAL", r.fatal); continue; }
  if (r.docOverflow > 2) console.log(`  horizontal overflow: +${r.docOverflow}px (${r.offenderCount} elems)`);
  for (const o of r.offenders) console.log(`    <${o.tag} class="${o.cls}"> right=${o.right} (+${o.over})`);
  if (r.brokenImgs.length) console.log("  broken images:", r.brokenImgs.join(", "));
  if (r.errors.length) console.log("  console errors:", [...new Set(r.errors)].slice(0, 4).join(" | "));
}
console.log(`\n=== ${rows.length} checks, ${issues} with issues ===`);
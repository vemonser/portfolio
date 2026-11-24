#!/usr/bin/env node
/**
 * Build per-page montages: all viewports in one image per page.
 *
 *   node scripts/build-montages.mjs [shotsDir] [outDir]
 *
 * Each montage is a vertical stack of viewport screenshots, labeled with the
 * viewport name, scaled to a uniform width for readability.
 */
import { readdir, mkdir } from "node:fs/promises";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const SHOTS = process.argv[2] ?? "/tmp/opencode/portfolio-fold";
const OUT = process.argv[3] ?? "/tmp/opencode/portfolio-montages";

const VIEWPORTS = ["mobile-sm", "mobile", "tablet", "laptop", "desktop", "wide"];
const VIEWPORT_LABELS = {
  "mobile-sm": "Mobile SM (360px)",
  mobile: "Mobile (390px)",
  tablet: "Tablet (768px)",
  laptop: "Laptop (1366px)",
  desktop: "Desktop (1920px)",
  wide: "Wide (2560px)",
};

const PAGES = [
  "home", "work", "about", "blog", "contact",
  "work-anom-creative", "work-fambam", "work-advrt", "work-al-ghaith",
  "blog-two-directions", "blog-calm-motion",
];

await mkdir(OUT, { recursive: true });

for (const page of PAGES) {
  const images = [];
  for (const vp of VIEWPORTS) {
    const file = join(SHOTS, `${vp}__${page}.png`);
    try {
      await readdir(SHOTS);
      images.push({ vp, file, label: VIEWPORT_LABELS[vp] });
    } catch {
      // skip missing
    }
  }

  if (images.length === 0) {
    console.log(`skip ${page} (no images)`);
    continue;
  }

  // Build montage: each image scaled to 600px wide, stacked vertically with labels
  const montageFile = join(OUT, `${page}.png`);
  const args = [];
  for (const img of images) {
    args.push("-label", img.label, img.file);
  }
  args.push("-tile", "1x", "-geometry", "820x+10+10", "-background", "#1a1a1a", "-fill", "white", montageFile);

  try {
    execFileSync("montage", args, { stdio: "pipe" });
    console.log(`ok  ${page}.png`);
  } catch (e) {
    console.error(`ERR ${page}: ${e.message}`);
  }
}

console.log(`\nMontages -> ${OUT}`);
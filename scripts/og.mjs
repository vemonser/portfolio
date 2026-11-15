/**
 * Capture the shared Open Graph image from the real hero.
 *
 * Uses the running site so the type and the surface are the shipped ones, not a
 * mock-up. 1200x630 is the size every major network crops from; the header nav
 * and the grain plate are hidden so the card is the brand and the wordmark.
 *
 *   pnpm og        # against http://localhost:3100
 *   OG_URL=... pnpm og
 */
import { copyFileSync } from "node:fs";
import { chromium } from "@playwright/test";

const base = process.env.OG_URL ?? "http://localhost:3100";
const out = "src/app/opengraph-image.jpg";

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 1,
});

await page.goto(`${base}/`, { waitUntil: "networkidle" });
await page.addStyleTag({
  content: `
    .site-header__nav, .menu-trigger, .grain { display: none !important; }
  `,
});
await page.waitForTimeout(1800);
await page.screenshot({ path: out, type: "jpeg", quality: 88 });
copyFileSync(out, "src/app/twitter-image.jpg");

await browser.close();
console.log(`wrote ${out} and src/app/twitter-image.jpg`);

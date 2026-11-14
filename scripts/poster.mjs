/**
 * Regenerates the hero posters from the live scene.
 *
 * The poster is the first paint (and the whole page for a browser without
 * WebGL 2), so it has to be a real frame of the real material — not a mockup.
 * It captures the canvas element, which now paints the wordmark itself.
 *
 *   pnpm dev            # in one terminal
 *   pnpm poster         # in another
 *
 * Pass BASE_URL to point at a preview deployment.
 */
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";
import sharp from "sharp";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = path.join(process.cwd(), "public", "poster");

// `t` freezes the flow at a fixed second, so the same poster comes out every
// run. Each value is a frame chosen for a strong light/dark split.
const shots = [
  { name: "hero-1440", width: 1440, height: 900, dpr: 1, route: "/en?t=3" },
  { name: "hero-780", width: 390, height: 844, dpr: 2, route: "/ar?t=3" },
];

const SETTLE_MS = 900;

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();

try {
  for (const shot of shots) {
    const page = await browser.newPage({
      viewport: { width: shot.width, height: shot.height },
      deviceScaleFactor: shot.dpr,
    });

    await page.goto(`${BASE}${shot.route}`, { waitUntil: "networkidle" });
    await page.waitForSelector('[data-ready="true"]', { timeout: 20_000 });
    await page.waitForTimeout(SETTLE_MS);

    // Element screenshots capture whatever is painted over the box. The
    // wordmark is real HTML layered above the canvas, so it is hidden for the
    // capture — the poster is the liquid alone and the live text stays on top.
    await page.addStyleTag({
      content: `#hero-title, nextjs-portal { visibility: hidden !important; }`,
    });

    const buffer = await page.locator("canvas").screenshot({ omitBackground: true });

    const base = sharp(buffer).resize({ width: shot.width * shot.dpr, withoutEnlargement: true });

    await base
      .clone()
      .avif({ quality: 52, effort: 7 })
      .toFile(path.join(OUT, `${shot.name}.avif`));

    await base
      .clone()
      .webp({ quality: 78, effort: 6 })
      .toFile(path.join(OUT, `${shot.name}.webp`));

    await page.close();
  }
} finally {
  await browser.close();
}

for (const shot of shots) {
  for (const ext of ["avif", "webp"]) {
    const file = path.join(OUT, `${shot.name}.${ext}`);
    const { size } = await stat(file);
    console.log(`${shot.name}.${ext}  ${(size / 1024).toFixed(1)} KB`);
  }
}

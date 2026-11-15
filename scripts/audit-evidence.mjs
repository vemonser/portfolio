/**
 * Captures the screenshots the audit report cites, from a running build.
 *
 * The audit's claims are only worth what the frames behind them are worth, so
 * the shots are reproducible rather than hand-taken:
 *
 *   pnpm build && PORT=3100 pnpm start --port 3100
 *   BASE_URL=http://localhost:3100 node scripts/audit-evidence.mjs
 *
 * The first three frames are the header check: the hero poster used to have a
 * header baked into it, which flashed under the live one on every load.
 */
import { mkdir } from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3100";
const OUT = path.join(process.cwd(), "audit-shots");
const CHROME = [
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
];

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch({ args: CHROME });

try {
  const desktop = await browser.newPage({
    viewport: { width: 1440, height: 900 },
  });

  // First paint: the poster is visible before the live scene takes over.
  // The renderer may not have a frame yet at "commit", so each capture retries
  // once before the moment passes.
  await desktop.goto(`${BASE}/`, { waitUntil: "commit" });
  for (let frame = 0; frame < 3; frame += 1) {
    await desktop.waitForTimeout(120);
    const file = path.join(OUT, `audit-first-frame-1440-${frame}.png`);
    const clip = { x: 0, y: 0, width: 1440, height: 110 };
    try {
      await desktop.screenshot({ path: file, clip });
    } catch {
      await desktop.waitForTimeout(120);
      await desktop.screenshot({ path: file, clip });
    }
  }
  await desktop.close();

  const shots = [
    { name: "audit-hero-390", width: 390, height: 844 },
    { name: "audit-hero-1440", width: 1440, height: 900 },
  ];

  for (const shot of shots) {
    const page = await browser.newPage({
      viewport: { width: shot.width, height: shot.height },
    });
    await page.goto(`${BASE}/`, { waitUntil: "load" });
    await page.waitForTimeout(2600);
    await page.screenshot({ path: path.join(OUT, `${shot.name}.png`) });

    if (shot.width === 1440) {
      await page
        .locator('[data-section="selected-work"]')
        .scrollIntoViewIfNeeded();
      await page.waitForTimeout(1200);
      await page.screenshot({
        path: path.join(OUT, "audit-work-1440.png"),
      });

      await page
        .getByRole("link", { name: /see all projects/i })
        .scrollIntoViewIfNeeded();
      await page.waitForTimeout(1200);
      await page.screenshot({
        path: path.join(OUT, "audit-work-exit-1440.png"),
      });

      await page.locator('a[href="/contact"]').first().scrollIntoViewIfNeeded();
      await page.waitForTimeout(1200);
      await page.screenshot({
        path: path.join(OUT, "audit-cta-1440.png"),
      });
    } else {
      // The trigger must step aside while the page is being read downward.
      await page.waitForSelector('[data-ready="true"]', { timeout: 20_000 });
      await page.evaluate(() => window.scrollTo(0, 2400));
      await page.waitForTimeout(900);
      await page.screenshot({
        path: path.join(OUT, "audit-trigger-hidden-390.png"),
      });

      await page.evaluate(() =>
        window.scrollTo(0, document.documentElement.scrollHeight),
      );
      await page.waitForTimeout(1200);
      await page.screenshot({
        path: path.join(OUT, "audit-footer-390.png"),
      });
    }

    await page.close();
  }
} finally {
  await browser.close();
}

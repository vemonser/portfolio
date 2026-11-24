/**
 * Phase review captures for the polish pass.
 *
 * Usage: node scripts/polish-shots.mjs <outDir> [routes] [widths]
 *   routes: comma-separated paths (default: the six review surfaces)
 *   widths: comma-separated, e.g. "1440,390"
 *
 * Runs against a dev/start server already listening on PORT (default 3000).
 */
import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";

const out = process.argv[2] ?? ".quality/polish/shots";
const routes = (
  process.argv[3] ??
  "/,/work,/about,/contact,/work/anom-creative,/lab/hero"
).split(",");
const widths = (process.argv[4] ?? "1440,390").split(",").map(Number);
const PORT = Number(process.env.PORT ?? 3000);

await fs.mkdir(out, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

for (const route of routes) {
  for (const width of widths) {
    const height = width <= 430 ? 844 : 900;
    await page.setViewportSize({ width, height });
    await page.goto(`http://localhost:${PORT}${route}`, {
      waitUntil: "networkidle",
    });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(width <= 430 ? 1800 : 2500);

    const slug =
      route === "/" ? "home" : route.replace(/^\//, "").replace(/\//g, "-");
    await page.screenshot({
      path: path.join(out, `${slug}-${width}.png`),
      fullPage: false,
    });

    if (route === "/" && width === 1440) {
      const metrics = await page.evaluate(async () => {
        const nav = performance.getEntriesByType("navigation")[0];
        const lcp = performance.getEntriesByType(
          "largest-contentful-paint",
        ).at(-1);
        let frames = 0;
        const start = performance.now();
        await new Promise((resolve) => {
          const tick = () => {
            frames += 1;
            if (performance.now() - start < 2000) requestAnimationFrame(tick);
            else resolve();
          };
          requestAnimationFrame(tick);
        });
        return {
          domContentLoaded: Math.round(nav?.domContentLoadedEventEnd ?? 0),
          load: Math.round(nav?.loadEventEnd ?? 0),
          lcp: lcp ? Math.round(lcp.startTime) : null,
          fps: Number((frames / ((performance.now() - start) / 1000)).toFixed(1)),
        };
      });
      console.log("home metrics", JSON.stringify(metrics));
    }
  }
}

await browser.close();

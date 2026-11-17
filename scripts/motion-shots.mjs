import fs from "node:fs";
import path from "node:path";

import { chromium } from "@playwright/test";

/**
 * Captures the motion states used as visual evidence: the intro at two widths,
 * the menu mark at rest / mid-morph / settled, the lime hover, and the
 * reduced-motion path. Run against a dev or production server with:
 *
 *   node scripts/motion-shots.mjs .quality/runs/<id>/artifacts
 */
const OUT = process.argv[2] ?? ".quality/runs/motion-shots/artifacts";
const BASE = process.env.MOTION_BASE ?? "http://localhost:3000";

fs.mkdirSync(OUT, { recursive: true });

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, animations: "allow" });
  console.log(file);
}

async function seedIntro(page) {
  await page.addInitScript(() =>
    sessionStorage.setItem("site-intro-seen-v1", "1"),
  );
}

async function openMenu(page) {
  await page.locator(".menu-trigger").click();
}

const browser = await chromium.launch();

try {
  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(450);
    await shot(page, "intro-390-450ms");
    await page.waitForTimeout(450);
    await shot(page, "intro-390-900ms");
    await context.close();
  }

  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(900);
    await shot(page, "intro-1440-900ms");
    await context.close();
  }

  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage();
    await seedIntro(page);
    await page.goto(`${BASE}/`);
    await page.waitForSelector('.menu-trigger [data-lottie-ready="true"]');
    await shot(page, "menu-rest-390");

    await page.locator(".menu-trigger").hover();
    await page.waitForTimeout(250);
    await shot(page, "menu-hover-390");

    await openMenu(page);
    await page.waitForTimeout(320);
    await shot(page, "menu-open-mid-390");
    await page.waitForTimeout(650);
    await shot(page, "menu-open-390");

    await page.keyboard.press("Escape");
    await page.waitForTimeout(320);
    await shot(page, "menu-close-mid-390");
    await context.close();
  }

  {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();
    await seedIntro(page);
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(1500);
    await page.mouse.move(700, 400);
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(1500);
    await page.mouse.wheel(0, -150);
    await page.waitForTimeout(1200);

    // The trigger steps aside on downward scroll; nudge up until it returns.
    for (let i = 0; i < 2; i += 1) {
      if (await page.locator(".menu-trigger").isVisible()) break;
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(1000);
      await page.mouse.wheel(0, -150);
      await page.waitForTimeout(1200);
    }

    await page.locator(".menu-trigger").waitFor({
      state: "visible",
      timeout: 8000,
    });
    await page.waitForTimeout(600);
    await shot(page, "menu-rest-1440");

    await openMenu(page);
    await page.waitForTimeout(950);
    await shot(page, "menu-open-1440");
    await context.close();
  }

  {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/`);
    await page.waitForTimeout(350);
    await shot(page, "reduced-intro-390");

    await openMenu(page);
    await page.waitForTimeout(150);
    await shot(page, "reduced-menu-open-390");
    await context.close();
  }
} finally {
  await browser.close();
}

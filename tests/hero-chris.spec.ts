import { expect, test } from "@playwright/test";

const PLATE_GONE = { timeout: 15_000 };

test.describe("Chris hero lab", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("reveals the title only after the loader leaves", async ({ page }) => {
    await page.goto("/lab/hero?loader=1", { waitUntil: "domcontentloaded" });

    const ld = page.locator(".page-loader").first();
    const to = page.locator(".hero-line__row--to").first();

    await expect(ld).toBeVisible();
    const parked = await to.evaluate((el) => getComputedStyle(el).transform);
    expect(parked).not.toBe("none");

    await expect(ld).toBeHidden(PLATE_GONE);
    await expect
      .poll(() => to.evaluate((el) => getComputedStyle(el).transform))
      .not.toBe(parked);
  });
});

test.describe("Chris hero lab — reduced motion", () => {
  test.use({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });

  test("stays settled without animating", async ({ page }) => {
    await page.goto("/lab/hero?loader=1", { waitUntil: "domcontentloaded" });

    const to = page.locator(".hero-line__row--to").first();

    await page.waitForTimeout(2000);
    const settled = await to.evaluate((el) => getComputedStyle(el).transform);
    expect(settled).toBe("matrix(1, 0, 0, 1, 0, 0)");
  });
});
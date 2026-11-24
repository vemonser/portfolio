import { expect, test } from "./support/fixtures";

const MISSING = "/this-page-does-not-exist";

test.describe("not found", () => {
  test("returns 404 with the centered Lottie mark and no intro", async ({
    page,
  }) => {
    const response = await page.goto(MISSING);
    expect(response?.status()).toBe(404);

    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
    await expect(page.getByText(/This page doesn't exist/)).toBeVisible();
    await expect(
      page.getByRole("main").getByRole("link", { name: "Home", exact: true }),
    ).toBeVisible();

    const mark = page.locator(".not-found__mark");
    await expect(mark).toBeVisible();
    await expect(mark).toHaveAttribute("data-lottie-ready", "true", {
      timeout: 15_000,
    });
    await expect(mark.locator("svg")).toBeVisible();

    const box = await mark.boundingBox();
    const viewport = page.viewportSize();
    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();
    if (box && viewport) {
      expect(
        Math.abs(box.x + box.width / 2 - viewport.width / 2),
      ).toBeLessThan(2);
    }

    // The intro is gone, including its pre-paint gate and session key.
    await expect(page.locator(".site-intro")).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.dataset.intro),
    ).toBeUndefined();
    expect(
      await page.evaluate(() => sessionStorage.getItem("site-intro-seen-v1")),
    ).toBeNull();
  });

  test("keeps the mark and page intact with reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const response = await page.goto(MISSING);
    expect(response?.status()).toBe(404);

    const mark = page.locator(".not-found__mark");
    await expect(mark).toHaveAttribute("data-lottie-ready", "true", {
      timeout: 15_000,
    });
    await expect(mark.locator("svg")).toBeVisible();
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
  });

  test("has no horizontal overflow at 390 and 1440", async ({ page }) => {
    for (const width of [390, 1440]) {
      await page.setViewportSize({
        width,
        height: width === 390 ? 844 : 900,
      });
      await page.goto(MISSING);
      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    }
  });
});

import { expect, test } from "@playwright/test";

const INTRO = ".site-intro";

test.describe("first-session intro", () => {
  test("plays once, leaves, and does not return on reload", async ({
    page,
  }) => {
    await page.goto("/");

    const intro = page.locator(INTRO);
    await expect(intro).toBeVisible();
    await expect(intro).toHaveAttribute("data-state", /playing|leaving/, {
      // The first cold dev-server load can spend longer compiling the client
      // than the default expect timeout. The overlay is SSR, so this only
      // waits for hydration.
      timeout: 30_000,
    });
    await expect(intro.locator('[data-lottie-ready="true"]')).toHaveCount(1);

    const shownAt = Date.now();
    await expect(intro).toBeHidden({ timeout: 4_000 });
    // The overlay's own hold + exit are 1.4s. This bound also covers
    // hydration and the polling interval of the visibility assertion.
    expect(Date.now() - shownAt).toBeLessThan(2_200);

    // The intro is decorative: it never takes focus.
    const active = await page.evaluate(() => document.activeElement?.tagName);
    expect(["BODY", "HTML"]).toContain(active);

    await page.reload();
    await expect(intro).toBeHidden();
    await expect(page.locator("html")).not.toHaveAttribute("data-intro", "run");
  });

  test("leaves on the first interaction and lets the click through", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const intro = page.locator(INTRO);
    await expect(intro).toBeVisible();

    await page.locator(".menu-trigger").click();

    await expect(intro).toBeHidden({ timeout: 2_000 });
    await expect(page.locator("dialog#site-menu")).toHaveAttribute(
      "data-state",
      "open",
    );
  });

  test("skips itself for a reduced-motion visitor", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    // The pre-paint gate must never arm the cover.
    await expect(page.locator("html")).not.toHaveAttribute("data-intro", "run");
    await expect(page.locator(INTRO)).toBeHidden();
    await expect(page.locator("#hero")).toBeVisible();
  });

  test("leaves the page clean at 390 and 1440", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");

    const intro = page.locator(INTRO);
    await expect(intro).toBeHidden({ timeout: 4_000 });
    await expect(page.locator("#hero")).toBeVisible();

    const overflow = () =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );

    expect(await overflow()).toBeLessThanOrEqual(1);

    await page.setViewportSize({ width: 1440, height: 900 });
    expect(await overflow()).toBeLessThanOrEqual(1);
  });
});

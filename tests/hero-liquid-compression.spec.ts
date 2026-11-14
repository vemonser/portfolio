import { expect, test } from "@playwright/test";

const HERO = "#hero";
const WORDMARK = "[data-hero-wordmark]";
const CARD = '[data-compression-target="project"]';
const ACTIVE = `${HERO}[data-compression-active="true"]`;

const WIDTHS = [360, 390, 768, 1024, 1280, 1440, 1920];

/** The scene is lazy: give it the first frame before asserting on its state. */
async function openHero(page: import("@playwright/test").Page, path: string) {
  await page.goto(path);
  await page.locator(HERO).waitFor();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const stage = document.querySelector("[data-scene-state]");
        return stage?.getAttribute("data-scene-state") ?? "missing";
      }),
    )
    .not.toBe("idle");
}

test.describe("liquid compression", () => {
  test("keeps the canvas inside the hero", async ({ page }) => {
    await openHero(page, "/");

    await expect(page.locator(`${HERO} canvas`)).toHaveCount(1);
    const insideHero = await page
      .locator("canvas")
      .evaluate((node) => node.closest("#hero") !== null);
    expect(insideHero).toBe(true);
  });

  test("compresses on title hover and releases on leave", async ({ page }) => {
    await openHero(page, "/");

    await page.locator(WORDMARK).hover();
    await expect(page.locator(ACTIVE)).toHaveCount(1);
    await expect(page.locator(HERO)).toHaveAttribute(
      "data-compression-kind",
      "title",
    );

    await page.mouse.move(4, 4);
    await expect(page.locator(ACTIVE)).toHaveCount(0);
  });

  test("compresses around a visible project target", async ({ page }) => {
    await openHero(page, "/");

    const card = page.locator(CARD).first();
    await card.scrollIntoViewIfNeeded();
    await card.hover();

    await expect(page.locator(ACTIVE)).toHaveCount(1);
    await expect(page.locator(HERO)).toHaveAttribute(
      "data-compression-kind",
      "project",
    );
  });
});

test.describe("fallbacks", () => {
  test.use({ reducedMotion: "reduce" });

  test("reduced motion never activates pointer compression", async ({ page }) => {
    await openHero(page, "/");

    await page.locator(WORDMARK).hover();
    await page.waitForTimeout(250);

    await expect(page.locator(ACTIVE)).toHaveCount(0);
    await expect(page.locator(`${HERO} canvas`)).toHaveCount(1);
  });
});

test.describe("coarse pointer", () => {
  test.use({
    isMobile: true,
    hasTouch: true,
    viewport: { width: 390, height: 844 },
  });

  test("does not activate pointer compression", async ({ page }) => {
    await openHero(page, "/");

    await page.locator(WORDMARK).hover({ force: true });
    await page.waitForTimeout(250);

    await expect
      .poll(() =>
        page.evaluate(
          () =>
            window.matchMedia("(hover: hover) and (pointer: fine)").matches,
        ),
      )
      .toBe(false);
    await expect(page.locator(ACTIVE)).toHaveCount(0);
  });

  test("opening the menu pauses the scene", async ({ page }) => {
    await openHero(page, "/");

    await page.locator(".menu-trigger").click();
    await expect(page.locator("[data-scene-state]")).toHaveAttribute(
      "data-scene-state",
      "paused",
    );
  });
});

test.describe("responsive integrity", () => {
  test("no horizontal overflow at any required width", async ({ page }) => {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });
      await openHero(page, "/");

      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );

      expect(overflow, `overflow at ${width}px`).toBeLessThanOrEqual(1);
    }
  });
});

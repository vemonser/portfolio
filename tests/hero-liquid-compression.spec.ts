import type { Page } from "@playwright/test";
import { expect, test } from "./support/fixtures";

const HERO = "#hero";
const CANVAS = `${HERO} canvas.hero-scene`;

async function ready(page: Page) {
  await page.goto("/");
  await expect(page.locator(CANVAS)).toBeVisible();
  await page.waitForTimeout(1200);
}

test.describe("home hero", () => {
  test("renders one canvas with the three-line headline", async ({ page }) => {
    await ready(page);

    await expect(page.locator(CANVAS)).toHaveCount(1);
    await expect(page.locator(`${HERO} h1`)).toBeVisible();

    const lines = page.locator(".hero-home__line");
    await expect(lines).toHaveCount(3);

    const boxes = await lines.evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return {
          x: rect.x,
          top: rect.top,
          bottom: rect.bottom,
          height: rect.height,
        };
      }),
    );

    // One left edge for all three lines.
    for (const box of boxes) {
      expect(Math.abs(box.x - boxes[0].x)).toBeLessThanOrEqual(1);
    }

    // No line touches the next: the block's own leading keeps a gap.
    expect(boxes[1].top).toBeGreaterThanOrEqual(boxes[0].bottom);
    expect(boxes[2].top).toBeGreaterThanOrEqual(boxes[1].bottom);
  });

  test("keeps the note in its own right-hand column", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await ready(page);

    const headline = await page.locator(`${HERO} h1`).boundingBox();
    const note = await page.locator(".hero-home__note").boundingBox();
    expect(headline).not.toBeNull();
    expect(note).not.toBeNull();

    expect(note!.x).toBeGreaterThanOrEqual(headline!.x + headline!.width);
    expect(note!.y).toBeGreaterThanOrEqual(headline!.y);
    expect(note!.y + note!.height).toBeLessThanOrEqual(900);
  });

  test("anchors the meta row to the bottom of the first screen", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await ready(page);

    const meta = await page.locator(".hero-home__meta").boundingBox();
    expect(meta).not.toBeNull();
    expect(meta!.y + meta!.height).toBeGreaterThan(844);
    expect(meta!.y + meta!.height).toBeLessThanOrEqual(900);

    await expect(page.locator(".hero-home__meta")).toContainText("Cairo");
    await expect(page.locator(".hero-home__meta")).toContainText(
      "Available for work",
    );
    await expect(page.locator(".hero-home__scroll")).toContainText("Scroll");
  });

  test("caps the render scale and pauses off screen", async ({ page }) => {
    await ready(page);

    const scale = await page.evaluate(() => {
      const canvas = document.querySelector<HTMLCanvasElement>(
        "#hero canvas.hero-scene",
      );
      if (!canvas) return 0;
      return canvas.width / canvas.clientWidth;
    });
    expect(scale).toBeLessThanOrEqual(2);

    await expect(page.locator(CANVAS)).toHaveAttribute("data-running", "1");
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator(CANVAS)).toHaveAttribute("data-running", "0");
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("freezes the scene and hides the trail", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator(CANVAS)).toHaveAttribute(
        "data-motion",
        "frozen",
      );
      await expect(page.locator(CANVAS)).toHaveAttribute("data-running", "0");
    });
  });

  test.describe("touch pointer", () => {
    test.use({
      isMobile: true,
      hasTouch: true,
      viewport: { width: 390, height: 844 },
    });

    test("uses idle noise only, with no custom cursor", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator(CANVAS)).toHaveAttribute(
        "data-motion",
        "live",
      );
      await expect(page.locator(".cursor-layer")).toHaveCount(0);
    });
  });
});

test.describe("responsive integrity", () => {
  for (const width of [320, 360, 390, 768, 1024, 1280, 1440, 1920]) {
    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/");
      await expect(page.locator(CANVAS)).toBeVisible();

      const overflow = await page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      );
      expect(overflow, `overflow at ${width}px`).toBeLessThanOrEqual(1);
    });
  }
});

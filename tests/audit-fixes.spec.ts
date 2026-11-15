import { expect, test, type Page } from "@playwright/test";
import sharp from "sharp";

/**
 * Regression cover for AUDIT.md Phases 1 and 2. Each test names the audit
 * finding it protects, so a failure points at the defect, not just a pixel.
 */

async function hideHeroScenery(page: Page) {
  await page.evaluate(() => {
    document
      .querySelectorAll(
        "#hero canvas, #hero img, #hero picture, #hero [data-hero-meta], .grain",
      )
      .forEach((node) => {
        (node as HTMLElement).style.visibility = "hidden";
      });
  });
}

/** Bottom-most row that still carries wordmark ink, measured from pixels. */
async function lastInkRow(page: Page) {
  const buffer = await page.screenshot();
  const { data, info } = await sharp(buffer)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let y = info.height - 1; y >= 0; y -= 1) {
    let bright = 0;
    for (let x = 0; x < info.width; x += 1) {
      const i = (y * info.width + x) * 3;
      if (data[i] > 180 && data[i + 1] > 175 && data[i + 2] > 165) {
        bright += 1;
        if (bright >= 3) return y;
      }
    }
  }

  return -1;
}

test.describe("P1-1 hero wordmark", () => {
  for (const [width, height] of [
    [390, 800],
    [768, 900],
    [1440, 900],
    [1920, 900],
  ] as const) {
    test(`keeps its baseline clear of the fold at ${width}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");
      await page.waitForTimeout(2500);
      await hideHeroScenery(page);

      const viewportHeight = await page.evaluate(() => window.innerHeight);
      const ink = await lastInkRow(page);

      expect(ink).toBeGreaterThan(0);
      expect(ink).toBeLessThanOrEqual(viewportHeight - 6);
    });
  }
});

test.describe("P1-2 menu trigger clearance", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("steps aside while reading downward and returns on scroll up", async ({
    page,
  }) => {
    await page.goto("/");
    const trigger = page.locator(".menu-trigger");
    // Lenis owns the scroll position from its first frame; scrolling before
    // that is reset to zero, so wait for the scene to settle.
    await page.waitForSelector('[data-ready="true"]', { timeout: 20_000 });

    await page.evaluate(() => window.scrollTo(0, 2400));
    await page.waitForTimeout(700);
    await expect(trigger).toBeHidden();

    await page.evaluate(() => window.scrollTo(0, 1900));
    await page.waitForTimeout(700);
    await expect(trigger).toBeVisible();

    await trigger.click();
    await expect(page.locator("dialog#site-menu")).toHaveAttribute(
      "data-state",
      "open",
    );
  });
});

test.describe("P1-4 footer touch targets", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("every footer link is at least 44x44", async ({ page }) => {
    await page.goto("/");
    const boxes = await page.evaluate(() => {
      const footer = document.querySelector("footer");
      if (!footer) return [];
      return [...footer.querySelectorAll("a")].map((link) => {
        const rect = link.getBoundingClientRect();
        return {
          label: (link.textContent ?? "").trim(),
          width: rect.width,
          height: rect.height,
        };
      });
    });

    expect(boxes.length).toBeGreaterThan(0);
    for (const box of boxes) {
      expect(box.width, `${box.label} width`).toBeGreaterThanOrEqual(44);
      expect(box.height, `${box.label} height`).toBeGreaterThanOrEqual(44);
    }
  });
});

test.describe("P1-3 work sequence", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("runs as a compact two-row spread", async ({ page }) => {
    await page.goto("/");
    const geometry = await page.evaluate(() => {
      const section = document.querySelector(
        '[data-section="selected-work"]',
      ) as HTMLElement;
      const cards = [...section.querySelectorAll("[data-project]")].map(
        (card) => card.getBoundingClientRect(),
      );
      const tops = [...new Set(cards.map((rect) => Math.round(rect.top)))];
      return {
        height: section.getBoundingClientRect().height,
        rows: tops.length,
        cards: cards.length,
      };
    });

    expect(geometry.cards).toBe(4);
    expect(geometry.rows).toBeLessThanOrEqual(2);
    expect(geometry.height).toBeLessThan(2500);
  });
});

test.describe("P2-1 contact disc", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("centres its label and arrow as one block", async ({ page }) => {
    await page.goto("/");
    const disc = page.locator('a[href="/contact"]', { hasText: "Get in touch" });
    await disc.scrollIntoViewIfNeeded();
    await page.waitForTimeout(900);

    const layout = await disc.evaluate((node) => {
      const discRect = node.getBoundingClientRect();
      const children = [...node.children].map((child) =>
        child.getBoundingClientRect(),
      );
      const top = Math.min(...children.map((rect) => rect.top));
      const bottom = Math.max(...children.map((rect) => rect.bottom));
      const discCentre = discRect.top + discRect.height / 2;
      const blockCentre = top + (bottom - top) / 2;
      const gap =
        children.length > 1
          ? Math.max(
              Math.min(...children.slice(1).map((rect) => rect.top)) -
                Math.max(...children.slice(0, 1).map((rect) => rect.bottom)),
              0,
            )
          : 0;
      return { offset: Math.abs(discCentre - blockCentre), gap };
    });

    expect(layout.offset).toBeLessThanOrEqual(4);
    expect(layout.gap).toBeLessThanOrEqual(16);
  });
});

test.describe("P2-2 chapter numbering", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("gives the work chapter its own number", async ({ page }) => {
    await page.goto("/");
    const work = page.locator('[data-section="selected-work"]');
    await expect(work.locator(".chapter-label__index")).toHaveText("02");
  });
});

test.describe("P2-8 archive exit", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("marks 'See all projects' as an action", async ({ page }) => {
    await page.goto("/");
    const link = page.getByRole("link", { name: /see all projects/i });
    await expect(link).toContainText("↗");
  });
});

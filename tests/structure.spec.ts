import { expect, test } from "@playwright/test";

test.describe("About structure", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("renders the facts column and stack, and hides empty sections", async ({
    page,
  }) => {
    await page.goto("/about");

    await expect(page.locator('aside[aria-label="At a glance"]')).toBeVisible();
    await expect(page.locator("#stack-title")).toBeVisible();
    await expect(page.locator("#capabilities-title")).toBeVisible();
    await expect(page.locator('[data-section="capabilities"] li')).toHaveCount(4);

    // experience and cv are empty in src/content/about.ts, so no placeholder
    // section and no dead download link may ship.
    await expect(page.locator("#experience-title")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /download cv/i })).toHaveCount(0);
  });
});

test.describe("Work structure", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("uses one 16:10 cover ratio on the archive", async ({ page }) => {
    await page.goto("/work");

    const ratios = await page.locator("[data-project] img").evaluateAll((images) =>
      images.map((image) => {
        const rect = image.getBoundingClientRect();
        return rect.width / rect.height;
      }),
    );

    expect(ratios.length).toBeGreaterThan(0);
    for (const ratio of ratios) expect(ratio).toBeCloseTo(1.6, 1);
  });

  test("offers one live-site action per case study", async ({ page }) => {
    await page.goto("/work/anom-creative");

    await expect(
      page.getByRole("link", { name: /visit site/i }),
    ).toHaveCount(1);
  });
});

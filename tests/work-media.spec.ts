import { expect, test } from "@playwright/test";

test.describe("project cards (CRZ outside)", () => {
  test("crossfades to a second capture on hover", async ({ page }) => {
    await page.goto("/work");

    const card = page.locator("a[data-project='anom-creative']");
    await card.scrollIntoViewIfNeeded();
    await expect(card).toBeVisible();

    // Two captures, the second is the hover layer. (src is URL-encoded by
    // next/image, so match the filename only.)
    const imgs = card.locator("img");
    await expect(imgs).toHaveCount(2);
    await expect(imgs.nth(1)).toHaveAttribute("src", /mid-1\.webp/);

    // Crossfade: hidden by default, revealed on hover.
    await expect(imgs.nth(1)).toHaveCSS("opacity", "0");
    await card.hover();
    await expect(imgs.nth(1)).toHaveCSS("opacity", "1");
    await expect(imgs.nth(0)).toHaveCSS("opacity", "0");
  });

  test("the hero compression contract survives", async ({ page }) => {
    // Duplicate of the existing contract assertion, cheap insurance while
    // the card internals change.
    await page.goto("/");
    const card = page.locator("a[data-project]").first();
    await expect(card).toHaveAttribute("data-compression-target", "project");
  });
});

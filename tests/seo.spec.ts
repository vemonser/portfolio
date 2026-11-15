import { expect, test } from "@playwright/test";

test.describe("sharing surface", () => {
  test("the sitemap lists the archive and every project and post", async ({
    request,
  }) => {
    const response = await request.get("/sitemap.xml");
    expect(response.status()).toBe(200);

    const xml = await response.text();
    for (const path of ["/work", "/about", "/blog", "/work/anom-creative", "/blog/two-directions"]) {
      expect(xml).toContain(path);
    }
  });

  test("robots points at the sitemap", async ({ request }) => {
    const response = await request.get("/robots.txt");
    expect(response.status()).toBe(200);

    const body = await response.text();
    expect(body).toContain("Sitemap:");
    expect(body).toContain("/sitemap.xml");
  });

  test("a missing page renders the styled 404", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist");
    expect(response?.status()).toBe(404);

    await expect(page.locator("h1")).toHaveText("404");
    await expect(
      page.locator("main").getByRole("link", { name: "Work", exact: true }),
    ).toBeVisible();
    await expect(page.locator("main")).toHaveCount(1);
  });

  test("a route exposes a canonical URL and an Open Graph image", async ({
    page,
  }) => {
    await page.goto("/work");

    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      /\/work$/,
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
    await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
      "content",
      "summary_large_image",
    );
  });
});

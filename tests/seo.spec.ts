import { expect, test } from "./support/fixtures";

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

  test("exposes a dark theme color and RSS alternate", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      "content",
      "#0b0b0a",
    );
    await expect(
      page.locator('link[rel="alternate"][type="application/rss+xml"]'),
    ).toHaveAttribute("href", /\/feed\.xml$/);
  });

  test("publishes Person and WebSite structured data", async ({ page }) => {
    await page.goto("/");
    const types = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((nodes) =>
        nodes.flatMap((node) => {
          const data = JSON.parse(node.textContent || "{}");
          return data["@graph"]?.map((item: { "@type": string }) => item["@type"]) ?? [data["@type"]];
        }),
      );
    expect(types).toContain("Person");
    expect(types).toContain("WebSite");
  });

  test("project pages expose CreativeWork data and their own social image", async ({
    page,
    request,
  }) => {
    await page.goto("/work/anom-creative");
    const types = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((nodes) =>
        nodes.flatMap((node) => {
          const data = JSON.parse(node.textContent || "{}");
          return data["@graph"]?.map((item: { "@type": string }) => item["@type"]) ?? [data["@type"]];
        }),
      );
    expect(types).toContain("CreativeWork");
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /\/og\/anom-creative\.jpg/,
    );

    const image = await request.get("/og/anom-creative.jpg");
    expect(image.status()).toBe(200);
    expect(image.headers()["content-type"]).toContain("image/jpeg");
  });

  test("blog posts expose Article data and a generated social image", async ({
    page,
    request,
  }) => {
    await page.goto("/blog/calm-motion");
    const types = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((nodes) =>
        nodes.flatMap((node) => {
          const data = JSON.parse(node.textContent || "{}");
          return data["@graph"]?.map((item: { "@type": string }) => item["@type"]) ?? [data["@type"]];
        }),
      );
    expect(types).toContain("Article");
    const article = await page
      .locator('script[type="application/ld+json"]')
      .evaluateAll((nodes) => {
        for (const node of nodes) {
          const data = JSON.parse(node.textContent || "{}");
          if (data["@type"] === "Article") return data;
          const found = data["@graph"]?.find(
            (item: { "@type": string }) => item["@type"] === "Article",
          );
          if (found) return found;
        }
        return null;
      });
    expect(article?.image).toContain("/blog/calm-motion/opengraph-image");
    await expect(page.locator('meta[property="og:type"]')).toHaveAttribute(
      "content",
      "article",
    );
    await expect(page.locator('meta[property="article:published_time"]')).toHaveAttribute(
      "content",
      "2026-05-02",
    );
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /\/blog\/calm-motion\/opengraph-image/,
    );

    const image = await request.get("/blog/calm-motion/opengraph-image");
    expect(image.status()).toBe(200);
    expect(image.headers()["content-type"]).toContain("image/png");
  });

  test("serves an RSS feed with every post", async ({ request }) => {
    const response = await request.get("/feed.xml");
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("application/rss+xml");
    const xml = await response.text();
    expect(xml).toContain("Motion that settles");
    expect(xml).toContain("Designing for two directions at once");
    expect(xml).toContain("/blog/calm-motion");
  });
});

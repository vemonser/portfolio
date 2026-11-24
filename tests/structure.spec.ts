import { expect, test } from "./support/fixtures";

test.describe("About structure", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("renders the facts column and stack, and hides empty sections", async ({
    page,
  }) => {
    await page.goto("/about");

    await expect(page.locator('aside[aria-label="At a glance"]')).toBeVisible();
    await expect(page.locator("#stack-title")).toBeVisible();
    await expect(page.locator("#capabilities-title")).toBeVisible();

    const items = page.locator('[data-section="capabilities"] li');
    await expect(items).toHaveCount(4);

    // Two balanced columns: items 1 and 3 share a left edge, items 2 and 4
    // share the second, and the last item is not a full-width span.
    const boxes = await items.evaluateAll((nodes) =>
      nodes.map((node) => {
        const rect = node.getBoundingClientRect();
        return { x: Math.round(rect.x), width: Math.round(rect.width) };
      }),
    );
    expect(boxes[0].x).toBe(boxes[2].x);
    expect(boxes[1].x).toBe(boxes[3].x);
    expect(boxes[1].x).toBeGreaterThan(boxes[0].x);
    expect(boxes[3].width).toBe(boxes[1].width);

    // experience and cv are empty in src/content/about.ts, so no placeholder
    // section and no dead download link may ship.
    await expect(page.locator("#experience-title")).toHaveCount(0);
    await expect(page.getByRole("link", { name: /download cv/i })).toHaveCount(0);
  });
});

test.describe("chapter numbering", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("does not give the closing Contact block a second number", async ({
    page,
  }) => {
    await page.goto("/about");

    const cta = page.locator('[data-section="contact-cta"] .chapter-label');
    await expect(cta).toContainText("Contact");
    await expect(cta.locator(".chapter-label__index")).toHaveCount(0);

    await expect(page.locator("main .chapter-label__index")).toHaveText("04");

    await page.goto("/contact");
    await expect(page.locator("main .chapter-label__index")).toHaveText("05");
  });
});

test.describe("reading layout", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("the article shares one left edge and one measure", async ({ page }) => {
    await page.goto("/blog/two-directions");

    const h1 = await page.locator("h1").boundingBox();
    const firstParagraph = await page.locator(".prose-blog p").first().boundingBox();
    const back = await page.getByRole("link", { name: "All posts" }).boundingBox();

    expect(h1).not.toBeNull();
    expect(firstParagraph).not.toBeNull();
    expect(back).not.toBeNull();

    expect(Math.abs(h1!.x - firstParagraph!.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(h1!.x - back!.x)).toBeLessThanOrEqual(1);
  });

  test("does not repeat a project counter", async ({ page }) => {
    await page.goto("/work");

    const text = await page.locator("main").innerText();
    expect(text).not.toMatch(/P \/ \d/);
    expect(text).not.toMatch(/\b\d{2} — \d{2}\b/);
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("freezes the hero scene instead of starting the loop", async ({ page }) => {
    await page.goto("/");

    const canvas = page.locator("#hero canvas.hero-scene");
    await expect(canvas).toHaveAttribute("data-motion", "frozen");
    await expect(canvas).toHaveAttribute("data-running", "0");
  });
});

test.describe("Work structure", () => {  test.use({ viewport: { width: 1440, height: 900 } });

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

  test("offers the live site at the top and at the close", async ({ page }) => {
    await page.goto("/work/anom-creative");

    const links = page.getByRole("link", { name: /visit site/i });
    await expect(links).toHaveCount(2);
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute("href", "https://anomcreative.com/");
    }
  });
});

import { expect, test } from "./support/fixtures";

/**
 * Regression cover for AUDIT.md Phases 1 and 2. Each test names the audit
 * finding it protects, so a failure points at the defect, not just a pixel.
 */

test.describe("P1-1 hero composition", () => {
  for (const [width, height] of [
    [390, 800],
    [768, 900],
    [1440, 900],
    [1920, 900],
  ] as const) {
    test(`keeps the three lines inside the first screen at ${width}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);

      const boxes = await page.locator(".hero-home__line").evaluateAll(
        (nodes) =>
          nodes.map((node) => {
            const rect = node.getBoundingClientRect();
            return { left: rect.left, right: rect.right, bottom: rect.bottom };
          }),
      );

      expect(boxes).toHaveLength(3);
      for (const box of boxes) {
        expect(box.left).toBeGreaterThanOrEqual(0);
        expect(box.right).toBeLessThanOrEqual(width);
        expect(box.bottom).toBeLessThanOrEqual(height);
      }

      const meta = await page.locator(".hero-home__meta").boundingBox();
      expect(meta).not.toBeNull();
      expect(meta!.y + meta!.height).toBeLessThanOrEqual(height);
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
    // This test is about the trigger, not the renderer. Lenis owns the scroll
    // from its first frame; wait for its marker rather than for a WebGL frame,
    // so a machine without a GPU does not fail the navigation test.
    await page.waitForFunction(
      () => document.documentElement.classList.contains("lenis"),
      undefined,
      { timeout: 10_000 },
    );
    await page.waitForTimeout(300);

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
    const disc = page
      .locator('[data-section="contact-cta"]')
      .locator('a[href="/contact"]', { hasText: "Get in touch" });
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

test.describe("hero meta", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("replaces the circled arrow with corner meta", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator(".hero-circle")).toHaveCount(0);
    await expect(page.locator(".hero-home__meta")).toContainText("Cairo, Egypt");
    await expect(page.locator(".hero-home__meta")).toContainText(
      "Available for work",
    );
    await expect(page.locator(".hero-home__scroll")).toContainText("Scroll");
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

test.describe("hero first paint", () => {
  test.use({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });

  test("paints the wordmark without JavaScript", async ({ page }) => {
    // The h1 must be in the server response, not mounted by an effect.
    const html = await (await page.request.get("/")).text();
    expect(html).toContain('id="hero-title"');

    await page.goto("/");

    // With scripting off there is no hydration and no scene, and the h1 must
    // still be on screen, above the fold.
    await expect(page.locator("#hero-title")).toBeVisible();
    const box = await page.locator("#hero-title").boundingBox();
    expect(box).not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(900);
  });
});

test.describe("hero fit at 320", () => {
  test.use({ viewport: { width: 320, height: 800 } });

  test("does not clip the headline or overflow horizontally", async ({
    page,
  }) => {
    for (const width of [320, 360]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);

      const result = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        headline: [...document.querySelectorAll(".hero-home__line")].map(
          (node) => node.getBoundingClientRect().right,
        ),
      }));

      expect(result.scrollWidth - result.clientWidth).toBeLessThanOrEqual(1);
      for (const right of result.headline) {
        expect(right).toBeLessThanOrEqual(width);
      }
    }
  });
});

test.describe("header ground", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("scopes the scrim to the hero route", async ({ page }) => {
    await page.goto("/");
    const home = await page
      .locator(".site-header")
      .evaluate((node) => getComputedStyle(node, "::before").backgroundImage);
    expect(home).toContain("linear-gradient");

    await page.goto("/about");
    const about = await page
      .locator(".site-header")
      .evaluate((node) => getComputedStyle(node, "::before").content);
    expect(about).toBe("none");
  });
});

test.describe("English-only copy", () => {
  for (const route of ["/", "/work", "/about", "/contact", "/blog"]) {
    test(`${route} makes no bilingual claim`, async ({ page }) => {
      await page.goto(route);
      const text = await page.locator("body").innerText();
      expect(text).not.toMatch(/bilingual|two languages|\brtl\b/i);
    });
  }
});

test.describe("editorial voice", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("derives the archive count from the data", async ({ page }) => {
    await page.goto("/work");
    const count = await page.locator("[data-project]").count();
    const words = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];
    const lede = await page.locator("main h1 + p").innerText();
    expect(lede).toContain(`${words[count] ?? count} selected projects`);
  });

  test("keeps uppercase for labels and sentence case for spoken headings", async ({ page }) => {
    await page.goto("/contact");
    const contact = await page
      .locator("h1")
      .evaluate((node) => getComputedStyle(node).textTransform);
    expect(contact).toBe("none");

    // The display classes are assembled from constants; this proves Tailwind
    // kept the arbitrary clamp in the production stylesheet (7vw at 1440).
    const size = await page
      .locator("h1")
      .evaluate((node) => parseFloat(getComputedStyle(node).fontSize));
    expect(size).toBeGreaterThan(90);

    await page.goto("/blog/two-directions");
    const post = await page
      .locator("h1")
      .evaluate((node) => getComputedStyle(node).textTransform);
    expect(post).toBe("none");

    await page.goto("/work");
    const label = await page
      .locator("h1")
      .evaluate((node) => getComputedStyle(node).textTransform);
    expect(label).toBe("uppercase");
  });
});


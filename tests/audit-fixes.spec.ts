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

/** Bottom-most row that still carries wordmark ink, searched from `fromRow`. */
async function lastInkRow(page: Page, fromRow: number) {
  const buffer = await page.screenshot();
  const { data, info } = await sharp(buffer)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let y = info.height - 1; y >= fromRow; y -= 1) {
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
      // Only the bottom band can hold the wordmark; searching the whole frame
      // would let the header satisfy the check even if the wordmark vanished.
      const band = Math.floor(viewportHeight * 0.5);
      const ink = await lastInkRow(page, band);

      expect(ink).toBeGreaterThan(viewportHeight - 140);
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

test.describe("hero cleanup", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("shows the wordmark only", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("#hero [data-hero-meta]")).toHaveCount(0);
    await expect(
      page.locator("#hero").getByText("Available for work"),
    ).toHaveCount(0);
    await expect(page.locator("#hero").getByText("Cairo, Egypt")).toHaveCount(0);
    await expect(page.locator("#hero").getByText("Scroll", { exact: true })).toHaveCount(0);
  });
});

test.describe("poster cache busting", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("versions every poster URL", async ({ page }) => {
    await page.goto("/");
    const urls = await page.evaluate(() => {
      const picture = document.querySelector("#hero picture");
      if (!picture) return [];
      return [...picture.querySelectorAll("source, img")].map(
        (node) =>
          node.getAttribute("srcset") ?? node.getAttribute("src") ?? "",
      );
    });

    expect(urls.length).toBe(3);
    for (const url of urls) {
      // A regenerated poster keeps the same path, so the browser must be told
      // the bytes changed; otherwise an open tab keeps the old frame forever.
      expect(url).toMatch(/\?v=[a-f0-9]{8}/);
    }
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

  test("does not clip the wordmark", async ({ page }) => {
    for (const width of [320, 360]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(200);
      await hideHeroScenery(page);

      const buffer = await page.screenshot();
      const { data, info } = await sharp(buffer)
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });

      const brightInColumn = (x: number) => {
        for (let y = 120; y < info.height; y += 1) {
          const i = (y * info.width + x) * 3;
          if (data[i] > 180 && data[i + 1] > 175 && data[i + 2] > 165) return true;
        }
        return false;
      };

      // A clipped line leaves ink against the viewport edge.
      expect(brightInColumn(0), `ink at x=0 at ${width}px`).toBe(false);
      expect(
        brightInColumn(info.width - 1),
        `ink at x=${info.width - 1} at ${width}px`,
      ).toBe(false);
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


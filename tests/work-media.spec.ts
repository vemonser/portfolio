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

test.describe("case study (Dennis inside)", () => {
  const SLUG = "anom-creative";

  test("shows the media sequence with the real domain in the address bar", async ({ page }) => {
    await page.goto(`/work/${SLUG}`);

    const frames = page.locator(".browser-frame");
    await expect(frames.first()).toContainText("anomcreative.com");

    // Hero, video frame, and two mid shots are browser-framed.
    await expect(frames).toHaveCount(4);

    // Every capture fills the content width; one source set, no arbitrary
    // 78%-wide variant.
    await expect(frames.nth(3).locator("img")).toHaveAttribute(
      "sizes",
      "100vw",
    );

    // Three phone screens.
    await expect(page.locator(".phone-trio img")).toHaveCount(3);

    // Live-site pill in the header.
    const pill = page.getByRole("link", { name: /visit site/i }).first();
    await expect(pill).toHaveAttribute("href", "https://anomcreative.com/");
    await expect(pill).toHaveAttribute("target", "_blank");
  });

  test("video is muted, looping, and plays only in viewport", async ({ page }) => {
    await page.goto(`/work/${SLUG}`);

    const video = page.locator("video");
    await expect(video).toHaveCount(1);
    // React renders `muted` as a DOM property, not always an attribute —
    // assert the property. loop/playsinline are safe as attributes.
    expect(await video.evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
    await expect(video).toHaveAttribute("loop");
    await expect(video).toHaveAttribute("playsinline");

    await video.scrollIntoViewIfNeeded();
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
      .toBeGreaterThan(0);

    // Scrolled far past it — paused again.
    await page.locator("footer").scrollIntoViewIfNeeded();
    await expect
      .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
      .toBe(true);
  });
});

// Variant-scoped tests: `test.use` must sit at describe level.
test.describe("case study — reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("video never plays", async ({ page }) => {
    await page.goto(`/work/anom-creative`);

    const video = page.locator("video");
    await video.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    expect(await video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);
  });

  test("parallax stays static", async ({ page }) => {
    await page.goto(`/work/anom-creative`);

    const parallax = page.locator("[data-parallax]").first();
    await parallax.scrollIntoViewIfNeeded();
    await page.waitForTimeout(400);

    expect(
      await parallax.evaluate((el) => getComputedStyle(el).transform),
    ).toBe("none");
  });
});

test.describe("project cards — every project", () => {
  for (const route of ["/", "/work"]) {
    test(`renders two captures on every card at ${route}`, async ({ page }) => {
      await page.goto(route);

      const cards = page.locator("a[data-project]");
      await expect(cards).toHaveCount(4);

      for (let i = 0; i < 4; i += 1) {
        const imgs = cards.nth(i).locator("img");
        await expect(imgs).toHaveCount(2);
        await expect(imgs.nth(1)).toHaveAttribute("src", /mid-1\.webp/);
      }
    });
  }
});

test.describe("touched routes — narrow viewports", () => {
  for (const route of ["/", "/work"]) {
    for (const width of [360, 390]) {
      test.describe(`${route} at ${width}px`, () => {
        test.use({ viewport: { width, height: 844 } });

        test(`no horizontal overflow at ${width}px`, async ({ page }) => {
          await page.goto(route);
          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth,
          );
          expect(overflow).toBeLessThanOrEqual(1);
        });
      });
    }
  }
});

// One describe per width: `test.use` options merge within a suite, so a loop
// inside a single describe would silently run both tests at the last width.
for (const width of [360, 390]) {
  test.describe(`case study — ${width}px viewport`, () => {
    test.use({ viewport: { width, height: 844 } });

    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.goto(`/work/anom-creative`);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  });
}

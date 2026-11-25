import { expect, test } from "./support/fixtures";

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

  test("reveals both visit-site actions with the page copy", async ({
    page,
  }) => {
    await page.goto(`/work/${SLUG}`);

    const links = page.getByRole("link", { name: /visit site/i });
    await expect(links).toHaveCount(2);
    await expect(links.nth(0).locator(".text-reveal")).toHaveCount(1);
    await expect(links.nth(1).locator(".text-reveal")).toHaveCount(1);

    await links.nth(1).scrollIntoViewIfNeeded();
    await expect(links.nth(1).locator(".text-reveal")).toHaveAttribute(
      "data-revealed",
      "true",
      { timeout: 15_000 },
    );
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

test.describe("image reveal", () => {
  test("reveals a card only once it enters the viewport", async ({ page }) => {
    await page.goto("/work");

    const card = page.locator("a[data-project]").last();
    const overlay = card.locator("[data-overlay]");
    const scaleY = () =>
      overlay.evaluate((el) => {
        const matrix = new DOMMatrix(getComputedStyle(el).transform);
        return matrix.d;
      });

    // Wait for the cover to arm itself, then confirm it stays closed below
    // the fold — it must not uncover ahead of the reader just because the page
    // finished loading.
    await expect.poll(scaleY).toBeCloseTo(1, 2);
    await page.waitForTimeout(2500);
    expect(await scaleY()).toBeCloseTo(1, 2);

    await card.scrollIntoViewIfNeeded();
    await expect.poll(scaleY).toBeCloseTo(0, 2);
  });

  test("uncovers from the top edge down, without a fade or a slide", async ({
    page,
  }) => {
    await page.goto("/work");

    const card = page.locator("a[data-project]").last();
    const overlay = card.locator("[data-overlay]");
    const media = card.locator("[data-media]");
    const opacity = () => media.evaluate((el) => getComputedStyle(el).opacity);
    const scale = () =>
      media.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).a);

    await expect.poll(scale).toBeGreaterThan(1.05);
    expect(await opacity()).toBe("1");

    const scaleY = () =>
      overlay.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).d);

    await expect.poll(scaleY).toBeCloseTo(1, 2);

    // Start sampling while the card is still below the fold, then scroll. The
    // first frame is deterministically the closed cover; the reveal must fall
    // monotonically to 0 and the media must settle to exactly 1.
    const recordingPromise = card.evaluate(async (element) => {
      const overlay = element.querySelector<HTMLElement>("[data-overlay]");
      const media = element.querySelector<HTMLElement>("[data-media]");
      const read = () => ({
        cover: overlay
          ? new DOMMatrix(getComputedStyle(overlay).transform).d
          : 1,
        zoom: media
          ? new DOMMatrix(getComputedStyle(media).transform).a
          : 1,
      });
      const out: Array<{ cover: number; zoom: number }> = [];
      const t0 = performance.now();
      return await new Promise<typeof out>((resolve) => {
        const check = () => {
          out.push(read());
          if (performance.now() - t0 > 1800) {
            resolve(out);
            return;
          }
          requestAnimationFrame(check);
        };
        check();
      });
    });

    await card.scrollIntoViewIfNeeded();
    const recording = await recordingPromise;

    expect(recording.length).toBeGreaterThan(1);
    expect(recording[0].cover).toBeCloseTo(1, 1);
    expect(recording[recording.length - 1].cover).toBeLessThan(0.02);
    expect(recording[recording.length - 1].zoom).toBeCloseTo(1, 2);
    for (let i = 1; i < recording.length; i += 1) {
      expect(recording[i].cover).toBeLessThanOrEqual(
        recording[i - 1].cover + 0.02,
      );
    }
  });
});

test.describe("project image parallax", () => {
  test("moves the capture inside a fixed frame while scrolling", async ({
    page,
  }) => {
    await page.goto("/work");

    const card = page.locator("a[data-project]").first();
    const parallax = card.locator("[data-parallax]");
    const motion = card.locator("[data-parallax-motion]");

    await expect(parallax).toHaveCount(1);
    await expect(motion).toHaveCount(1);

    // Overscan is what lets the image drift without exposing a frame edge.
    const scale = await parallax.evaluate((el) => {
      const value = getComputedStyle(el).scale;
      return value === "none" ? 1 : Number.parseFloat(value);
    });
    expect(scale).toBeGreaterThan(1.05);

    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const before = await motion.evaluate(
      (el) => new DOMMatrix(getComputedStyle(el).transform).m42,
    );

    await page.evaluate(() => window.scrollBy(0, 280));
    await page.waitForTimeout(700);
    const after = await motion.evaluate(
      (el) => new DOMMatrix(getComputedStyle(el).transform).m42,
    );

    expect(Math.abs(after - before)).toBeGreaterThan(2);
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("keeps the capture static", async ({ page }) => {
      await page.goto("/work");

      const card = page.locator("a[data-project]").first();
      const parallax = card.locator("[data-parallax]");
      const motion = card.locator("[data-parallax-motion]");

      await expect(parallax).toHaveCount(1);
      await expect(motion).toHaveCount(1);
      expect(await parallax.evaluate((el) => getComputedStyle(el).scale)).toBe(
        "1",
      );
      expect(
        await motion.evaluate((el) => getComputedStyle(el).transform),
      ).toBe("none");
    });
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

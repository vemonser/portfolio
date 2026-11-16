import { expect, test, type Locator } from "@playwright/test";

/*
 * Phase 0 review surfaces. These are prototype routes, but the behaviours they
 * prove are the ones Phase 1/2 will ship: the DOM-text hand-off, the poster
 * path, the cursor roles and the native-cursor gates.
 */

async function setRange(locator: Locator, value: number) {
  await locator.evaluate((element, next) => {
    const input = element as HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;
    setter?.call(input, String(next));
    input.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}

test.describe("Hero C lab", () => {
  test("renders the fluid scene and hands the wordmark to the canvas", async ({
    page,
  }) => {
    await page.goto("/lab/hero-c");

    const stage = page.locator("[data-hero-c]");
    await expect(stage).toHaveAttribute("data-ready", "true", {
      timeout: 30_000,
    });
    await expect(stage).toHaveAttribute("data-text", "canvas");
    await expect(stage.locator("canvas")).toHaveCount(1);

    // The simulation grid is reported for the FPS evidence, and the control
    // panel is wired to the scene.
    await expect(stage).toHaveAttribute("data-sim", /^\d+x\d+$/, {
      timeout: 10_000,
    });
    await expect(stage).toHaveAttribute("data-fps", /^\d+$/, {
      timeout: 10_000,
    });

    const reveal = page.locator(".lab-panel input[type='range']").first();
    await setRange(reveal, 0.8);
    await expect(page.locator(".lab-panel output").first()).toHaveText("0.80");

    const energy = page.locator(".lab-panel input[type='range']").nth(1);
    await setRange(energy, 1.5);
    await expect(page.locator(".lab-panel output").nth(1)).toHaveText("1.50");

    // The splash and sweep buttons go through the same scene; neither may
    // throw or tear down the live frame.
    await page.getByRole("button", { name: "Splash" }).click();
    await page.getByRole("button", { name: "Sweep" }).click();
    await page.waitForTimeout(250);
    await expect(stage).toHaveAttribute("data-ready", "true");
  });

  test("poster mode renders one frame and no lab chrome", async ({ page }) => {
    await page.goto("/lab/hero-c?poster=0.35&t=2.4");

    const stage = page.locator("[data-hero-c]");
    await expect(stage).toHaveAttribute("data-ready", "true", {
      timeout: 30_000,
    });
    await expect(page.locator(".lab-panel")).toHaveCount(0);
    await expect(page.locator(".lab-metrics")).toHaveCount(0);
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("shows the frozen poster, not a live loop", async ({ page }) => {
      await page.goto("/lab/hero-c");

      const stage = page.locator("[data-hero-c]");
      await expect(stage).toHaveAttribute("data-ready", "true", {
        timeout: 30_000,
      });
      await expect(page.locator(".lab-panel-head strong")).toHaveText("POSTER");
    });
  });
  test.describe("no WebGL", () => {
    test("keeps the poster and the DOM wordmark", async ({ page }) => {
      await page.addInitScript(() => {
        const proto = HTMLCanvasElement.prototype as unknown as {
          getContext: (type: string, ...args: unknown[]) => unknown;
        };
        const original = proto.getContext.bind(proto);
        proto.getContext = (type, ...args) =>
          type === "webgl2" || type === "webgl"
            ? null
            : original(type, ...args);
      });

      await page.goto("/lab/hero-c");

      const stage = page.locator("[data-hero-c]");
      await expect(stage).toHaveAttribute("data-ready", "false");
      await expect(stage).toHaveAttribute("data-text", "dom");
      await expect(page.locator(".lab-badge")).toContainText("no WebGL2");
    });
  });
});

test.describe("review gallery", () => {
  test("links every prototype, embeds both clips and shows the numbers", async ({
    page,
  }) => {
    await page.goto("/lab");

    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Five prototypes",
    );
    await expect(page.locator('a[href="/lab/hero-c"]').first()).toBeVisible();
    await expect(page.locator('a[href="/lab/cursor"]').first()).toBeVisible();
    await expect(page.locator('a[href="/lab/hero-peel"]').first()).toBeVisible();
    await expect(page.locator("video")).toHaveCount(2);
    await expect(page.locator('img[alt="Hero C at rest"]')).toBeVisible();
    await expect(page.getByText("76 fps", { exact: false })).toBeVisible();
    await expect(page.getByText(/728 ms/).first()).toBeVisible();
  });
});

test.describe("Hero Peel lab", () => {
  test("starts covered, reveals once and resets", async ({ page }) => {
    await page.goto("/lab/hero-peel");

    const stage = page.locator("[data-hero-peel]");
    await expect(stage).toHaveAttribute("data-peeled", "false");
    await expect(page.locator(".peel-overlay")).toBeVisible();
    await expect(page.locator(".peel-overlay")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    await expect(page.locator("[data-peel-name]")).toHaveText(
      "software developer",
    );

    await page.getByRole("button", { name: "Reveal" }).click();
    await expect(stage).toHaveAttribute("data-peeled", "true");
    await expect(page.locator(".peel-overlay")).toHaveCSS("opacity", "0");

    // Reveal is idempotent; a second click must not re-open or throw.
    await page.getByRole("button", { name: "Reveal" }).click();
    await expect(stage).toHaveAttribute("data-peeled", "true");

    // One-way: moving the pointer over the revealed hero cannot restore it.
    await page.mouse.move(200, 300);
    await page.mouse.move(800, 500);
    await expect(stage).toHaveAttribute("data-peeled", "true");

    await page.getByRole("button", { name: "Reset" }).click();
    await expect(stage).toHaveAttribute("data-peeled", "false");
    await expect(page.locator(".peel-overlay")).toHaveCSS("opacity", "1");
    await expect
      .poll(async () => Number(await stage.getAttribute("data-coverage")))
      .toBeLessThan(0.05);
  });

  test("starts the fluid scene after the sheet is revealed", async ({
    page,
  }) => {
    await page.goto("/lab/hero-peel");

    const stage = page.locator("[data-hero-peel]");
    await expect(stage).toHaveAttribute("data-peeled", "false");

    // Click immediately: the dynamic scene import may still be in flight, so
    // this also covers the "peeled before the scene resolves" race.
    await page.getByRole("button", { name: "Reveal" }).click();
    await expect(stage).toHaveAttribute("data-peeled", "true");

    await expect
      .poll(
        async () => Number(await stage.getAttribute("data-fps")),
        { timeout: 20_000 },
      )
      .toBeGreaterThan(0);
  });

  test("plays the video after the sheet is revealed", async ({ page }) => {
    await page.goto("/lab/hero-peel");

    await page.getByRole("button", { name: "Video" }).click();
    await page.getByRole("button", { name: "Reveal" }).click();

    await expect
      .poll(() =>
        page
          .locator("video")
          .evaluate((element) => (element as HTMLVideoElement).paused),
      )
      .toBe(false);
    await expect
      .poll(() =>
        page
          .locator("video")
          .evaluate((element) => (element as HTMLVideoElement).currentTime),
      )
      .toBeGreaterThan(0);
  });

  test("pointer movement increases the revealed coverage", async ({ page }) => {
    await page.goto("/lab/hero-peel");

    const stage = page.locator("[data-hero-peel]");
    await expect(stage).toHaveAttribute("data-peeled", "false");

    const overlay = page.locator(".peel-overlay");
    const box = await overlay.boundingBox();
    if (!box) throw new Error("the peel overlay has no box");

    for (let i = 0; i < 16; i += 1) {
      await page.mouse.move(
        box.x + 220 + i * 55,
        box.y + 300 + Math.sin(i) * 70,
      );
      await page.waitForTimeout(24);
    }
    await page.waitForTimeout(250);

    const coverage = Number(await stage.getAttribute("data-coverage"));
    expect(coverage).toBeGreaterThan(0);
    expect(coverage).toBeLessThan(0.5);
  });

  test("switches between fluid and video content", async ({ page }) => {
    await page.goto("/lab/hero-peel");
    const stage = page.locator("[data-hero-peel]");

    await page.getByRole("button", { name: "Video" }).click();
    await expect(stage).toHaveAttribute("data-content", "video");
    await expect(page.locator("video")).toHaveCount(1);
    expect(
      await page
        .locator("video")
        .evaluate((element) => (element as HTMLVideoElement).paused),
    ).toBe(true);

    await page.getByRole("button", { name: "Fluid" }).click();
    await expect(stage).toHaveAttribute("data-content", "fluid");
    await expect(page.locator(".peel-fluid")).toHaveCount(1);
  });

  test("recolours the sheet and changes the edge treatment", async ({
    page,
  }) => {
    await page.goto("/lab/hero-peel");
    const stage = page.locator("[data-hero-peel]");

    await page.getByRole("button", { name: "Bone" }).click();
    await expect(stage).toHaveAttribute("data-color", "bone");

    await page.getByRole("button", { name: "Black" }).click();
    await expect(stage).toHaveAttribute("data-color", "black");

    await page.getByRole("button", { name: "Soft" }).click();
    await expect(stage).toHaveAttribute("data-edge", "soft");

    await page.getByRole("button", { name: "Torn" }).click();
    await expect(stage).toHaveAttribute("data-edge", "torn");
  });

  test.describe("no JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("the overlay never captures the page", async ({ page }) => {
      await page.goto("/lab/hero-peel");

      await expect(page.locator(".peel-overlay")).toHaveCSS(
        "pointer-events",
        "none",
      );
      await expect(page.locator("[data-peel-name]")).toBeAttached();
    });
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("starts revealed and does not require a pointer", async ({ page }) => {
      await page.goto("/lab/hero-peel");

      const stage = page.locator("[data-hero-peel]");
      await expect(stage).toHaveAttribute("data-peeled", "true");
      await expect(page.locator(".peel-overlay")).toHaveCSS("display", "none");
      await expect(page.locator(".lab-panel-head strong")).toHaveText("OPEN");
    });
  });
});

test.describe("custom cursor", () => {
  test("replaces the native cursor and maps every role", async ({ page }) => {
    await page.goto("/lab/cursor");
    const html = page.locator("html");

    await expect(html).toHaveAttribute("data-cursor", "on");
    await expect(html).toHaveAttribute("data-cursor-visible", "false");

    const link = page.getByRole("link", { name: "A normal link" });
    await link.scrollIntoViewIfNeeded();
    await link.hover();
    await expect(html).toHaveAttribute("data-cursor-state", "link");

    const view = page.locator('[data-cursor="view"]').first();
    await view.scrollIntoViewIfNeeded();
    await view.hover();
    await expect(html).toHaveAttribute("data-cursor-state", "view");
    await expect(page.locator(".cursor-label")).toHaveText("View");

    const play = page.locator('[data-cursor="play"]');
    await play.scrollIntoViewIfNeeded();
    await play.hover();
    await expect(html).toHaveAttribute("data-cursor-state", "play");
    await expect(page.locator(".cursor-label")).toHaveText("Play");

    const textField = page.locator("input[type='text']");
    await textField.scrollIntoViewIfNeeded();
    await textField.hover();
    await expect(html).toHaveAttribute("data-cursor-state", "text");
    expect(
      await textField.evaluate((element) => getComputedStyle(element).cursor),
    ).toBe("text");
    await expect(page.locator(".cursor-ring")).toHaveCSS("opacity", "0");

    const disabled = page.locator('[data-cursor="disabled"]');
    await disabled.scrollIntoViewIfNeeded();
    await disabled.hover();
    await expect(html).toHaveAttribute("data-cursor-state", "disabled");
  });

  test("the system-cursor escape hatch restores the OS pointer", async ({
    page,
  }) => {
    await page.goto("/lab/cursor");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-cursor", "on");

    await page.locator("aside button").click();
    await expect(html).toHaveAttribute("data-cursor", "off");
    expect(
      await page.evaluate(() => getComputedStyle(document.body).cursor),
    ).toBe("auto");

    // Toggling back must restore the custom layer and the hidden OS pointer.
    await page.locator("aside button").click();
    await expect(html).toHaveAttribute("data-cursor", "on");
    expect(
      await page.evaluate(() => getComputedStyle(document.body).cursor),
    ).toBe("none");
  });

  test("updates the role on scroll with a stationary pointer", async ({
    page,
  }) => {
    await page.goto("/lab/cursor");
    const html = page.locator("html");

    const view = page.locator('[data-cursor="view"]').first();
    await view.scrollIntoViewIfNeeded();
    await view.hover();
    await expect(html).toHaveAttribute("data-cursor-state", "view");

    // The pointer does not move; the page does. The role must not keep
    // pointing at an element that scrolled away.
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(html).not.toHaveAttribute("data-cursor-state", "view");
  });

  test("keeps the custom cursor above the menu dialog", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-cursor", "on");

    await page.locator(".menu-trigger").dispatchEvent("click");
    await expect(page.locator("dialog#site-menu")).toHaveAttribute(
      "data-state",
      "open",
    );

    await page.mouse.move(720, 300);
    await expect(page.locator(".cursor-dot")).toHaveCSS("opacity", "1");
    expect(
      await page
        .locator(".cursor-layer")
        .evaluate((element) => element.matches(":popover-open")),
    ).toBe(true);
  });

  test("mounts on the site and shows View on project cards", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-cursor", "on");
    expect(
      await page.evaluate(() => getComputedStyle(document.body).cursor),
    ).toBe("none");

    const card = page.locator('[data-compression-target="project"]').first();
    await card.scrollIntoViewIfNeeded();
    await card.hover();
    await expect(page.locator("html")).toHaveAttribute(
      "data-cursor-state",
      "view",
    );
  });

  test("clears a stale role when the window shrinks", async ({ page }) => {
    await page.goto("/lab/cursor");
    const html = page.locator("html");

    const view = page.locator('[data-cursor="view"]').first();
    await view.scrollIntoViewIfNeeded();
    await view.hover();
    await expect(html).toHaveAttribute("data-cursor-state", "view");

    // The stored pointer point is now outside the viewport; the role must not
    // keep pointing at an element that is no longer under it.
    await page.setViewportSize({ width: 500, height: 400 });
    await expect(html).not.toHaveAttribute("data-cursor-state", "view");
  });

  test("survives a client navigation", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "Work" }).first().click();

    await expect(page).toHaveURL(/\/work$/);
    await expect(page.locator("html")).toHaveAttribute("data-cursor", "on");
    await expect(page.locator(".cursor-dot")).toHaveCount(1);
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("snaps the ring to the pointer without a lerp", async ({ page }) => {
      await page.goto("/lab/cursor");
      await expect(page.locator(".cursor-ring")).toBeAttached();
      await page.mouse.move(320, 260);

      await expect
        .poll(() =>
          page
            .locator(".cursor-ring")
            .evaluate((element) => element.style.transform),
        )
        .toContain("320px");
    });
  });

  test.describe("touch", () => {
    test.use({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });

    test("never mounts the custom cursor", async ({ page }) => {
      await page.goto("/lab/cursor");
      await expect(page.locator(".cursor-dot, .cursor-ring")).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.dataset.cursor ?? null,
        ),
      ).toBeNull();
      expect(
        await page.evaluate(() => getComputedStyle(document.body).cursor),
      ).toBe("auto");
    });

    test("the live site never mounts it either", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator(".cursor-dot, .cursor-ring")).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.dataset.cursor ?? null,
        ),
      ).toBeNull();
    });
  });

  test.describe("no JavaScript", () => {
    test.use({ javaScriptEnabled: false });

    test("keeps the native pointer", async ({ page }) => {
      await page.goto("/lab/cursor");
      await expect(page.locator(".cursor-dot, .cursor-ring")).toHaveCount(0);
      expect(
        await page.evaluate(() => document.documentElement.dataset.cursor ?? null),
      ).toBeNull();
    });

    test("the live site keeps the native pointer", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator(".cursor-dot, .cursor-ring")).toHaveCount(0);
      expect(
        await page.evaluate(() => document.documentElement.dataset.cursor ?? null),
      ).toBeNull();
    });
  });
});

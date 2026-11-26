import type { Locator } from "@playwright/test";
import sharp from "sharp";
import { expect, test } from "./support/fixtures";

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
      "Six prototypes",
    );
    await expect(page.locator('a[href="/lab/hero-c"]').first()).toBeVisible();
    await expect(page.locator('a[href="/lab/cursor"]').first()).toBeVisible();
    await expect(page.locator('a[href="/lab/hero-peel"]').first()).toBeVisible();
    await expect(page.locator("video")).toHaveCount(3);
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

test.describe("cursor variants lab", () => {
  test("offers the three refined variants and starts on Orbit", async ({
    page,
  }) => {
    await page.goto("/lab/cursor");

    const group = page.getByRole("group", {
      name: "Cursor variant",
      exact: true,
    });
    await expect(group).toBeVisible();
    await expect(group.getByRole("button", { name: "Orbit" })).toBeVisible();
    await expect(
      group.getByRole("button", { name: "Lime Target" }),
    ).toBeVisible();
    await expect(
      group.getByRole("button", { name: "Editorial Double" }),
    ).toBeVisible();

    const magnetic = page.getByRole("group", {
      name: "Magnetic cursor variant",
    });
    await expect(magnetic).toBeVisible();
    await expect(magnetic.getByRole("button", { name: "Bone" })).toBeVisible();
    await expect(magnetic.getByRole("button", { name: "Lime" })).toBeVisible();
    await expect(
      magnetic.getByRole("button", { name: "Inverse" }),
    ).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute(
      "data-cursor-variant",
      "orbit",
    );
  });

  test("keeps a visible dot at rest and one arrow treatment on hover", async ({
    page,
  }) => {
    await page.goto("/lab/cursor");

    const setRole = (role: "default" | "view") =>
      page.evaluate((next) => {
        document.documentElement.dataset.cursorVisible = "true";
        document.documentElement.dataset.cursorState = next;
      }, role);

    const disc = page.locator(".cursor-dot__disc");
    const ring = page.locator(".cursor-ring__inner");
    const ringArrow = page.locator(".cursor-ring__arrow");
    const ringLabel = page.locator(".cursor-ring__label");
    const productionArrow = page.locator(".cursor-arrow");

    // Orbit: 10px difference-blended dot + 30px trailing ring at rest.
    await setRole("default");
    await expect(disc).toBeVisible();
    await expect(ring).toBeVisible();
    await expect(ringLabel).toBeHidden();
    expect(await disc.evaluate((el) => getComputedStyle(el).width)).toBe(
      "10px",
    );
    expect(
      await disc.evaluate((el) => getComputedStyle(el).mixBlendMode),
    ).toBe("difference");
    const viewTarget = page.locator('[data-cursor="view"]').first();
    await viewTarget.scrollIntoViewIfNeeded();
    await viewTarget.hover();
    await expect(page.locator("html")).toHaveAttribute(
      "data-cursor-state",
      "view",
    );
    await expect(disc).toBeHidden();
    await expect(ring).toBeVisible();
    await expect(ringArrow).toBeHidden();
    await expect(ringLabel).toBeVisible();
    await expect(ringLabel).toHaveText("VIEW");
    await expect
      .poll(() => ring.evaluate((el) => el.getBoundingClientRect().width))
      .toBeCloseTo(72, 0);

    // Lime Target: lime dot with an ink keyline; no ring until hover.
    await page.locator('[data-cursor-variant-option="lime"]').click();
    await setRole("default");
    await expect(disc).toBeVisible();
    await expect(ring).toBeHidden();
    expect(
      await disc.evaluate((el) => getComputedStyle(el).backgroundColor),
    ).toBe("rgb(198, 240, 53)");
    expect(
      await disc.evaluate((el) => getComputedStyle(el).borderTopColor),
    ).toBe("rgb(23, 22, 20)");
    await setRole("view");
    await expect(disc).toBeHidden();
    await expect(ring).toBeVisible();
    await expect(ringArrow).toBeVisible();
    await expect(ringLabel).toBeHidden();
    await expect
      .poll(() => ring.evaluate((el) => el.getBoundingClientRect().width))
      .toBeCloseTo(44, 0);

    // Editorial Double: 12px bone dot with an ink keyline + 36px ring.
    await page.locator('[data-cursor-variant-option="editorial"]').click();
    await setRole("default");
    await expect(disc).toBeVisible();
    await expect(ring).toBeVisible();
    expect(await disc.evaluate((el) => getComputedStyle(el).width)).toBe(
      "12px",
    );
    expect(
      await disc.evaluate((el) => getComputedStyle(el).borderTopColor),
    ).toBe("rgb(23, 22, 20)");
    await setRole("view");
    await expect(disc).toBeHidden();
    await expect(ring).toBeVisible();
    await expect(ringArrow).toBeVisible();
    await expect(ringLabel).toBeHidden();
    await expect
      .poll(() => ring.evaluate((el) => el.getBoundingClientRect().width))
      .toBeCloseTo(52, 0);

    // The production arrow swap is not layered underneath a lab variant.
    await expect(productionArrow).toBeHidden();
  });

  test("labels Orbit by role", async ({ page }) => {
    await page.goto("/lab/cursor");
    await expect(page.locator("html")).toHaveAttribute(
      "data-cursor-variant",
      "orbit",
    );

    const label = page.locator(".cursor-ring__label");
    await page.evaluate(() => {
      document.documentElement.dataset.cursorVisible = "true";
    });

    const cases = [
      [page.getByRole("link", { name: "A normal link" }), "OPEN"],
      [page.locator('[data-cursor="view"]').first(), "VIEW"],
      [page.locator('[data-cursor="play"]'), "PLAY"],
      [page.locator('a[href^="mailto:"]').first(), "HELLO"],
      [page.locator('a[target="_blank"]').first(), "VISIT"],
    ] as const;

    for (const [target, word] of cases) {
      await target.dispatchEvent("pointerover", { pointerType: "mouse" });
      await expect(label).toBeVisible();
      await expect(label).toHaveText(word);
    }

    await page.locator("body").dispatchEvent("pointerover", {
      pointerType: "mouse",
    });
    await expect(label).toBeHidden();
  });

  test("magnetic variants use their own resting and focus sizes", async ({
    page,
  }) => {
    await page.goto("/lab/cursor");
    await expect(page.locator("html")).toHaveAttribute(
      "data-cursor-variant",
      "orbit",
    );

    const magneticDisc = page.locator(".cursor-magnetic__disc");
    const magneticLabel = page.locator(".cursor-magnetic__label");
    const exactDot = page.locator(".cursor-dot__disc");
    const ring = page.locator(".cursor-ring__inner");
    const viewTarget = page.locator('[data-cursor="view"]').first();

    const setRest = () =>
      page.evaluate(() => {
        document.documentElement.dataset.cursorVisible = "true";
        document.documentElement.dataset.cursorState = "default";
      });

    const cases = [
      {
        id: "bone",
        background: "rgb(245, 241, 232)",
        layerBlend: "normal",
        restSize: 16,
        focusSize: 64,
        labelSize: "10px",
      },
      {
        id: "lime",
        background: "rgb(198, 240, 53)",
        layerBlend: "normal",
        restSize: 16,
        focusSize: 64,
        labelSize: "10px",
      },
      {
        id: "inverse",
        background: "rgb(245, 241, 232)",
        layerBlend: "difference",
        restSize: 96,
        focusSize: 112,
        labelSize: "12px",
      },
    ] as const;

    for (const item of cases) {
      await page
        .locator(`[data-cursor-variant-option="magnetic-${item.id}"]`)
        .click();
      await expect(page.locator("html")).toHaveAttribute(
        "data-cursor-variant",
        `magnetic-${item.id}`,
      );
      await setRest();

      await expect(magneticDisc).toBeVisible();
      await expect(exactDot).toBeHidden();
      await expect(ring).toBeHidden();
      await expect
        .poll(() =>
          magneticDisc.evaluate((el) => getComputedStyle(el).width),
        )
        .toBe(`${item.restSize}px`);
      await expect
        .poll(() =>
          magneticDisc.evaluate(
            (el) => getComputedStyle(el).backgroundColor,
          ),
        )
        .toBe(item.background);
      expect(
        await page
          .locator(".cursor-layer")
          .evaluate((el) => getComputedStyle(el).mixBlendMode),
      ).toBe(item.layerBlend);
      await expect
        .poll(() =>
          magneticDisc.evaluate(
            (el) => getComputedStyle(el).borderTopColor,
          ),
        )
        .toBe("rgba(0, 0, 0, 0)");

      await viewTarget.dispatchEvent("pointerover", {
        pointerType: "mouse",
      });
      await expect(magneticLabel).toBeVisible();
      await expect(magneticLabel).toHaveText("VIEW");
      expect(
        await magneticLabel.evaluate((el) => getComputedStyle(el).fontSize),
      ).toBe(item.labelSize);
      await expect
        .poll(() =>
          magneticDisc.evaluate((el) => el.getBoundingClientRect().width),
        )
        .toBeCloseTo(item.focusSize, 0);
    }
  });

  test("magnetic colors render correctly over white", async ({ page }) => {
    await page.goto("/lab/cursor");
    await expect(page.locator("html")).toHaveAttribute(
      "data-cursor-variant",
      "orbit",
    );

    await page.evaluate(() => {
      const swatch = document.createElement("div");
      swatch.id = "cursor-color-swatch";
      swatch.style.cssText =
        "position:fixed;left:80px;top:80px;width:240px;height:240px;background:#fff;z-index:1000";
      document.body.appendChild(swatch);
    });

    const cases = [
      { id: "bone", expected: [245, 241, 232] },
      { id: "lime", expected: [198, 240, 53] },
      { id: "inverse", expected: [10, 14, 23] },
    ] as const;

    for (const item of cases) {
      await page
        .locator(`[data-cursor-variant-option="magnetic-${item.id}"]`)
        .click();
      await expect(page.locator("html")).toHaveAttribute(
        "data-cursor-variant",
        `magnetic-${item.id}`,
      );
      await page.mouse.move(200, 200);

      await expect
        .poll(async () => {
          const box = await page
            .locator(".cursor-magnetic__disc")
            .boundingBox();
          if (!box) return 1000;
          return Math.max(
            Math.abs(box.x + box.width / 2 - 200),
            Math.abs(box.y + box.height / 2 - 200),
          );
        })
        .toBeLessThan(3);

      const shot = await page.screenshot({
        clip: { x: 184, y: 184, width: 32, height: 32 },
      });
      const { data, info } = await sharp(shot)
        .raw()
        .toBuffer({ resolveWithObject: true });
      const x = 16;
      const y = 16;
      const offset = (y * info.width + x) * info.channels;
      const pixel = Array.from(data.slice(offset, offset + 3));

      for (let channel = 0; channel < 3; channel += 1) {
        expect(
          Math.abs(pixel[channel] - item.expected[channel]),
          `${item.id} channel ${channel}: ${pixel.join(",")}`,
        ).toBeLessThanOrEqual(4);
      }
    }
  });

  test("switches live and keeps the ring under the pointer", async ({ page }) => {
    await page.goto("/lab/cursor");
    await expect(page.locator("html")).toHaveAttribute(
      "data-cursor-variant",
      "orbit",
    );
    await page.mouse.move(420, 320);

    await page.locator('[data-cursor-variant-option="lime"]').click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-cursor-variant",
      "lime",
    );
    await expect(page.locator(".cursor-ring__inner")).toBeVisible();

    await page.locator('[data-cursor-variant-option="editorial"]').click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-cursor-variant",
      "editorial",
    );
    await expect(page.locator(".cursor-ring__inner")).toBeVisible();

    const orbitOption = page.locator('[data-cursor-variant-option="orbit"]');
    await orbitOption.click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-cursor-variant",
      "orbit",
    );
    await expect(page.locator(".cursor-ring__inner")).toBeVisible();

    await expect
      .poll(async () => {
        const [ringBox, optionBox] = await Promise.all([
          page.locator(".cursor-ring").boundingBox(),
          orbitOption.boundingBox(),
        ]);
        expect(ringBox).not.toBeNull();
        expect(optionBox).not.toBeNull();
        return Math.abs(
          ringBox!.x - (optionBox!.x + optionBox!.width / 2),
        );
      })
      .toBeLessThan(3);
  });

  test("supports keyboard selection", async ({ page }) => {
    await page.goto("/lab/cursor");
    await expect(page.locator("html")).toHaveAttribute(
      "data-cursor-variant",
      "orbit",
    );

    const lime = page.locator('[data-cursor-variant-option="lime"]');
    await lime.focus();
    await page.keyboard.press("Enter");

    await expect(page.locator("html")).toHaveAttribute(
      "data-cursor-variant",
      "lime",
    );
    await expect(lime).toHaveAttribute("aria-pressed", "true");
  });

  test("does not carry the lab choice into production", async ({ page }) => {
    await page.goto("/lab/cursor");
    await expect(page.locator("html")).toHaveAttribute(
      "data-cursor-variant",
      "orbit",
    );
    await page.locator('[data-cursor-variant-option="editorial"]').click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-cursor-variant",
      "editorial",
    );

    await page.locator("header .site-header__brand").click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("html")).not.toHaveAttribute(
      "data-cursor-variant",
    );
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
    await expect(page.locator(".cursor-dot__disc")).toBeHidden();
    await expect(page.locator(".cursor-ring__inner")).toBeVisible();
    await expect(page.locator(".cursor-ring__arrow")).toBeHidden();
    await expect(page.locator(".cursor-ring__label")).toHaveText("OPEN");

    const view = page.locator('[data-cursor="view"]').first();
    await view.scrollIntoViewIfNeeded();
    await view.hover();
    await expect(html).toHaveAttribute("data-cursor-state", "view");
    await expect(page.locator(".cursor-dot__disc")).toBeHidden();
    await expect(page.locator(".cursor-ring__inner")).toBeVisible();
    await expect(page.locator(".cursor-ring__arrow")).toBeHidden();
    await expect(page.locator(".cursor-ring__label")).toHaveText("VIEW");
    await expect
      .poll(() =>
        page
          .locator(".cursor-ring__inner")
          .evaluate((element) => getComputedStyle(element).scale),
      )
      .toBe("2.4");

    const play = page.locator('[data-cursor="play"]');
    await play.scrollIntoViewIfNeeded();
    await play.hover();
    await expect(html).toHaveAttribute("data-cursor-state", "play");
    await expect(page.locator(".cursor-dot__disc")).toBeHidden();
    await expect(page.locator(".cursor-ring__inner")).toBeVisible();
    await expect(page.locator(".cursor-ring__arrow")).toBeHidden();
    await expect(page.locator(".cursor-ring__label")).toHaveText("PLAY");

    const textField = page.locator("input[type='text']");
    await textField.scrollIntoViewIfNeeded();
    await textField.hover();
    await expect(html).toHaveAttribute("data-cursor-state", "text");
    expect(
      await textField.evaluate((element) => getComputedStyle(element).cursor),
    ).toBe("text");
    await expect(page.locator(".cursor-dot")).toHaveCSS("opacity", "0");

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

    await page.getByRole("button", { name: "Use system cursor" }).click();
    await expect(html).toHaveAttribute("data-cursor", "off");
    expect(
      await page.evaluate(() => getComputedStyle(document.body).cursor),
    ).toBe("auto");

    // Toggling back must restore the custom layer and the hidden OS pointer.
    await page.getByRole("button", { name: "Use custom cursor" }).click();
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

    await page.mouse.move(720, 450);
    await expect(page.locator("html")).toHaveAttribute(
      "data-cursor-state",
      "default",
    );
    await expect(page.locator(".cursor-dot__disc")).toBeVisible();
    expect(
      await page
        .locator(".cursor-dot__disc")
        .evaluate((element) => getComputedStyle(element).width),
    ).toBe("10px");
    expect(
      await page
        .locator(".cursor-dot__disc")
        .evaluate((element) => getComputedStyle(element).mixBlendMode),
    ).toBe("difference");
    await expect(page.locator(".cursor-arrow")).toBeHidden();

    const card = page.locator('[data-compression-target="project"]').first();
    await card.scrollIntoViewIfNeeded();
    await card.hover();
    await expect(page.locator("html")).toHaveAttribute(
      "data-cursor-state",
      "view",
    );
    await expect(page.locator(".cursor-dot__disc")).toBeHidden();
    await expect(page.locator(".cursor-arrow")).toBeVisible();
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
    await expect(page.locator("html")).toHaveAttribute("data-cursor", "on");
    await page
      .locator("header")
      .getByRole("link", { name: "Work" })
      .click();

    await expect(page).toHaveURL(/\/work$/);
    await expect(page.locator("html")).toHaveAttribute("data-cursor", "on");
    await expect(page.locator(".cursor-dot")).toHaveCount(1);
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("snaps the dot to the pointer without a lerp", async ({ page }) => {
      await page.goto("/lab/cursor");
      await expect(page.locator(".cursor-dot")).toBeAttached();
      await page.mouse.move(320, 260);

      await expect
        .poll(() =>
          page
            .locator(".cursor-dot")
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
      await expect(page.locator(".cursor-dot")).toHaveCount(0);
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
      await expect(page.locator(".cursor-dot")).toHaveCount(0);
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
      await expect(page.locator(".cursor-dot")).toHaveCount(0);
      expect(
        await page.evaluate(() => document.documentElement.dataset.cursor ?? null),
      ).toBeNull();
    });

    test("the live site keeps the native pointer", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator(".cursor-dot")).toHaveCount(0);
      expect(
        await page.evaluate(() => document.documentElement.dataset.cursor ?? null),
      ).toBeNull();
    });
  });
});

import type { Locator, Page } from "@playwright/test";
import sharp from "sharp";

import { expect, test } from "./support/fixtures";

const LEGACY_CURSOR_NODES =
  ".cursor-dot, .cursor-arrow, .cursor-ring, .cursor-ring__inner, .cursor-label-layer";

async function openLab(page: Page) {
  await page.goto("/lab/cursor");
  await expect(page.locator("html")).toHaveAttribute("data-cursor", "on");
}

async function showCursor(page: Page) {
  await page.evaluate(() => {
    document.documentElement.dataset.cursorVisible = "true";
  });
}

async function expectDiscWidth(locator: Locator, width: number) {
  await expect
    .poll(async () => {
      const box = await locator.boundingBox();
      return box?.width ?? 0;
    })
    .toBeCloseTo(width, 0);
}

test.describe("cursor variants lab", () => {
  test("offers only Bone and Lime and starts on Lime", async ({ page }) => {
    await openLab(page);

    const html = page.locator("html");
    await expect(html).toHaveAttribute(
      "data-cursor-variant",
      "magnetic-lime",
    );

    const group = page.getByRole("group", { name: "Cursor variant" });
    await expect(group).toBeVisible();
    await expect(group.getByRole("button")).toHaveCount(2);
    await expect(group.getByRole("button", { name: "Lime" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(group.getByRole("button", { name: "Bone" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    for (const name of ["Orbit", "Lime Target", "Editorial Double", "Inverse"]) {
      await expect(group.getByRole("button", { name })).toHaveCount(0);
    }
    await expect(
      page.getByRole("group", { name: "Magnetic cursor variant" }),
    ).toHaveCount(0);
    await expect(page.locator(LEGACY_CURSOR_NODES)).toHaveCount(0);
  });

  for (const width of [390, 1440]) {
    test(`keeps the lab controls clear of hero content at ${width}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
      await openLab(page);

      const panel = page.locator("aside");
      const scroll = page.getByRole("link", { name: "Scroll" });
      const heading = page.locator("h1");
      const [panelBox, scrollBox, headingBox] = await Promise.all([
        panel.boundingBox(),
        scroll.boundingBox(),
        heading.boundingBox(),
      ]);

      expect(panelBox).not.toBeNull();
      expect(scrollBox).not.toBeNull();
      expect(headingBox).not.toBeNull();
      const overlap = (a: typeof panelBox, b: typeof panelBox) => {
        if (!a || !b) return 0;
        return (
          Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) *
          Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))
        );
      };
      expect(overlap(panelBox, scrollBox)).toBe(0);
      expect(overlap(panelBox, headingBox)).toBe(0);

      const scrollReceivesPointer = await scroll.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const hit = document.elementFromPoint(
          rect.x + rect.width / 2,
          rect.y + rect.height / 2,
        );
        return hit === element || (hit instanceof Node && element.contains(hit));
      });
      expect(scrollReceivesPointer).toBe(true);
    });
  }

  test("places the variant controls before the demo in keyboard order", async ({
    page,
  }) => {
    await openLab(page);
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());

    const order: string[] = [];
    for (let index = 0; index < 24; index += 1) {
      await page.keyboard.press("Tab");
      order.push(
        await page.evaluate(() => {
          const active = document.activeElement;
          return (
            active?.getAttribute("aria-label") ??
            active?.textContent?.trim() ??
            ""
          );
        }),
      );
    }

    const limeIndex = order.indexOf("Lime");
    const demoIndex = order.findIndex((label) => label.includes("View project"));
    expect(limeIndex).toBeGreaterThanOrEqual(0);
    expect(demoIndex).toBeGreaterThan(limeIndex);
  });

  test("magnetic variants keep their own sizing and motion contract", async ({
    page,
  }) => {
    await openLab(page);

    const disc = page.locator(".cursor-magnetic__disc");
    const label = page.locator(".cursor-magnetic__label");
    const layer = page.locator(".cursor-layer");
    const viewTarget = page.locator('[data-cursor="view"]').first();
    const cases = [
      {
        id: "bone",
        background: "rgb(245, 241, 232)",
        restWidth: 10,
        focusWidth: 82,
        restBlend: "exclusion",
        focusBlend: "normal",
        labelSize: "14px",
      },
      {
        id: "lime",
        background: "rgb(198, 240, 53)",
        restWidth: 16,
        focusWidth: 64,
        restBlend: "normal",
        focusBlend: "normal",
        labelSize: "14px",
      },
    ] as const;

    for (const item of cases) {
      await page
        .getByRole("button", { name: item.id === "bone" ? "Bone" : "Lime" })
        .click();
      await expect(page.locator("html")).toHaveAttribute(
        "data-cursor-variant",
        `magnetic-${item.id}`,
      );
      await page.locator("body").dispatchEvent("pointerover", {
        pointerType: "mouse",
      });
      await showCursor(page);

      await expect(disc).toBeVisible();
      await expect(disc).toHaveCSS("width", "16px");
      await expect(disc).toHaveCSS("height", "16px");
      await expectDiscWidth(disc, item.restWidth);
      await expect(disc).toHaveCSS("background-color", item.background);
      await expect(disc).toHaveCSS("border-top-color", "rgba(0, 0, 0, 0)");
      await expect(layer).toHaveCSS("mix-blend-mode", item.restBlend);
      await expect(label).toBeHidden();
      await expect(label).toHaveCSS("opacity", "0");

      const discMotion = await disc.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          property: style.transitionProperty,
          duration: style.transitionDuration,
        };
      });
      expect(discMotion.property).toContain("scale");
      expect(discMotion.duration).toContain("0.36s");

      await viewTarget.dispatchEvent("pointerover", {
        pointerType: "mouse",
      });
      await expectDiscWidth(disc, item.focusWidth);
      await expect(layer).toHaveCSS("mix-blend-mode", item.focusBlend);
      await expect(label).toBeVisible();
      await expect(label).toHaveText("VIEW");
      await expect(label).toHaveCSS("font-size", item.labelSize);
      await expect(label).toHaveCSS("color", "rgb(23, 22, 20)");
      await expect(label).toHaveCSS("opacity", "1");
      expect(
        await label.evaluate(
          (element) => getComputedStyle(element).transitionDuration,
        ),
      ).toContain("0.24s");
    }
  });

  test("Bone grows and stays inverted for emphasis paragraphs", async ({
    page,
  }) => {
    await openLab(page);
    await page.getByRole("button", { name: "Bone" }).click();
    await page.evaluate(() => {
      const paragraph = document.createElement("p");
      paragraph.dataset.cursor = "emphasis";
      paragraph.textContent = "Important paragraph";
      paragraph.style.cssText =
        "position:fixed;left:80px;top:80px;width:240px;height:240px;display:grid;place-items:center;background:#fff;z-index:1000";
      document.body.appendChild(paragraph);
    });
    await page.mouse.move(200, 200);

    const html = page.locator("html");
    const disc = page.locator(".cursor-magnetic__disc");
    const label = page.locator(".cursor-magnetic__label");
    await expect(html).toHaveAttribute("data-cursor-state", "emphasis");
    await expectDiscWidth(disc, 64);
    await expect(page.locator(".cursor-layer")).toHaveCSS(
      "mix-blend-mode",
      "exclusion",
    );
    await expect(label).toBeHidden();
  });

  test("maps every interactive role for both magnetic variants", async ({
    page,
  }) => {
    await openLab(page);
    await showCursor(page);

    const disc = page.locator(".cursor-magnetic__disc");
    const label = page.locator(".cursor-magnetic__label");
    const cases = [
      [page.getByRole("link", { name: "A normal link" }), "OPEN"],
      [page.locator('[data-cursor="view"]').first(), "VIEW"],
      [page.locator('[data-cursor="play"]'), "PLAY"],
      [page.locator('a[href^="mailto:"]').first(), "HELLO"],
      [page.locator('a[target="_blank"]').first(), "VISIT"],
    ] as const;

    for (const name of ["Bone", "Lime"]) {
      await page.getByRole("button", { name }).click();
      for (const [target, word] of cases) {
        await target.dispatchEvent("pointerover", { pointerType: "mouse" });
        await expect(label).toBeVisible();
        await expect(label).toHaveText(word);
        await expectDiscWidth(disc, name === "Bone" ? 82 : 64);
      }

      await page.locator("body").dispatchEvent("pointerover", {
        pointerType: "mouse",
      });
      await expect(label).toBeHidden();
      await expectDiscWidth(disc, name === "Bone" ? 10 : 16);
    }
  });

  test("renders Bone inversion and the literal Lime colour", async ({ page }) => {
    await openLab(page);
    const disc = page.locator(".cursor-magnetic__disc");

    await page.evaluate(() => {
      const swatch = document.createElement("div");
      swatch.id = "cursor-color-swatch";
      swatch.style.cssText =
        "position:fixed;left:80px;top:80px;width:240px;height:240px;background:#000;z-index:1000";
      document.body.appendChild(swatch);
    });

    const cases = [
      { name: "Bone", background: "#000", expected: [245, 241, 232] },
      { name: "Bone", background: "#fff", expected: [10, 14, 23] },
      { name: "Lime", background: "#fff", expected: [198, 240, 53] },
    ] as const;

    for (const item of cases) {
      await page.getByRole("button", { name: item.name }).click();
      await page.locator("#cursor-color-swatch").evaluate(
        (element, background) => {
          (element as HTMLElement).style.background = background;
        },
        item.background,
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

      await expectDiscWidth(disc, item.name === "Bone" ? 10 : 16);
      await expect(disc).toHaveCSS(
        "background-color",
        item.name === "Bone" ? "rgb(245, 241, 232)" : "rgb(198, 240, 53)",
      );
      await expect(page.locator(".cursor-layer")).toHaveCSS(
        "mix-blend-mode",
        item.name === "Bone" ? "exclusion" : "normal",
      );

      const shot = await page.screenshot({
        clip: { x: 184, y: 184, width: 32, height: 32 },
      });
      const { data, info } = await sharp(shot)
        .raw()
        .toBuffer({ resolveWithObject: true });
      const offset = (16 * info.width + 16) * info.channels;
      const pixel = Array.from(data.slice(offset, offset + 3));

      for (let channel = 0; channel < 3; channel += 1) {
        expect(
          Math.abs(pixel[channel] - item.expected[channel]),
          `${item.name} on ${item.background} channel ${channel}: ${pixel.join(",")}`,
        ).toBeLessThanOrEqual(4);
      }
    }
  });

  test("switches live and keeps the disc under a stationary pointer", async ({
    page,
  }) => {
    await openLab(page);
    await page.mouse.move(420, 320);

    await page
      .getByRole("button", { name: "Bone" })
      .dispatchEvent("click");
    await expect(page.locator("html")).toHaveAttribute(
      "data-cursor-variant",
      "magnetic-bone",
    );

    await page
      .getByRole("button", { name: "Lime" })
      .dispatchEvent("click");
    await expect(page.locator("html")).toHaveAttribute(
      "data-cursor-variant",
      "magnetic-lime",
    );

    await expect
      .poll(async () => {
        const box = await page
          .locator(".cursor-magnetic__disc")
          .boundingBox();
        if (!box) return 1000;
        return Math.max(
          Math.abs(box.x + box.width / 2 - 420),
          Math.abs(box.y + box.height / 2 - 320),
        );
      })
      .toBeLessThan(3);
  });

  test("supports keyboard selection", async ({ page }) => {
    await openLab(page);

    const bone = page.getByRole("button", { name: "Bone" });
    await bone.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("html")).toHaveAttribute(
      "data-cursor-variant",
      "magnetic-bone",
    );
    await expect(bone).toHaveAttribute("aria-pressed", "true");

    const lime = page.getByRole("button", { name: "Lime" });
    await lime.focus();
    await page.keyboard.press("Space");
    await expect(page.locator("html")).toHaveAttribute(
      "data-cursor-variant",
      "magnetic-lime",
    );
    await expect(lime).toHaveAttribute("aria-pressed", "true");
  });

  test("does not carry the lab choice into production", async ({ page }) => {
    await openLab(page);
    await page.getByRole("button", { name: "Bone" }).click();
    await expect(page.locator("html")).toHaveAttribute(
      "data-cursor-variant",
      "magnetic-bone",
    );

    await page.locator("header .site-header__brand").click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("html")).not.toHaveAttribute(
      "data-cursor-variant",
    );
    await expect(page.locator(".cursor-magnetic__disc")).toHaveCSS(
      "background-color",
      "rgb(198, 240, 53)",
    );
  });
});

test.describe("custom cursor", () => {
  test("renders one cursor layer, magnetic, disc and label with no legacy nodes", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-cursor", "on");
    await expect(page.locator(".cursor-layer")).toHaveCount(1);
    await expect(page.locator(".cursor-magnetic")).toHaveCount(1);
    await expect(page.locator(".cursor-magnetic__disc")).toHaveCount(1);
    await expect(page.locator(".cursor-magnetic__label")).toHaveCount(1);
    await expect(page.locator(LEGACY_CURSOR_NODES)).toHaveCount(0);
  });

  test("uses Lime in production and expands with the role word", async ({
    page,
  }) => {
    await page.goto("/");
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-cursor", "on");
    await expect(html).not.toHaveAttribute("data-cursor-variant");

    const disc = page.locator(".cursor-magnetic__disc");
    const label = page.locator(".cursor-magnetic__label");
    await page.mouse.move(720, 450);
    await expect(disc).toBeVisible();
    await expectDiscWidth(disc, 16);
    await expect(disc).toHaveCSS("background-color", "rgb(198, 240, 53)");
    await expect(label).toBeHidden();
    await expect(page.locator(LEGACY_CURSOR_NODES)).toHaveCount(0);

    const card = page.locator('[data-compression-target="project"]').first();
    await card.scrollIntoViewIfNeeded();
    await card.hover();
    await expect(html).toHaveAttribute("data-cursor-state", "view");
    await expectDiscWidth(disc, 64);
    await expect(label).toBeVisible();
    await expect(label).toHaveText("VIEW");
  });

  test("marks the selected portfolio paragraphs as emphasis", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.locator('[data-section="intro"] p.text-lede'),
    ).toHaveAttribute("data-cursor", "emphasis");

    await page.goto("/about");
    await expect(page.locator(".chapter-open p.text-statement")).toHaveAttribute(
      "data-cursor",
      "emphasis",
    );

    await page.goto("/work/anom-creative");
    await expect(page.locator("header p.text-lede")).toHaveAttribute(
      "data-cursor",
      "emphasis",
    );
  });

  test("replaces the native cursor and maps every role", async ({ page }) => {
    await openLab(page);
    const html = page.locator("html");
    const disc = page.locator(".cursor-magnetic__disc");
    const label = page.locator(".cursor-magnetic__label");

    await expect(html).toHaveAttribute("data-cursor-visible", "false");

    const link = page.getByRole("link", { name: "A normal link" });
    await link.scrollIntoViewIfNeeded();
    await link.hover();
    await expect(html).toHaveAttribute("data-cursor-state", "link");
    await expectDiscWidth(disc, 64);
    await expect(label).toHaveText("OPEN");

    const view = page.locator('[data-cursor="view"]').first();
    await view.scrollIntoViewIfNeeded();
    await view.hover();
    await expect(html).toHaveAttribute("data-cursor-state", "view");
    await expect(label).toHaveText("VIEW");

    const play = page.locator('[data-cursor="play"]');
    await play.scrollIntoViewIfNeeded();
    await play.hover();
    await expect(html).toHaveAttribute("data-cursor-state", "play");
    await expect(label).toHaveText("PLAY");

    const textField = page.locator("input[type='text']");
    await textField.scrollIntoViewIfNeeded();
    await textField.hover();
    await expect(html).toHaveAttribute("data-cursor-state", "text");
    expect(
      await textField.evaluate((element) => getComputedStyle(element).cursor),
    ).toBe("text");
    await expect(page.locator(".cursor-magnetic")).toHaveCSS("opacity", "0");

    const disabled = page.locator('[data-cursor="disabled"]');
    await disabled.scrollIntoViewIfNeeded();
    await disabled.hover();
    await expect(html).toHaveAttribute("data-cursor-state", "disabled");
  });

  test("completes press feedback before releasing the disc", async ({ page }) => {
    await openLab(page);
    await page.getByRole("button", { name: "Bone" }).click();
    await page.locator("body").dispatchEvent("pointerover", {
      pointerType: "mouse",
    });
    await showCursor(page);

    const html = page.locator("html");
    const disc = page.locator(".cursor-magnetic__disc");
    await expect(html).toHaveAttribute("data-cursor-down", "false");
    await expect
      .poll(() => disc.evaluate((element) => getComputedStyle(element).transform))
      .toBe("matrix(1, 0, 0, 1, 0, 0)");
    expect(
      await disc.evaluate(
        (element) => getComputedStyle(element).transitionDuration,
      ),
    ).toContain("0.1s");
    await disc.evaluate((element) => {
      const probe = { completed: "" };
      (
        window as Window & {
          __pressProbe?: typeof probe;
        }
      ).__pressProbe = probe;
      const root = document.documentElement;
      const onTransitionEnd: EventListener = (event) => {
        if (
          (event as TransitionEvent).propertyName === "transform" &&
          root.dataset.cursorDown === "true"
        ) {
          probe.completed = getComputedStyle(element).transform;
        }
      };
      element.addEventListener("transitionend", onTransitionEnd);
    });

    await page.mouse.move(420, 320);
    await page.mouse.down();
    await expect
      .poll(() =>
        page.evaluate(() => {
          const probe = (
            window as Window & {
              __pressProbe?: { completed: string };
            }
          ).__pressProbe;
          return probe?.completed ?? "";
        }),
      )
      .toBe("matrix(0.75, 0, 0, 0.75, 0, 0)");
    await page.mouse.up();
    await expect(html).toHaveAttribute("data-cursor-down", "false");
  });

  test("the system-cursor escape hatch restores the OS pointer", async ({
    page,
  }) => {
    await openLab(page);
    const html = page.locator("html");
    await expect(html).toHaveAttribute("data-cursor", "on");

    await page.getByRole("button", { name: "Use system cursor" }).click();
    await expect(html).toHaveAttribute("data-cursor", "off");
    expect(
      await page.evaluate(() => getComputedStyle(document.body).cursor),
    ).toBe("auto");

    await page.getByRole("button", { name: "Use custom cursor" }).click();
    await expect(html).toHaveAttribute("data-cursor", "on");
    expect(
      await page.evaluate(() => getComputedStyle(document.body).cursor),
    ).toBe("none");
  });

  test("updates the role on scroll with a stationary pointer", async ({
    page,
  }) => {
    await openLab(page);
    const html = page.locator("html");

    const view = page.locator('[data-cursor="view"]').first();
    await view.scrollIntoViewIfNeeded();
    await view.hover();
    await expect(html).toHaveAttribute("data-cursor-state", "view");

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
    await expect(page.locator(".cursor-magnetic")).toHaveCSS("opacity", "1");
    expect(
      await page
        .locator(".cursor-layer")
        .evaluate((element) => element.matches(":popover-open")),
    ).toBe(true);
  });

  test("menu cursor shows OPEN over trigger and CLOSE over nav close", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-cursor", "on");

    await page.evaluate(() => {
      document.querySelector(".menu-trigger")?.setAttribute("data-visible", "true");
    });
    await page.waitForTimeout(100);

    const label = page.locator(".cursor-magnetic__label");
    const trigger = page.locator(".menu-trigger");
    const triggerBox = await trigger.boundingBox();
    expect(triggerBox).not.toBeNull();
    await page.mouse.move(
      triggerBox!.x + triggerBox!.width / 2,
      triggerBox!.y + triggerBox!.height / 2,
    );
    await expect(label).toHaveText("OPEN");

    await trigger.dispatchEvent("click");
    await expect(page.locator("dialog#site-menu")).toHaveAttribute(
      "data-state",
      "open",
    );

    const closeBtn = page.locator(".nav-close");
    const closeBox = await closeBtn.boundingBox();
    expect(closeBox).not.toBeNull();
    await page.mouse.move(
      closeBox!.x + closeBox!.width / 2,
      closeBox!.y + closeBox!.height / 2,
    );
    await expect(label).toHaveText("CLOSE");

    await closeBtn.click();
    await expect(page.locator("dialog#site-menu")).toHaveAttribute(
      "data-state",
      "closed",
    );

    await page.mouse.move(
      triggerBox!.x + triggerBox!.width / 2,
      triggerBox!.y + triggerBox!.height / 2,
    );
    await expect(label).toHaveText("OPEN");
  });

  test("menu cursor updates with a stationary pointer", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-cursor", "on");

    await page.evaluate(() => {
      document.querySelector(".menu-trigger")?.setAttribute("data-visible", "true");
    });
    await page.waitForTimeout(100);

    const label = page.locator(".cursor-magnetic__label");
    const trigger = page.locator(".menu-trigger");
    const triggerBox = await trigger.boundingBox();
    expect(triggerBox).not.toBeNull();
    await page.mouse.move(
      triggerBox!.x + triggerBox!.width / 2,
      triggerBox!.y + triggerBox!.height / 2,
    );
    await expect(label).toHaveText("OPEN");

    await trigger.dispatchEvent("click");
    await expect(page.locator("dialog#site-menu")).toHaveAttribute(
      "data-state",
      "open",
    );
    await expect(label).toHaveText("CLOSE");

    await page.keyboard.press("Escape");
    await expect(page.locator("dialog#site-menu")).toHaveAttribute(
      "data-state",
      "closed",
    );

    await page.evaluate(() => {
      document.querySelector(".menu-trigger")?.setAttribute("data-visible", "true");
    });
    await page.waitForTimeout(100);
    await expect(label).toHaveText("OPEN");
  });

  test("clears a stale role when the window shrinks", async ({ page }) => {
    await openLab(page);
    const html = page.locator("html");

    const view = page.locator('[data-cursor="view"]').first();
    await view.scrollIntoViewIfNeeded();
    await view.hover();
    await expect(html).toHaveAttribute("data-cursor-state", "view");

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
    await expect(page.locator(".cursor-magnetic")).toHaveCount(1);
    await expect(page.locator(".cursor-magnetic__disc")).toHaveCSS(
      "background-color",
      "rgb(198, 240, 53)",
    );
  });

  test("honors a live reduced-motion change without trailing", async ({
    page,
  }) => {
    await openLab(page);
    await page.mouse.move(100, 100);
    await expect(page.locator("html")).toHaveAttribute(
      "data-cursor-visible",
      "true",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });

    const distance = await page.evaluate(async () => {
      document.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 320,
          clientY: 260,
          pointerType: "mouse",
        }),
      );
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      const disc = document.querySelector(".cursor-magnetic__disc");
      if (!disc) return 1000;
      const box = disc.getBoundingClientRect();
      return Math.max(
        Math.abs(box.x + box.width / 2 - 320),
        Math.abs(box.y + box.height / 2 - 260),
      );
    });

    expect(distance).toBeLessThan(1);
  });

  test("moves the custom cursor to the pointer", async ({ page }) => {
    await openLab(page);
    await page.mouse.move(420, 320);
    await expect
      .poll(async () => {
        const box = await page
          .locator(".cursor-magnetic__disc")
          .boundingBox();
        if (!box) return 1000;
        return Math.max(
          Math.abs(box.x + box.width / 2 - 420),
          Math.abs(box.y + box.height / 2 - 320),
        );
      })
      .toBeLessThan(3);
  });

  test("resets magnetic targets when the pointer leaves", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const element = document.createElement("a");
      element.id = "motion-magnet-test";
      element.dataset.magnetic = "";
      element.style.cssText =
        "position:fixed;left:300px;top:300px;width:100px;height:100px;display:block;background:#fff;z-index:1000";
      document.body.appendChild(element);
    });
    await expect(page.locator("html")).toHaveAttribute("data-cursor", "on");
    await expect(page.locator(".cursor-magnetic")).toBeAttached();
    await page.waitForFunction(() => {
      document.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 320,
          clientY: 320,
          pointerType: "mouse",
          bubbles: true,
        }),
      );
      return document.documentElement.dataset.cursorVisible === "true";
    });
    await page.evaluate(() => {
      document.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 320,
          clientY: 320,
          pointerType: "mouse",
          bubbles: true,
        }),
      );
    });
    await expect
      .poll(async () => {
        return await page.evaluate(() => {
          const element = document.getElementById("motion-magnet-test");
          return element?.style.translate ?? "";
        });
      })
      .not.toBe("");
    await page.evaluate(() => {
      document.dispatchEvent(new PointerEvent("pointerleave", { bubbles: true }));
    });
    await expect
      .poll(async () => {
        return await page.evaluate(() => {
          const element = document.getElementById("motion-magnet-test");
          return element?.style.translate ?? "";
        });
      })
      .toBe("");
  });

  test("resets magnetic targets when the menu opens", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => {
      const element = document.createElement("a");
      element.id = "motion-magnet-menu-test";
      element.dataset.magnetic = "";
      element.style.cssText =
        "position:fixed;left:300px;top:300px;width:100px;height:100px;display:block;background:#fff;z-index:1000";
      document.body.appendChild(element);
    });
    await expect(page.locator("html")).toHaveAttribute("data-cursor", "on");
    await expect(page.locator(".cursor-magnetic")).toBeAttached();
    await page.waitForFunction(() => {
      document.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 320,
          clientY: 320,
          pointerType: "mouse",
          bubbles: true,
        }),
      );
      return document.documentElement.dataset.cursorVisible === "true";
    });
    await page.evaluate(() => {
      document.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 320,
          clientY: 320,
          pointerType: "mouse",
          bubbles: true,
        }),
      );
    });
    await expect
      .poll(async () => {
        return await page.evaluate(() => {
          const element = document.getElementById("motion-magnet-menu-test");
          return element?.style.translate ?? "";
        });
      })
      .not.toBe("");
    await page.locator(".menu-trigger").dispatchEvent("click");
    await expect(page.locator("dialog#site-menu")).toHaveAttribute(
      "data-state",
      "open",
    );
    await expect
      .poll(async () => {
        return await page.evaluate(() => {
          const element = document.getElementById("motion-magnet-menu-test");
          return element?.style.translate ?? "";
        });
      })
      .toBe("");
  });

  test("cleans up the cursor on client navigation", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-cursor", "on");
    await page
      .locator("header")
      .getByRole("link", { name: "Work" })
      .click();
    await expect(page).toHaveURL(/\/work$/);
    await expect(page.locator("html")).toHaveAttribute("data-cursor", "on");
    await expect(page.locator(".cursor-magnetic")).toHaveCount(1);
    await expect(page.locator(".cursor-layer")).toHaveCount(1);
    await expect(page.locator("html")).not.toHaveAttribute(
      "data-cursor-down",
      "true",
    );
    await expect(page.locator("html")).not.toHaveAttribute(
      "data-cursor-menu",
      "native",
    );
    await expect(page.locator("html")).toHaveAttribute("data-cursor", "on");
    await page.waitForFunction(() => {
      document.dispatchEvent(
        new PointerEvent("pointermove", {
          clientX: 420,
          clientY: 320,
          pointerType: "mouse",
          bubbles: true,
        }),
      );
      return document.documentElement.dataset.cursorVisible === "true";
    });
    await expect(page.locator(".cursor-magnetic")).toHaveCount(1);
  });

  test("snaps without trailing under reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await openLab(page);
    await page.mouse.move(320, 260);
    await expect
      .poll(async () => {
        const box = await page
          .locator(".cursor-magnetic__disc")
          .boundingBox();
        if (!box) return 1000;
        return Math.max(
          Math.abs(box.x + box.width / 2 - 320),
          Math.abs(box.y + box.height / 2 - 260),
        );
      })
      .toBeLessThan(1);
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("snaps the disc to the pointer without a lerp", async ({ page }) => {
      await openLab(page);
      await expect(page.locator(".cursor-magnetic")).toBeAttached();
      await page.mouse.move(320, 260);

      await expect
        .poll(async () => {
          const box = await page
            .locator(".cursor-magnetic__disc")
            .boundingBox();
          if (!box) return 1000;
          return Math.max(
            Math.abs(box.x + box.width / 2 - 320),
            Math.abs(box.y + box.height / 2 - 260),
          );
        })
        .toBeLessThan(1);
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
      await expect(page.locator(".cursor-magnetic")).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.dataset.cursor ?? null,
        ),
      ).toBeNull();
      expect(
        await page.evaluate(() => getComputedStyle(document.body).cursor),
      ).toBe("auto");
    });

    test("reports the system cursor and disables unavailable controls", async ({
      page,
    }) => {
      await page.goto("/lab/cursor");
      await expect(page.getByText("System · touch")).toBeVisible();
      await expect(page.getByRole("button", { name: "Lime" })).toBeDisabled();
      await expect(page.getByRole("button", { name: "Bone" })).toBeDisabled();
      await expect(
        page.getByRole("button", { name: "Use custom cursor" }),
      ).toBeDisabled();
    });

    test("the live site never mounts it either", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator(".cursor-magnetic")).toHaveCount(0);
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
      await expect(page.locator(".cursor-magnetic")).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.dataset.cursor ?? null,
        ),
      ).toBeNull();
    });

    test("the live site keeps the native pointer", async ({ page }) => {
      await page.goto("/");
      await expect(page.locator(".cursor-magnetic")).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.dataset.cursor ?? null,
        ),
      ).toBeNull();
    });
  });
});

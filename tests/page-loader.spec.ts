import { expect, test } from "@playwright/test";

const ROUTES = [
  "/",
  "/work",
  "/about",
  "/contact",
  "/work/anom-creative",
] as const;

/** The plate runs 2.4s, holds, then wipes for 1.3s. Dev builds are slower. */
const PLATE_GONE = { timeout: 12_000 };

function plate(page: import("@playwright/test").Page) {
  return page.getByRole("status", { name: "Loading Abdelrhman" });
}

test.describe("first-load plate", () => {
  for (const route of ROUTES) {
    test(`plays on a direct load of ${route}`, async ({ page }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });

      await expect(plate(page)).toBeVisible();
      await expect(page.locator(".page-loader__letter")).toHaveCount(10);
      await expect(page.locator(".page-loader__count")).toContainText("%");

      await expect(plate(page)).toBeHidden(PLATE_GONE);
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("main h1")).toBeVisible();
    });
  }

  test("counts to 100% before it leaves", async ({ page }) => {
    await page.goto("/contact", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".page-loader__count")).toHaveText("100%", {
      timeout: 10_000,
    });
    await expect(plate(page)).toBeHidden(PLATE_GONE);
  });

  test("drops the wordmark and counter before the plate wipes", async ({
    page,
  }) => {
    await page.goto("/contact", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".page-loader__count")).toHaveText("100%", {
      timeout: 10_000,
    });

    // Record the order of the two exit beats: the wordmark must finish
    // dropping (translateY past +100%) while the plate is still a flat,
    // un-clipped surface.
    const order = await page.evaluate(async () => {
      const letters = [
        ...document.querySelectorAll<HTMLElement>(".page-loader__letter"),
      ];
      const plate = document.querySelector<HTMLElement>(
        ".page-loader__plate:not(.page-loader__plate--lime)",
      );
      if (!letters.length || !plate) return null;
      const seen = { dropped: false, wiped: false, dropFirst: false };
      const t0 = performance.now();
      return await new Promise<typeof seen>((resolve) => {
        const check = () => {
          const ty = Math.max(
            ...letters.map((letter) => {
              const match = getComputedStyle(letter).transform.match(
                /matrix\(1, 0, 0, 1, [-\d.]+, ([-\d.]+)\)/,
              );
              return match ? Number.parseFloat(match[1]) : 0;
            }),
          );
          const letterHeight =
            letters[0].getBoundingClientRect().height || 1;
          const dropped = ty > letterHeight * 0.9;
          const plateMatch = getComputedStyle(plate).transform.match(
            /matrix\(1, 0, 0, 1, 0, ([-\d.]+)\)/,
          );
          const plateTy = plateMatch ? Number.parseFloat(plateMatch[1]) : 0;
          const wiped = plateTy < 0;
          if (dropped && !seen.dropped) {
            seen.dropped = true;
            seen.dropFirst = !seen.wiped;
          }
          if (wiped && !seen.wiped) seen.wiped = true;
          if (seen.dropped && seen.wiped) {
            resolve(seen);
            return;
          }
          if (performance.now() - t0 > 8000) {
            resolve(seen);
            return;
          }
          requestAnimationFrame(check);
        };
        check();
      });
    });

    expect(order).not.toBeNull();
    expect(order!.dropped).toBe(true);
    expect(order!.wiped).toBe(true);
    expect(order!.dropFirst).toBe(true);
    await expect(plate(page)).toBeHidden(PLATE_GONE);
  });

  test("fits the wordmark to the content width", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/about", { waitUntil: "domcontentloaded" });

    await expect
      .poll(
        () =>
          page.evaluate(
            () =>
              document.querySelector<HTMLElement>(".page-loader__line")?.style
                .fontSize ?? "",
          ),
        { timeout: 10_000 },
      )
      .not.toBe("");

    const box = await page.evaluate(() => {
      const word = document.querySelector<HTMLElement>(".page-loader__word");
      const letters = [
        ...document.querySelectorAll<HTMLElement>(".page-loader__letter"),
      ];
      if (!word || letters.length === 0) return null;
      const wordBox = word.getBoundingClientRect();
      return {
        left: wordBox.left,
        right: wordBox.right,
        width: wordBox.width,
        firstLeft: letters[0].getBoundingClientRect().left,
        lastRight: letters[letters.length - 1].getBoundingClientRect().right,
      };
    });

    expect(box).not.toBeNull();
    expect(Math.abs(box!.firstLeft - box!.left)).toBeLessThanOrEqual(2);
    expect(Math.abs(box!.right - box!.lastRight)).toBeLessThanOrEqual(2);
    expect(box!.width).toBeGreaterThan(1200);
  });

  test("paints solid ink letters, not an image fill", async ({ page }) => {
    await page.goto("/about", { waitUntil: "domcontentloaded" });

    const style = await page.evaluate(() => {
      const letter =
        document.querySelector<HTMLElement>(".page-loader__letter");
      if (!letter) return null;
      const computed = getComputedStyle(letter);
      return {
        backgroundImage: computed.backgroundImage,
        backgroundClip: computed.backgroundClip,
        color: computed.color,
      };
    });

    expect(style).not.toBeNull();
    expect(style!.backgroundImage).toBe("none");
    expect(style!.backgroundClip).toBe("border-box");
    expect(style!.color).not.toBe("rgba(0, 0, 0, 0)");
  });

  test("plays again on a repeat load in the same tab", async ({ page }) => {
    await page.goto("/contact", { waitUntil: "domcontentloaded" });
    await expect(plate(page)).toBeVisible();
    await expect(plate(page)).toBeHidden(PLATE_GONE);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(plate(page)).toBeVisible();
    await expect(plate(page)).toBeHidden(PLATE_GONE);
  });

  test("locks the scroll while it is up and releases it after", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(plate(page)).toBeVisible();
    expect(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).overflow,
      ),
    ).toBe("hidden");

    await expect(plate(page)).toBeHidden(PLATE_GONE);

    expect(
      await page.evaluate(() => document.documentElement.dataset.pageLoader),
    ).toBe("done");
    expect(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).overflow,
      ),
    ).not.toBe("hidden");

    await page.waitForFunction(
      () => document.documentElement.classList.contains("lenis"),
      undefined,
      { timeout: 5_000 },
    );
    await page.evaluate(() => window.scrollTo(0, 1200));
    await expect
      .poll(() => page.evaluate(() => window.scrollY), { timeout: 5_000 })
      .toBeGreaterThan(0);
  });

  test("stays out of the way of a hash deep link", async ({ page }) => {
    await page.goto("/about#main", { waitUntil: "domcontentloaded" });

    expect(
      await page.evaluate(() => document.documentElement.dataset.pageLoader),
    ).toBe("skip");
    await expect(page.locator(".page-loader")).toBeHidden();
  });

  test("never plays on the lab prototypes", async ({ page }) => {
    await page.goto("/lab", { waitUntil: "domcontentloaded" });

    expect(
      await page.evaluate(() => document.documentElement.dataset.pageLoader),
    ).toBe("skip");
    await expect(page.locator(".page-loader")).toBeHidden();
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });

    test("never shows the plate", async ({ page }) => {
      await page.goto("/", { waitUntil: "domcontentloaded" });

      expect(
        await page.evaluate(() => document.documentElement.dataset.pageLoader),
      ).toBe("skip");
      await expect(page.locator(".page-loader")).toBeHidden();
      await expect(page.locator("main h1")).toBeVisible();
    });
  });
});

test.describe("route transition", () => {
  test("curtain covers the change and survives back/forward", async ({ page }) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem("pf-loader-off", "1");
      } catch {
        // no-op
      }
    });

    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator(".page-loader")).toBeHidden();

    const curtain = page.locator(".fixed.inset-0.z-70");
    const coverPath = () =>
      page.evaluate(() => {
        const overlay = [...document.querySelectorAll<HTMLElement>("*")].find(
          (el) => (el.className || "").toString().includes("z-70"),
        );
        return overlay?.querySelector("path")?.getAttribute("d") ?? "";
      });

    await page.getByRole("link", { name: "Work", exact: true }).first().click();

    // The plate covers before the route commits, so the swap is never seen.
    await expect.poll(coverPath, { timeout: 5_000 }).toContain("Q");
    await expect(curtain).toBeVisible();
    await expect(page).toHaveURL(/\/work$/);
    await expect(page.locator("main h1")).toContainText("Work");

    await expect(curtain).toBeHidden({ timeout: 10_000 });
    await expect(page.locator(".page-loader")).toBeHidden();

    await page.goBack();
    await expect(page).toHaveURL(/\/$/);
    await expect.poll(coverPath, { timeout: 5_000 }).toContain("Q");
    await expect(curtain).toBeHidden({ timeout: 10_000 });
    await expect(page.locator("main h1")).toBeVisible();
  });

  test("ignores a click while the curtain is up", async ({ page }) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem("pf-loader-off", "1");
      } catch {
        // no-op
      }
    });

    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator(".page-loader")).toBeHidden();

    const workLink = page.getByRole("link", { name: "Work", exact: true }).first();
    await workLink.click({ noWaitAfter: true });
    await expect(page).toHaveURL(/\/work$/);

    // A second click during the exit sequence must not start a second
    // transition or navigate away from the committed route.
    await page.evaluate(() => {
      const anchor = document.querySelector(
        'header a[href="/about"]',
      ) as HTMLAnchorElement | null;
      anchor?.dispatchEvent(
        new MouseEvent("click", { bubbles: true, cancelable: true }),
      );
    });
    await page.waitForTimeout(4000);
    expect(page.url()).toMatch(/\/work$/);
  });
});

test.describe("route transition — reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("never shows the curtain and navigates directly", async ({ page }) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem("pf-loader-off", "1");
      } catch {
        // no-op
      }
    });

    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator(".page-loader")).toBeHidden();

    const curtain = page.locator(".fixed.inset-0.z-70");
    await expect(curtain).toBeHidden();

    await page.getByRole("link", { name: "Work", exact: true }).first().click();
    await expect(page).toHaveURL(/\/work$/);
    await expect(page.locator("main h1")).toContainText("Work");
    await expect(curtain).toBeHidden();
  });
});

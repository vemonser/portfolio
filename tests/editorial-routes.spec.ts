import { expect, test } from "@playwright/test";

const CONTACT_LINK = 'a[href^="mailto:"], a[href^="tel:"]';

test.describe("navigation", () => {
  test("desktop links use root routes and mark the current page", async ({
    page,
  }) => {
    await page.goto("/work");

    const nav = page.locator("header .site-header__nav");
    await expect(nav.getByRole("link", { name: "Work" })).toHaveAttribute(
      "href",
      "/work",
    );
    await expect(nav.getByRole("link", { name: "Blog" })).toHaveAttribute(
      "href",
      "/blog",
    );
    await expect(nav.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/about",
    );
    await expect(nav.getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "/contact",
    );
    await expect(nav.getByRole("link", { name: "Work" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await page.goto("/about");
    await expect(
      page.locator("header").getByRole("link", { name: "About" }),
    ).toHaveAttribute("aria-current", "page");
  });
});

test.describe("mobile drawer", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("opens, traps focus, locks scroll, closes on Escape and returns focus", async ({
    page,
  }) => {
    await page.goto("/");

    const trigger = page.locator(".menu-trigger");
    await expect(trigger).toBeVisible();

    await trigger.click();

    const dialog = page.locator("dialog#site-menu");
    await expect(dialog).toHaveAttribute("data-state", "open");

    const socials = dialog.getByRole("navigation", { name: "Socials" });
    if (await socials.count()) {
      const socialLinks = socials.locator("a");
      expect(await socialLinks.count()).toBeGreaterThan(0);
      for (const link of await socialLinks.all()) {
        await expect(link).toHaveAttribute("href", /^https?:\/\//);
      }
    }
    await expect
      .poll(() =>
        page.evaluate(
          () => document.activeElement?.closest("#site-menu") !== null,
        ),
      )
      .toBe(true);

    // Scroll is locked while the panel is open.
    expect(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).overflow,
      ),
    ).toBe("hidden");

    // Tab from the last control wraps back inside the dialog.
    await page.locator("#site-menu .nav-list a").last().focus();
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(
        () => document.activeElement?.closest("#site-menu") !== null,
      ),
    ).toBe(true);

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveAttribute("data-state", "closed", {
      timeout: 5_000,
    });

    await expect(trigger).toBeFocused();
    expect(
      await page.evaluate(
        () => getComputedStyle(document.documentElement).overflow,
      ),
    ).not.toBe("hidden");
  });
});

test.describe("footer and targets", () => {
  test("footer links are 44px tall and no link is a placeholder", async ({
    page,
  }) => {
    await page.goto("/");

    const links = page.locator("footer a");
    const count = await links.count();
    expect(count).toBeGreaterThan(0);

    for (let index = 0; index < count; index += 1) {
      const box = await links.nth(index).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);
    }

    await expect(page.locator('a[href="#"]')).toHaveCount(0);

    const socials = page.getByRole("navigation", { name: "Socials" });
    if (await socials.count()) {
      const socialLinks = socials.locator("a");
      expect(await socialLinks.count()).toBeGreaterThan(0);

      for (let index = 0; index < (await socialLinks.count()); index += 1) {
        await expect(socialLinks.nth(index)).toHaveAttribute(
          "href",
          /^https?:\/\//,
        );
      }
    }

    // Empty profiles are omitted, never rendered as dead text.
    await expect(page.locator("footer span.site-footer__link")).toHaveCount(0);
  });

  test("the trigger never sits on contact links", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await page.waitForSelector('[data-ready="true"]', { timeout: 20_000 });

    const contact = page.locator(CONTACT_LINK).first();
    await contact.scrollIntoViewIfNeeded();
    await page.waitForTimeout(600);

    // Scrolling down steps the trigger aside; that, not a tighter layout, is
    // what guarantees the copy is clear. Once it returns, the boxes must not
    // intersect either.
    await expect(page.locator(".menu-trigger")).toBeHidden();

    await page.evaluate(() => window.scrollBy(0, -120));
    await page.waitForTimeout(600);

    const trigger = page.locator(".menu-trigger");
    await expect(trigger).toBeVisible();

    const contactBox = await contact.boundingBox();
    const triggerBox = await trigger.boundingBox();

    expect(contactBox).not.toBeNull();
    expect(triggerBox).not.toBeNull();

    const overlaps =
      contactBox!.x < triggerBox!.x + triggerBox!.width &&
      contactBox!.x + contactBox!.width > triggerBox!.x &&
      contactBox!.y < triggerBox!.y + triggerBox!.height &&
      contactBox!.y + contactBox!.height > triggerBox!.y;

    expect(overlaps).toBe(false);
  });
});

/* ---------------------------------------------------------------------------
 * Route parity
 * ------------------------------------------------------------------------- */

const ROUTES = [
  "",
  "/work",
  "/work/anom-creative",
  "/blog",
  "/blog/two-directions",
  "/about",
  "/contact",
] as const;

const WIDTHS = [360, 390, 768, 1024, 1280, 1440, 1920];

test.describe("route parity", () => {
  test("every route renders with its landmarks and metadata", async ({
    page,
  }) => {
    for (const path of ROUTES) {
      const response = await page.goto(path === "" ? "/" : path);
      expect(response?.status(), path || "/").toBeLessThan(400);

      await expect(page.locator("main"), `${path || "/"} main`).toHaveCount(1);
      await expect(page.locator("h1"), `${path || "/"} h1`).toHaveCount(1);
      await expect(page.getByRole("banner")).toHaveCount(1);
      await expect(page.getByRole("contentinfo")).toHaveCount(1);

      await expect(page.locator("html")).toHaveAttribute("lang", "en");
      await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    }
  });

  test("every internal link resolves", async ({ page }) => {
    const seen = new Set<string>();

    for (const path of ROUTES) {
      await page.goto(path === "" ? "/" : path);

      const hrefs = await page.$$eval('a[href^="/"]', (anchors) =>
        Array.from(
          new Set(anchors.map((anchor) => anchor.getAttribute("href"))),
        ),
      );

      for (const href of hrefs) {
        if (!href || seen.has(href)) continue;
        seen.add(href);

        const response = await page.request.get(href);
        expect(response.status(), `${path || "/"} → ${href}`).toBeLessThan(400);
      }
    }

    expect(seen.size).toBeGreaterThan(0);
  });

  test("no horizontal overflow at any required width", async ({ page }) => {
    test.setTimeout(180_000);

    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 900 });

      for (const path of ROUTES) {
        await page.goto(path === "" ? "/" : path);

        const overflow = await page.evaluate(
          () =>
            document.documentElement.scrollWidth -
            document.documentElement.clientWidth,
        );

        expect(overflow, `${path || "/"} at ${width}px`).toBeLessThanOrEqual(1);
      }
    }
  });
});

/* ---------------------------------------------------------------------------
 * Legacy locale URLs
 * ------------------------------------------------------------------------- */

test.describe("legacy locale redirects", () => {
  const path = (page: import("@playwright/test").Page) =>
    new URL(page.url()).pathname;

  test("English-prefixed URLs land on the root path", async ({ page }) => {
    await page.goto("/en/work");
    expect(path(page)).toBe("/work");

    await page.goto("/en/blog/two-directions");
    expect(path(page)).toBe("/blog/two-directions");
  });

  test("Arabic-prefixed URLs land on the root path", async ({ page }) => {
    await page.goto("/ar");
    expect(path(page)).toBe("/");
    await expect(page.locator("main")).toBeVisible();

    await page.goto("/ar/about");
    expect(path(page)).toBe("/about");
  });
});

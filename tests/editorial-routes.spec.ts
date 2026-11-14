import { expect, test } from "@playwright/test";

const CONTACT_LINK = 'a[href^="mailto:"], a[href^="tel:"]';

test.describe("navigation", () => {
  test("desktop links use localized routes and mark the current page", async ({
    page,
  }) => {
    await page.goto("/en/work");

    const nav = page.locator("header .site-header__nav");
    await expect(nav.getByRole("link", { name: "Work" })).toHaveAttribute(
      "href",
      "/en/work",
    );
    await expect(nav.getByRole("link", { name: "Blog" })).toHaveAttribute(
      "href",
      "/en/blog",
    );
    await expect(nav.getByRole("link", { name: "About" })).toHaveAttribute(
      "href",
      "/en/about",
    );
    await expect(nav.getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "/en/contact",
    );
    await expect(nav.getByRole("link", { name: "Work" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await page.goto("/ar/about");

    const arabicNav = page.locator("header .site-header__nav");
    await expect(arabicNav.getByRole("link", { name: "الأعمال" })).toHaveAttribute(
      "href",
      "/ar/work",
    );
    await expect(arabicNav.getByRole("link", { name: "نبذة" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  test("the language link swaps locale and keeps the path", async ({ page }) => {
    await page.goto("/en/blog");

    await page.locator("header").getByRole("link", { name: "العربية" }).click();
    await expect(page).toHaveURL(/\/ar\/blog$/);

    await page.locator("header").getByRole("link", { name: "English" }).click();
    await expect(page).toHaveURL(/\/en\/blog$/);
  });
});

test.describe("mobile drawer", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("opens, traps focus, locks scroll, closes on Escape and returns focus", async ({
    page,
  }) => {
    await page.goto("/en");

    const trigger = page.locator(".menu-trigger");
    await expect(trigger).toBeVisible();

    await trigger.click();

    const dialog = page.locator("dialog#site-menu");
    await expect(dialog).toHaveAttribute("data-state", "open");
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
    await page.locator("#site-menu .nav-locale").focus();
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() => document.activeElement?.closest("#site-menu") !== null),
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
  for (const locale of ["en", "ar"] as const) {
    test(`footer links are 44px tall and no link is a placeholder (${locale})`, async ({
      page,
    }) => {
      await page.goto(`/${locale}`);

      const links = page.locator("footer a");
      const count = await links.count();
      expect(count).toBeGreaterThan(0);

      for (let index = 0; index < count; index += 1) {
        const box = await links.nth(index).boundingBox();
        expect(box).not.toBeNull();
        expect(box!.height).toBeGreaterThanOrEqual(44);
      }

      await expect(page.locator('a[href="#"]')).toHaveCount(0);
    });

    test(`the fixed trigger clears contact links (${locale})`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`/${locale}`);

      const contact = page.locator(CONTACT_LINK).first();
      await contact.scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);

      const contactBox = await contact.boundingBox();
      const triggerBox = await page.locator(".menu-trigger").boundingBox();

      expect(contactBox).not.toBeNull();
      expect(triggerBox).not.toBeNull();

      const overlaps =
        contactBox!.x < triggerBox!.x + triggerBox!.width &&
        contactBox!.x + contactBox!.width > triggerBox!.x &&
        contactBox!.y < triggerBox!.y + triggerBox!.height &&
        contactBox!.y + contactBox!.height > triggerBox!.y;

      expect(overlaps).toBe(false);
    });
  }
});

/* ---------------------------------------------------------------------------
 * Route parity
 * ------------------------------------------------------------------------- */

const ROUTES = [
  "",
  "/work",
  "/work/nimbus",
  "/blog",
  "/blog/two-directions",
  "/about",
  "/contact",
] as const;

const WIDTHS = [360, 390, 768, 1024, 1280, 1440, 1920];

test.describe("route parity", () => {
  for (const locale of ["en", "ar"] as const) {
    test(`every ${locale} route renders with its landmarks and metadata`, async ({
      page,
    }) => {
      for (const path of ROUTES) {
        const response = await page.goto(`/${locale}${path}`);
        expect(response?.status(), `${locale}${path}`).toBeLessThan(400);

        await expect(page.locator("main"), `${locale}${path} main`).toHaveCount(1);
        await expect(page.locator("h1"), `${locale}${path} h1`).toHaveCount(1);
        await expect(page.getByRole("banner")).toHaveCount(1);
        await expect(page.getByRole("contentinfo")).toHaveCount(1);

        await expect(page.locator("html")).toHaveAttribute("lang", locale);
        await expect(page.locator("html")).toHaveAttribute(
          "dir",
          locale === "ar" ? "rtl" : "ltr",
        );
      }
    });

    test(`every internal ${locale} link resolves`, async ({ page }) => {
      const seen = new Set<string>();

      for (const path of ROUTES) {
        await page.goto(`/${locale}${path}`);

        const hrefs = await page.$$eval('a[href^="/"]', (anchors) =>
          Array.from(new Set(anchors.map((anchor) => anchor.getAttribute("href")))),
        );

        for (const href of hrefs) {
          if (!href || seen.has(href)) continue;
          seen.add(href);

          const response = await page.request.get(href);
          expect(response.status(), `${locale}${path} → ${href}`).toBeLessThan(
            400,
          );
        }
      }

      expect(seen.size).toBeGreaterThan(0);
    });
  }

  test("no horizontal overflow at any required width", async ({ page }) => {
    test.setTimeout(300_000);

    for (const locale of ["en", "ar"] as const) {
      for (const width of WIDTHS) {
        await page.setViewportSize({ width, height: 900 });

        for (const path of ROUTES) {
          await page.goto(`/${locale}${path}`);

          const overflow = await page.evaluate(
            () =>
              document.documentElement.scrollWidth -
              document.documentElement.clientWidth,
          );

          expect(overflow, `${locale}${path} at ${width}px`).toBeLessThanOrEqual(
            1,
          );
        }
      }
    }
  });
});

/* ---------------------------------------------------------------------------
 * Composition — English and Arabic are not one mirrored layout.
 * ------------------------------------------------------------------------- */

test.describe("locale composition", () => {
  test("Arabic sets its own measure, leading and reading order", async ({
    page,
  }) => {
    await page.goto("/en");

    const english = await page.evaluate(() => {
      const main = document.querySelector("main")!;
      const style = getComputedStyle(main);
      const title = document.querySelector("#hero-title")!;
      return {
        measure: style.getPropertyValue("--chapter-open-measure").trim(),
        lead: style.getPropertyValue("--display-lead").trim(),
        align: getComputedStyle(title).textAlign,
        firstMeta: document.querySelector("[data-hero-meta] > *")?.textContent,
      };
    });

    await page.goto("/ar");

    const arabic = await page.evaluate(() => {
      const main = document.querySelector("main")!;
      const style = getComputedStyle(main);
      const title = document.querySelector("#hero-title")!;
      return {
        measure: style.getPropertyValue("--chapter-open-measure").trim(),
        lead: style.getPropertyValue("--display-lead").trim(),
        align: getComputedStyle(title).textAlign,
        firstMeta: document.querySelector("[data-hero-meta] > *")?.textContent,
      };
    });

    expect(english.measure).toBe("64rem");
    expect(arabic.measure).toBe("46rem");
    expect(english.lead).not.toBe(arabic.lead);

    expect(english.align).toBe("center");
    expect(arabic.align).not.toBe(english.align);

    expect(english.firstMeta).toContain("Available for work");
    expect(arabic.firstMeta).toContain("القاهرة");
  });

  test("Arabic navigation reads from the right and detail sections keep DOM order", async ({
    page,
  }) => {
    await page.goto("/ar");

    const navX = await page.$$eval("header .site-header__nav a", (anchors) =>
      anchors.map((anchor) => anchor.getBoundingClientRect().x),
    );
    expect(navX[0]).toBeGreaterThan(navX[1]);

    await page.goto("/ar/work/nimbus");

    const sections = await page.$$eval("main section h2", (headings) =>
      headings.map((heading) => ({
        text: heading.textContent,
        y: heading.getBoundingClientRect().top + window.scrollY,
      })),
    );

    expect(sections.length).toBeGreaterThanOrEqual(3);

    for (let index = 1; index < sections.length; index += 1) {
      expect(sections[index].y).toBeGreaterThan(sections[index - 1].y);
    }
  });
});

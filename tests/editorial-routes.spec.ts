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

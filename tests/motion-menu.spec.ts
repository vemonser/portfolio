import { expect, test } from "./support/fixtures";

const TRIGGER = ".menu-trigger";
const DIALOG = "dialog#site-menu";
const CLOSE = `${DIALOG} .nav-close`;

test.describe("Lottie menu mark", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("mounts the player at rest and retires the CSS fallback", async ({
    page,
  }) => {
    await page.goto("/");

    const trigger = page.locator(TRIGGER);
    await expect(trigger).toBeVisible();
    await expect(trigger).toHaveAccessibleName("Open navigation");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    const mark = trigger.locator("[data-motion]");
    await expect(mark).toHaveAttribute("data-motion", "rest");
    await expect(trigger.locator('[data-lottie-ready="true"]')).toHaveCount(1);
    await expect(trigger.locator("svg")).toBeVisible();

    // Once the player has paint, the CSS bars must step aside.
    await expect(trigger.locator(".menu-trigger__bars")).toBeHidden();
  });

  test("morphs to the close mark on open and back on close", async ({
    page,
  }) => {
    await page.goto("/");

    await page.locator(TRIGGER).click();

    const dialog = page.locator(DIALOG);
    await expect(dialog).toHaveAttribute("data-state", "open");

    const close = page.locator(CLOSE);
    await expect(close).toHaveAccessibleName("Close navigation");
    await expect(close.locator("[data-motion]")).toHaveAttribute(
      "data-motion",
      "open",
    );
    await expect(close.locator("svg")).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveAttribute("data-state", "closing");
    await expect(close.locator("[data-motion]")).toHaveAttribute(
      "data-motion",
      "close",
    );

    await expect(dialog).toHaveAttribute("data-state", "closed", {
      timeout: 5_000,
    });
    await expect(page.locator(TRIGGER)).toBeFocused();
    await expect(page.locator(TRIGGER).locator("[data-motion]")).toHaveAttribute(
      "data-motion",
      "rest",
    );
  });

  test("keeps the instant open and close under reduced motion", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    await page.locator(TRIGGER).click();

    const dialog = page.locator(DIALOG);
    await expect(dialog).toHaveAttribute("data-state", "open");
    await expect(page.locator(CLOSE).locator("[data-motion]")).toHaveAttribute(
      "data-motion",
      "open",
    );

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveAttribute("data-state", "closed", {
      timeout: 1_500,
    });
    await expect(page.locator(TRIGGER)).toBeFocused();
  });
});

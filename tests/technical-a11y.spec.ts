import { expect, test } from "./support/fixtures";

test.describe("technical accessibility pass", () => {
  test("skip link is the first keyboard stop and targets main", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForFunction(
      () => document.documentElement.dataset.pageLoader !== "run",
    );
    await expect(page.locator("html")).toHaveAttribute("data-cursor", "on");

    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "Skip to content" });
    await expect(skip).toBeFocused();
    await expect(skip).toHaveAttribute("href", "#main-content");
    await skip.press("Enter");
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("client navigation moves focus to the new main", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-cursor", "on");
    await page
      .locator("header")
      .getByRole("link", { name: "Work" })
      .click();
    await expect(page).toHaveURL(/\/work$/);
    await expect(page.locator("#main-content")).toBeFocused();
  });

  test("contact status live region exists before the request", async ({
    page,
  }) => {
    await page.goto("/contact");

    const live = page.locator("[data-form-status-live]");
    await expect(live).toHaveCount(1);
    await expect(live).toHaveAttribute("aria-live", "polite");
    await expect(page.locator("[data-form-error-live]")).toHaveAttribute(
      "aria-live",
      "assertive",
    );

    await page.route("**/api/test-contact", (route) =>
      route.fulfill({ status: 200, body: "ok" }),
    );
    await page.locator("form[data-contact-form]").evaluate((form) => {
      form.setAttribute("data-contact-endpoint", "/api/test-contact");
    });
    await page.getByLabel("Name", { exact: true }).fill("Sam Rivera");
    await page.getByLabel("Email", { exact: true }).fill("sam@example.com");
    await page
      .getByLabel("Message", { exact: true })
      .fill("A bilingual portfolio enquiry.");
    await page.getByRole("button", { name: "Send message" }).click();

    await expect(live).toContainText("Your message is on its way.");
    await expect(page.getByLabel("Email", { exact: true })).toHaveAttribute(
      "spellcheck",
      "false",
    );
  });

  test("mobile header keeps a compact contact action clear of the menu", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/contact");

    const cta = page.locator("header .header-cta");
    const trigger = page.locator(".menu-trigger");
    await expect(cta).toBeVisible();
    await expect(trigger).toBeVisible();

    const [ctaBox, triggerBox] = await Promise.all([
      cta.boundingBox(),
      trigger.boundingBox(),
    ]);
    expect(ctaBox).not.toBeNull();
    expect(triggerBox).not.toBeNull();
    expect(ctaBox!.x + ctaBox!.width).toBeLessThan(triggerBox!.x);
  });

  test("project recording exposes a keyboard pause control", async ({
    page,
  }) => {
    await page.goto("/work/anom-creative");
    const video = page.locator("video");
    await video.scrollIntoViewIfNeeded();
    await expect
      .poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime))
      .toBeGreaterThan(0);

    await page.getByRole("button", { name: "Pause recording" }).click();
    expect(await video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(
      true,
    );

    await page.getByRole("button", { name: "Play recording" }).click();
    await expect
      .poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime))
      .toBeGreaterThan(0);

    await page.locator("footer").scrollIntoViewIfNeeded();
    await expect
      .poll(() => video.evaluate((element: HTMLVideoElement) => element.paused))
      .toBe(true);
    await video.scrollIntoViewIfNeeded();
    await expect(page.getByRole("button", { name: "Pause recording" })).toBeVisible();
    await expect
      .poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime))
      .toBeGreaterThan(0);
  });

  test("hero stays paused when toggled before the scene builds", async ({
    page,
  }) => {
    await page.goto("/lab/hero?loader=1", { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveAttribute("data-cursor", "on");

    const toggle = page.getByRole("button", { name: "Pause motion" });
    await toggle.evaluate((element: HTMLButtonElement) => element.click());
    await expect(
      page.getByRole("button", { name: "Play motion" }),
    ).toHaveAttribute("aria-pressed", "true");

    const canvas = page.locator("canvas.hero-scene").first();
    await expect(canvas).toHaveAttribute("data-running", "0");
    await page.waitForTimeout(1800);
    await expect(canvas).toHaveAttribute("data-running", "0");
  });

  test("hero motion can be paused and resumed", async ({ page }) => {
    await page.goto("/lab/hero?loader=1");
    await expect(page.locator(".page-loader").first()).toBeHidden({
      timeout: 15_000,
    });

    const canvas = page.locator("canvas.hero-scene").first();
    await expect(canvas).toHaveAttribute("data-running", "1");
    await page.getByRole("button", { name: "Pause motion" }).click();
    await expect(canvas).toHaveAttribute("data-running", "0");
    await page.getByRole("button", { name: "Play motion" }).click();
    await expect(canvas).toHaveAttribute("data-running", "1");
  });
});

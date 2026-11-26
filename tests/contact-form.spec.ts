import type { Page } from "@playwright/test";
import { expect, test } from "./support/fixtures";

const FORM = "form[data-contact-form]";
const STATUS = "[data-form-status]";

const copy = {
  name: "Name",
  email: "Email",
  message: "Message",
  send: "Send message",
  sending: "Sending…",
  requiredName: "Please add your name.",
  requiredEmail: "Please add an email address.",
  invalidEmail: "That email address does not look right.",
  requiredMessage: "Please write a message.",
  sent: "Your message is on its way.",
  ready: "Your message is ready. Open your mail app to send it.",
  failed: "Something went wrong. Your message is still here — try again.",
};

async function openContact(page: Page) {
  await page.goto("/contact");
  await page.locator(FORM).waitFor();
  await expect(page.locator("html")).toHaveAttribute("data-cursor", "on");
}

/** Point the form at a mock endpoint; the default transport is mailto. */
async function useEndpoint(page: Page, endpoint: string) {
  await page.locator(FORM).evaluate((form, value) => {
    form.setAttribute("data-contact-endpoint", value);
  }, endpoint);
}

async function fillValid(page: Page) {
  await page.getByLabel(copy.name, { exact: true }).fill("Sam Rivera");
  await page.getByLabel(copy.email, { exact: true }).fill("sam@example.com");
  await page
    .getByLabel(copy.message, { exact: true })
    .fill("I would like to build a bilingual site.");
}

test.describe("contact form", () => {
  test("reports every missing required field", async ({ page }) => {
    await openContact(page);

    await page.getByRole("button", { name: copy.send }).click();

    await expect(page.getByText(copy.requiredName)).toBeVisible();
    await expect(page.getByText(copy.requiredEmail)).toBeVisible();
    await expect(page.getByText(copy.requiredMessage)).toBeVisible();
  });

  test("rejects an invalid email shape and keeps the values", async ({
    page,
  }) => {
    await openContact(page);

    await page.getByLabel(copy.name, { exact: true }).fill("Sam Rivera");
    await page.getByLabel(copy.email, { exact: true }).fill("not-an-email");
    await page
      .getByLabel(copy.message, { exact: true })
      .fill("A message that should survive the error.");

    await page.getByRole("button", { name: copy.send }).click();

    await expect(page.getByText(copy.invalidEmail)).toBeVisible();
    await expect(page.getByLabel(copy.name, { exact: true })).toHaveValue(
      "Sam Rivera",
    );
    await expect(page.getByLabel(copy.message, { exact: true })).toHaveValue(
      "A message that should survive the error.",
    );
  });

  test("associates a field error with its input", async ({ page }) => {
    await openContact(page);

    await page.getByRole("button", { name: copy.send }).click();

    const email = page.getByLabel(copy.email, { exact: true });
    await expect(email).toHaveAttribute("aria-invalid", "true");

    const describedBy = await email.getAttribute("aria-describedby");
    expect(describedBy).toBeTruthy();

    const errorText = await page
      .locator(`#${describedBy!.split(" ")[0]}`)
      .textContent();
    expect(errorText).toContain(copy.requiredEmail);
  });

  test("shows submitting then success against a live endpoint", async ({
    page,
  }) => {
    await page.route("**/api/test-contact", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 900));
      await route.fulfill({ status: 200, body: "ok" });
    });

    await openContact(page);
    await useEndpoint(page, "/api/test-contact");
    await fillValid(page);

    const submit = page.getByRole("button", { name: copy.send });
    await submit.click();

    await expect(
      page.getByRole("button", { name: copy.sending }),
    ).toBeDisabled();
    await expect(page.locator(STATUS)).toContainText(copy.sent);
    await expect(page.getByRole("button", { name: copy.send })).toBeEnabled();
  });

  test("falls back to a real mailto when the API is unconfigured", async ({
    page,
  }) => {
    await openContact(page);
    await fillValid(page);

    await page.getByRole("button", { name: copy.send }).click();

    await expect(page.locator(STATUS)).toContainText(copy.ready);
    await expect(page.locator(`${STATUS} a`)).toHaveAttribute(
      "href",
      /^mailto:.*subject=/,
    );
  });

  test("shows a generic failure without leaking the status code", async ({
    page,
  }) => {
    await page.route("**/api/test-contact", (route) =>
      route.fulfill({ status: 500, body: "boom" }),
    );

    await openContact(page);
    await useEndpoint(page, "/api/test-contact");
    await fillValid(page);

    await page.getByRole("button", { name: copy.send }).click();

    await expect(page.locator(STATUS)).toContainText(copy.failed);
    const status = (await page.locator(STATUS).textContent()) ?? "";
    expect(status).not.toMatch(/500|stack|Error:/i);
    await expect(page.getByLabel(copy.name, { exact: true })).toHaveValue(
      "Sam Rivera",
    );
  });
});

test.describe("contact layout", () => {
  test("aligns the submit action to the end and stacks the notes below", async ({
    page,
  }) => {
    await openContact(page);

    const form = page.locator(FORM);
    const submit = page.getByRole("button", { name: copy.send });
    await expect(submit.locator("svg")).toHaveCount(0);
    const hint = page.getByText("I usually reply within two working days.", {
      exact: true,
    });
    const privacy = page.getByText(
      "Your details are used only to reply to this enquiry.",
      { exact: true },
    );

    const [formBox, submitBox, hintBox, privacyBox] = await Promise.all([
      form.boundingBox(),
      submit.boundingBox(),
      hint.boundingBox(),
      privacy.boundingBox(),
    ]);

    expect(formBox).not.toBeNull();
    expect(submitBox).not.toBeNull();
    expect(hintBox).not.toBeNull();
    expect(privacyBox).not.toBeNull();
    expect(
      Math.abs(submitBox!.x + submitBox!.width - (formBox!.x + formBox!.width)),
    ).toBeLessThan(2);
    expect(hintBox!.y).toBeGreaterThan(submitBox!.y + submitBox!.height);
    expect(privacyBox!.y).toBeGreaterThan(hintBox!.y + hintBox!.height);
    expect(Math.abs(privacyBox!.x - hintBox!.x)).toBeLessThan(2);
  });

  for (const width of [360, 390]) {
    test(`fixed menu trigger clears the contact links (${width}px)`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/contact");
      await page.locator(FORM).waitFor();

      const email = page.locator('a[href^="mailto:"]').first();
      await email.scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);

      const emailBox = await email.boundingBox();
      const triggerBox = await page.locator(".menu-trigger").boundingBox();

      expect(emailBox).not.toBeNull();
      expect(triggerBox).not.toBeNull();

      const overlaps =
        emailBox!.x < triggerBox!.x + triggerBox!.width &&
        emailBox!.x + emailBox!.width > triggerBox!.x &&
        emailBox!.y < triggerBox!.y + triggerBox!.height &&
        emailBox!.y + emailBox!.height > triggerBox!.y;

      expect(overlaps).toBe(false);

      const topmost = await page.evaluate(
        ([x, y]) => {
          const node = document.elementFromPoint(x, y);
          return node?.closest("a")?.getAttribute("href") ?? node?.tagName;
        },
        [
          emailBox!.x + emailBox!.width / 2,
          emailBox!.y + emailBox!.height / 2,
        ],
      );

      expect(topmost).toContain("mailto:");
    });
  }
});

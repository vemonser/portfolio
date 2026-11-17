import { test as base } from "@playwright/test";

import { INTRO_KEY } from "../../src/features/intro/intro-session";

/**
 * The intro is a once-per-session decoration. Existing specs should not pay
 * for it or screenshot it, so they start with the key already set. The intro's
 * own spec imports the untouched `@playwright/test` test instead.
 */
export const test = base.extend({
  page: async ({ page }, run) => {
    await page.addInitScript((key) => {
      try {
        window.sessionStorage.setItem(key, "1");
      } catch {
        // The navigation under test does not depend on the intro gate.
      }
    }, INTRO_KEY);

    await run(page);
  },
});

export { expect } from "@playwright/test";
export type { Locator, Page } from "@playwright/test";

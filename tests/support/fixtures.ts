import { test as base, expect } from "@playwright/test";

/**
 * Most behavioural tests are not about the first-load plate. The loader plays
 * on every document now, so this fixture opts out of it with the gate's test
 * key; the loader has its own spec and deliberately uses the raw Playwright
 * test so it exercises the real path.
 */
export const test = base.extend({
  page: async ({ page }, run) => {
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem("pf-loader-off", "1");
      } catch {
        // Private mode: the gate would skip anyway.
      }
    });
    await run(page);
  },
});

export { expect };

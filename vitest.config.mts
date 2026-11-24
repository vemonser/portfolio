import { defineConfig } from "vitest/config";

/**
 * Unit tests live beside the source they cover. `tests/` holds Playwright
 * specs, which have their own runner and must not be collected by Vitest.
 */
export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}", "video/src/**/*.test.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**"],
  },
});

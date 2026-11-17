import { defineConfig, devices } from "@playwright/test";

/**
 * Browser tests run against a real Next dev server: the behaviours under test
 * (hydration, WebGL fallbacks, media queries, Lenis) do not exist in a static
 * snapshot. One worker keeps the single dev server and the scene stable.
 */
const PORT = Number(process.env.PORT ?? 3000);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    // `/` is the readiness URL: `/ar` is a permanent redirect, which the
    // readiness probe does not follow. The redirect itself is covered by the
    // legacy-locale tests.
    url: `${baseURL}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});

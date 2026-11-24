import { test as rawTest, expect } from "@playwright/test";

import { test } from "./support/fixtures";

/**
 * The reveal gate. Every entrance animation waits for the page loader and the
 * route curtain, then holds for a beat so the empty space registers. These
 * tests read the real timing out of the page rather than asserting a class
 * name, because the contract is about order, not markup.
 */
rawTest.describe("reveal gate", () => {
  rawTest("text waits for the loader, then rises after the hold", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      type Mark = { type: "loader" | "prepared" | "revealed"; at: number; value?: string };
      const log: Mark[] = [];
      (window as unknown as { __revealLog: Mark[] }).__revealLog = log;

      let lastLoader: string | undefined;
      let lastPrepared = false;
      let lastRevealed = false;

      const read = () => {
        const loader = document.documentElement?.dataset.pageLoader;
        const title = document.querySelector("h1");

        if (loader && loader !== lastLoader) {
          lastLoader = loader;
          log.push({ type: "loader", at: performance.now(), value: loader });
        }

        const prepared = title?.getAttribute("data-prepared") === "true";
        if (prepared && !lastPrepared) {
          lastPrepared = true;
          log.push({ type: "prepared", at: performance.now() });
        }

        const revealed = title?.getAttribute("data-revealed") === "true";
        if (revealed && !lastRevealed) {
          lastRevealed = true;
          log.push({ type: "revealed", at: performance.now() });
        }
      };

      new MutationObserver(read).observe(document, {
        attributes: true,
        subtree: true,
        attributeFilter: [
          "data-page-loader",
          "data-prepared",
          "data-revealed",
        ],
      });
      read();
    });

    await page.goto("/work");

    const title = page.locator("h1").first();
    await expect(title).toHaveAttribute("data-revealed", "true", {
      timeout: 20_000,
    });

    const log = await page.evaluate(
      () =>
        (window as unknown as { __revealLog: Array<{ type: string; at: number; value?: string }> })
          .__revealLog,
    );

    const loaderDone = log.findLast(
      (entry) => entry.type === "loader" && entry.value === "done",
    );
    const prepared = log.findLast((entry) => entry.type === "prepared");
    const revealed = log.findLast((entry) => entry.type === "revealed");

    expect(loaderDone, "the loader must finish").toBeTruthy();
    expect(prepared, "the block must be prepared").toBeTruthy();
    expect(revealed, "the block must reveal").toBeTruthy();

    // The split is prepared only after the loader is gone, and the rise starts
    // from that prepared state rather than from the loader's last frame.
    expect(prepared!.at).toBeGreaterThanOrEqual(loaderDone!.at);
    expect(revealed!.at - prepared!.at).toBeGreaterThan(600);

    // While the loader was up, the title was invisible: no unsplit block ever
    // painted over the plate.
    expect(log.some((entry) => entry.type === "prepared" && entry.at < loaderDone!.at)).toBe(
      false,
    );
  });

  rawTest("the gate reopens for a route change", async ({ page }) => {
    await page.goto("/work");
    await expect(page.locator("h1").first()).toHaveAttribute(
      "data-revealed",
      "true",
      { timeout: 20_000 },
    );

    // A client navigation mounts a new document under the curtain. The new
    // title must stay parked while the curtain is up and reveal only after it
    // leaves.
    await page.getByRole("link", { name: "About" }).first().click();
    await expect(page).toHaveURL(/\/about$/);

    const curtain = page.locator(".route-curtain");
    const title = page.locator("h1").first();

    await expect(curtain).toHaveAttribute("data-active", "true");
    await expect(title).not.toHaveAttribute("data-revealed", "true");

    await expect(title).toHaveAttribute("data-revealed", "true", {
      timeout: 20_000,
    });
    expect(await curtain.getAttribute("data-active")).not.toBe("true");
  });
});

test.describe("text reveal", () => {
  test("reveals prose blocks after the fold", async ({ page }) => {
    await page.goto("/blog/calm-motion");

    const article = page.locator(".prose-blog");
    await expect(article).toHaveAttribute("data-reveal", "ready");

    // The first paragraph is above the fold and reveals without scrolling.
    const first = article.locator("p").first();
    await expect(first).toHaveAttribute("data-revealed", "true", {
      timeout: 15_000,
    });
    await expect(first).toHaveCSS("opacity", "1");

    // A paragraph near the end stays parked until the reader reaches it.
    const last = article.locator("p").last();
    await last.scrollIntoViewIfNeeded();
    await expect(last).toHaveAttribute("data-revealed", "true", {
      timeout: 15_000,
    });
  });

  test("no-JS visitors see the copy", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    const baseURL = process.env.PORT ?? 3000;

    await page.goto(`http://localhost:${baseURL}/work`);

    const title = page.locator("h1").first();
    await expect(title).toHaveCSS("opacity", "1");
    await expect(page.locator("[data-overlay]").first()).toBeHidden();
    await expect(page.locator(".route-curtain")).toBeHidden();

    await context.close();
  });
});

test.describe("reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("everything is visible with no cover and no masks", async ({ page }) => {
    await page.goto("/work");

    const title = page.locator("h1").first();
    await expect(title).toHaveCSS("opacity", "1");
    await expect(title.locator(".tr-line, .tr-word")).toHaveCount(0);
    await expect(page.locator("[data-overlay]").first()).toBeHidden();
  });
});
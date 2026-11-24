/**
 * Browser-side capture helpers. Everything here runs against a real page;
 * nothing knows about Remotion or the manifest shape.
 */

export const DESKTOP = {
  label: "desktop",
  cssWidth: 1440,
  cssHeight: 900,
  dpr: 2,
  context: {
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  },
};

export const MOBILE = {
  label: "mobile",
  cssWidth: 390,
  cssHeight: 844,
  dpr: 3,
  context: {
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent:
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  },
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function openPage(browser, contextOptions, url) {
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  page.setDefaultTimeout(45_000);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.evaluate(() => document.fonts.ready).catch(() => {});
  return { context, page };
}

/**
 * Sites often hold a full-viewport loader after networkidle. Poll until no
 * fixed element covers most of the viewport for two consecutive checks.
 */
export async function waitForPreloader(page, { timeoutMs = 15_000 } = {}) {
  const started = Date.now();
  let calm = 0;
  while (Date.now() - started < timeoutMs) {
    const covered = await page
      .evaluate(() => {
        return [...document.querySelectorAll("body *")].some((el) => {
          const style = getComputedStyle(el);
          if (
            style.position !== "fixed" ||
            style.visibility === "hidden" ||
            style.display === "none" ||
            Number(style.opacity) < 0.05
          ) {
            return false;
          }
          const rect = el.getBoundingClientRect();
          return (
            rect.width >= innerWidth * 0.8 && rect.height >= innerHeight * 0.8
          );
        });
      })
      .catch(() => false);

    calm = covered ? 0 : calm + 1;
    if (calm >= 2) return Math.round(Date.now() - started);
    await sleep(300);
  }
  return -1;
}

const COOKIE_SELECTORS = [
  "#onetrust-accept-btn-handler",
  "#CybotCookiebotDialogBodyLevelButtonLevelOptinAllowAll",
  "#axeptio_btn_acceptAll",
  ".cc-btn.cc-allow",
  "[data-testid='cookie-accept']",
];

const COOKIE_BANNER_SELECTORS = [
  "#onetrust-consent-sdk",
  "#CybotCookiebotDialog",
  ".cky-consent-container",
  ".cc-window",
  "[id*='cookie' i][class*='banner' i]",
  "[class*='cookie-consent' i]",
];

export async function dismissCookieBanners(page) {
  const clicked = [];
  for (const selector of COOKIE_SELECTORS) {
    const locator = page.locator(selector).first();
    if (await locator.isVisible().catch(() => false)) {
      await locator.click({ timeout: 1500 }).catch(() => {});
      clicked.push(selector);
    }
  }

  if (clicked.length === 0) {
    const byText = page
      .getByRole("button", {
        name: /^(accept|accept all|allow all|allow cookies|agree|got it|i agree)$/i,
      })
      .first();
    if (await byText.isVisible().catch(() => false)) {
      await byText.click({ timeout: 1500 }).catch(() => {});
      clicked.push("role=button(accept)");
    }
  }

  const hidden = await page.evaluate((selectors) => {
    const names = [];
    for (const selector of selectors) {
      for (const el of document.querySelectorAll(selector)) {
        if (getComputedStyle(el).display === "none") continue;
        el.style.display = "none";
        names.push(selector);
      }
    }
    return [...new Set(names)];
  }, COOKIE_BANNER_SELECTORS);

  await sleep(250);
  return { clicked, hidden };
}

async function waitForImages(page, timeoutMs = 6000, includeLazy = false) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const pending = await page
      .evaluate(
        (includeLazyImages) =>
          [...document.images].filter((img) => {
            if (!includeLazyImages && img.loading === "lazy") return false;
            return Boolean(img.currentSrc || img.src) && !img.complete;
          }).length,
        includeLazy,
      )
      .catch(() => 0);
    if (pending === 0) return true;
    await sleep(200);
  }
  return false;
}

/**
 * Scroll the whole page once so lazy media and scroll-triggered reveals run,
 * then wait until the document height stops growing. Leaves the page at the
 * bottom on purpose: the full-page shot is taken there so footer content is
 * in its revealed state too.
 */
export async function primePage(page, viewportHeight) {
  await page.evaluate(() => {
    document.documentElement.style.scrollBehavior = "auto";
  });
  await page.addStyleTag({
    content:
      "*,*::before,*::after{transition-duration:0.001s!important;transition-delay:0s!important;scroll-behavior:auto!important}",
  });

  await waitForImages(page, 6000);

  const heights = [];
  for (let pass = 0; pass < 3; pass += 1) {
    const height = await page.evaluate(() =>
      Math.max(
        document.documentElement.scrollHeight,
        document.body ? document.body.scrollHeight : 0,
      ),
    );
    heights.push(height);

    for (let y = 0; y < height; y += Math.round(viewportHeight * 0.7)) {
      await page.evaluate(
        (value) => window.scrollTo({ top: value, behavior: "instant" }),
        y,
      );
      await sleep(140);
    }

    await page.evaluate(() =>
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "instant",
      }),
    );
    await sleep(750);
    await page.waitForLoadState("networkidle").catch(() => {});
    // After the scroll pass lazy images have been requested; wait for them too.
    await waitForImages(page, 5000, true);

    const next = await page.evaluate(() =>
      Math.max(
        document.documentElement.scrollHeight,
        document.body ? document.body.scrollHeight : 0,
      ),
    );
    if (next <= height + 2) {
      return { height: next, heights };
    }
  }

  const height = await page.evaluate(() =>
    Math.max(
      document.documentElement.scrollHeight,
      document.body ? document.body.scrollHeight : 0,
    ),
  );
  return { height, heights };
}

/**
 * Chromium does not paint <video> elements that sit outside the viewport when
 * it captures beyond the viewport, so a full-page shot shows them blank. Swap
 * each video for an <img> of its current frame, keeping classes and inline
 * styles so layout does not move.
 */
export async function freezeVideos(page, { timeoutMs = 5000 } = {}) {
  return page.evaluate(async (waitMs) => {
    const results = [];
    for (const video of [...document.querySelectorAll("video")]) {
      const src = video.currentSrc || video.src || "(no src)";
      const rect = video.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) {
        results.push({ status: "skipped-hidden", src });
        continue;
      }
      try {
        if (video.readyState < 2) {
          await new Promise((resolve) => {
            let done = false;
            const finish = () => {
              if (done) return;
              done = true;
              resolve();
            };
            video.addEventListener("loadeddata", finish, { once: true });
            setTimeout(finish, waitMs);
          });
        }
        if (video.readyState < 2) {
          results.push({ status: "no-frame", src });
          continue;
        }
        if (
          Number.isFinite(video.duration) &&
          video.duration > 0.3 &&
          video.currentTime < 0.05
        ) {
          await new Promise((resolve) => {
            let done = false;
            const finish = () => {
              if (done) return;
              done = true;
              resolve();
            };
            video.addEventListener("seeked", finish, { once: true });
            try {
              video.currentTime = Math.min(0.2, video.duration / 3);
            } catch {
              finish();
            }
            setTimeout(finish, 1500);
          });
        }

        const width = video.videoWidth || Math.round(rect.width);
        const height = video.videoHeight || Math.round(rect.height);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(video, 0, 0, width, height);

        const img = document.createElement("img");
        img.src = canvas.toDataURL("image/jpeg", 0.92);
        img.alt = "";
        img.className = video.className;
        img.style.cssText = video.style.cssText;
        const style = getComputedStyle(video);
        img.style.objectFit = style.objectFit === "fill" ? "cover" : style.objectFit;
        await img.decode().catch(() => {});
        video.replaceWith(img);
        results.push({ status: "frozen", src, width, height });
      } catch (error) {
        results.push({ status: "error", src, error: String(error) });
      }
    }
    return results;
  }, timeoutMs);
}

/**
 * Fixed elements (nav, custom cursor, cookie bars) repeat in every stitched
 * chunk, so they are hidden. Sticky elements are content, not chrome: they
 * occupy flow space, so switching them to `relative` renders them at their
 * natural inline position instead of deleting them (which left the About
 * page's three pillar cards blank).
 */
export async function neutralizeChrome(page) {
  return page.evaluate(() => {
    const fixed = [];
    const unstuck = [];
    const kept = [];
    for (const el of document.querySelectorAll("body *")) {
      const style = getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;

      if (style.position === "fixed") {
        // A fixed canvas is the content (a WebGL page), not chrome. Hiding it
        // produced a 19 KB blank capture of Anom's /portfolio route.
        if (el.tagName === "CANVAS" || el.querySelector("canvas")) {
          kept.push(
            `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${
              el.className ? `.${String(el.className).split(" ")[0]}` : ""
            }`,
          );
          continue;
        }
        el.style.visibility = "hidden";
        fixed.push(
          `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${
            el.className ? `.${String(el.className).split(" ")[0]}` : ""
          }`,
        );
      } else if (style.position === "sticky") {
        el.style.position = "relative";
        el.style.top = "auto";
        el.style.bottom = "auto";
        unstuck.push(
          `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${
            el.className ? `.${String(el.className).split(" ")[0]}` : ""
          }`,
        );
      }
    }
    return {
      fixed: [...new Set(fixed)].slice(0, 24),
      unstuck: [...new Set(unstuck)].slice(0, 24),
      kept: [...new Set(kept)].slice(0, 24),
    };
  });
}

const SECTION_SELECTOR = "main > *, section, [data-section]";

export async function measureSections(page) {
  const raw = await page.evaluate((selector) => {
    const rows = [];
    for (const el of document.querySelectorAll(selector)) {
      const rect = el.getBoundingClientRect();
      if (rect.height < 24) continue;
      rows.push({
        offsetY: Math.round(rect.top + window.scrollY),
        height: Math.round(rect.height),
        label: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}${
          el.className ? `.${String(el.className).split(" ")[0]}` : ""
        }`,
      });
    }
    return rows;
  }, SECTION_SELECTOR);

  const sorted = raw
    .filter((row) => Number.isFinite(row.offsetY) && row.offsetY >= 0)
    .sort((a, b) => a.offsetY - b.offsetY);

  const deduped = [];
  for (const row of sorted) {
    const previous = deduped[deduped.length - 1];
    if (previous && row.offsetY - previous.offsetY < 200) continue;
    deduped.push(row);
  }
  return deduped;
}

/** Resolves config overrides (raw CSS offsets or selectors) against the page. */
export async function resolveStops(page, overrides) {
  const resolved = [];
  for (const override of overrides) {
    if (typeof override === "number") {
      resolved.push({ offsetY: Math.round(override), source: "config:number" });
      continue;
    }

    const found = await page.evaluate(
      ({ selector, index }) => {
        const matches = document.querySelectorAll(selector);
        const el = matches[index ?? 0];
        if (!el) return null;
        const rect = el.getBoundingClientRect();
        return {
          offsetY: Math.round(rect.top + window.scrollY),
          label: `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ""}`,
        };
      },
      { selector: override.selector, index: override.index ?? 0 },
    );

    if (!found) {
      throw new Error(
        `Stop selector not found: "${override.selector}" (index ${override.index ?? 0})`,
      );
    }

    resolved.push({
      offsetY: found.offsetY + (override.offsetPx ?? 0),
      source: `config:${override.selector}`,
    });
  }
  return resolved;
}

/**
 * Drives a real wheel scroll in a recordVideo context. Used only for routes
 * flagged with `record: true`; the composition never consumes this clip.
 */
export async function recordScroll(page, viewportHeight, durationMs = 7000) {
  const started = Date.now();
  const step = Math.round(viewportHeight * 0.55);
  while (Date.now() - started < durationMs) {
    await page.mouse.wheel(0, step);
    await sleep(280);
  }
  await sleep(500);
}

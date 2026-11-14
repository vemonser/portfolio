/**
 * Repeatable evidence capture for the redesign run.
 *
 *   node scripts/evidence-qa.mjs screenshot --route /en --out <png> \
 *     [--width 1440] [--height 900] [--full]
 *   node scripts/evidence-qa.mjs checks --out <json>
 *
 * `checks` exits non-zero when any behavioural assertion fails, so the
 * Evidence Gate records a real result rather than a claim. Requires a running
 * dev server (BASE_URL, default http://localhost:3000).
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const argv = process.argv.slice(2);
const mode = argv[0];
const flags = {};
for (let i = 1; i < argv.length; i += 1) {
  const key = argv[i];
  if (!key.startsWith("--")) continue;
  const name = key.slice(2);
  const next = argv[i + 1];
  if (!next || next.startsWith("--")) flags[name] = true;
  else {
    flags[name] = next;
    i += 1;
  }
}

async function settle(page) {
  await page.evaluate(async () => {
    const step = window.innerHeight * 0.6;
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(1000);
}

async function underlineOrigin(page) {
  const link = page.locator("main a[href^=\"mailto:\"]").first();
  const before = await link.evaluate(
    (n) => getComputedStyle(n, "::after").transformOrigin,
  );
  await link.hover();
  await page.waitForTimeout(650);
  const after = await link.evaluate(
    (n) => getComputedStyle(n, "::after").transformOrigin,
  );
  return { before, after };
}

async function screenshot() {
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: {
      width: Number(flags.width ?? 1440),
      height: Number(flags.height ?? 900),
    },
  });
  await page.goto(`${BASE}${flags.route}`, { waitUntil: "networkidle" });
  await settle(page);
  await mkdir(path.dirname(flags.out), { recursive: true });
  await page.screenshot({ path: flags.out, fullPage: Boolean(flags.full) });
  await browser.close();
  console.log(`saved ${flags.out}`);
}

async function checks() {
  const browser = await chromium.launch();
  const results = {};

  async function withPage(viewport, fn) {
    const page = await browser.newPage({ viewport });
    try {
      return await fn(page);
    } finally {
      await page.close();
    }
  }

  results.enUnderline = await withPage({ width: 1440, height: 900 }, async (page) => {
    await page.goto(`${BASE}/en/contact`, { waitUntil: "networkidle" });
    return underlineOrigin(page);
  });

  results.arUnderline = await withPage({ width: 1440, height: 900 }, async (page) => {
    await page.goto(`${BASE}/ar/contact`, { waitUntil: "networkidle" });
    return underlineOrigin(page);
  });

  results.overflows = await withPage({ width: 390, height: 844 }, async (page) => {
    const out = {};
    for (const route of ["/ar", "/en", "/en/work", "/ar/blog/two-directions"]) {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(400);
      out[route] = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
    }
    return out;
  });

  results.reducedMotion = await withPage({ width: 1440, height: 900 }, async (page) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${BASE}/en`, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    return page.evaluate(() => {
      const overlay = document.querySelector("[data-hero-overlay]");
      const line = document.querySelector("#hero-title span span");
      const statement = document.querySelector("#intro-title");
      return {
        overlayIn: overlay?.getAttribute("data-in"),
        lineTransform: getComputedStyle(line).transform,
        statementOpacity: statement
          ? getComputedStyle(statement.closest(".reveal")).opacity
          : null,
      };
    });
  });

  // The console-error assertion lives on its own fresh page: the WebGL
  // context limit is a browser-level budget, and earlier pages in this run
  // must not poison it.
  const consoleErrors = [];
  const home = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  home.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  home.on("pageerror", (err) => consoleErrors.push(err.message));

  await home.goto(`${BASE}/en`, { waitUntil: "networkidle" });
  await settle(home);
  results.heroMeta = await home.evaluate(() => {
    const meta = document.querySelector("[data-hero-meta]");
    return meta ? meta.innerText.replace(/\s+/g, " ").trim() : null;
  });
  results.footerClock = await home.evaluate(() => {
    const time = document.querySelector("[data-clock]");
    return time ? time.innerText.replace(/\s+/g, " ").trim() : null;
  });
  results.cards = await home.evaluate(
    () => document.querySelectorAll("a[data-project]").length,
  );
  results.seeAll = await home.evaluate(() => {
    const more = document.querySelector("section[data-section=\"selected-work\"] a[href$=\"/work\"]");
    return more
      ? { text: more.textContent, href: more.getAttribute("href") }
      : null;
  });

  results.workCards = await withPage({ width: 1440, height: 900 }, async (page) => {
    await page.goto(`${BASE}/en/work`, { waitUntil: "networkidle" });
    const en = await page.locator("a[data-project]").count();
    await page.goto(`${BASE}/ar/work`, { waitUntil: "networkidle" });
    const ar = await page.locator("a[data-project]").count();
    return { en, ar };
  });

  results.blogPosts = await withPage({ width: 1440, height: 900 }, async (page) => {
    await page.goto(`${BASE}/en/blog`, { waitUntil: "networkidle" });
    const en = await page.locator("main ul li a[href*=\"/blog/\"]").count();
    await page.goto(`${BASE}/ar/blog`, { waitUntil: "networkidle" });
    const ar = await page.locator("main ul li a[href*=\"/blog/\"]").count();
    return { en, ar };
  });

  await home.evaluate(() => window.scrollTo(0, window.innerHeight));
  await home.waitForTimeout(500);
  await home.locator(".menu-trigger").click();
  await home.waitForTimeout(900);
  results.menu = await home.evaluate(() => {
    const dialog = document.querySelector("dialog");
    return {
      open: Boolean(dialog?.open),
      state: dialog?.dataset.state ?? null,
      links: [...(dialog?.querySelectorAll(".nav-item a") ?? [])].map(
        (a) => a.textContent,
      ),
    };
  });
  await home.keyboard.press("Escape");
  await home.waitForTimeout(1300);
  results.menuClosed = await home.evaluate(
    () => !document.querySelector("dialog")?.open,
  );
  results.consoleErrors = consoleErrors;
  await home.close();
  await browser.close();

  const matrix = results.reducedMotion.lineTransform.match(/matrix\(([^)]+)\)/);
  const lineOffset = matrix ? Math.abs(Number(matrix[1].split(",")[5])) : 0;
  const en = results.enUnderline;
  const ar = results.arUnderline;
  const assertions = {
    // English: base origin at the right edge, hover origin at 0 → enters left.
    enMirrored: en.before !== en.after && en.after.startsWith("0px"),
    // Arabic: base origin at 0, hover origin at the right edge.
    arMirrored: ar.before !== ar.after && ar.before.startsWith("0px"),
    noOverflow: Object.values(results.overflows).every((value) => value <= 0),
    reducedMotion:
      results.reducedMotion.overlayIn === "true" &&
      lineOffset < 0.5 &&
      results.reducedMotion.statementOpacity === "1",
    menu:
      results.menu.open &&
      results.menu.links.includes("Blog") &&
      results.menuClosed,
    homeContent:
      results.cards === 6 &&
      Boolean(results.seeAll?.href?.endsWith("/work")) &&
      Boolean(results.footerClock?.match(/\d{2}:\d{2}/)) &&
      results.consoleErrors.length === 0,
    workIndex: results.workCards.en === 6 && results.workCards.ar === 6,
    blogIndex: results.blogPosts.en === 2 && results.blogPosts.ar === 2,
  };
  results.assertions = assertions;

  await mkdir(path.dirname(flags.out), { recursive: true });
  await writeFile(flags.out, `${JSON.stringify(results, null, 2)}\n`);

  const failed = Object.entries(assertions)
    .filter(([, ok]) => !ok)
    .map(([name]) => name);
  console.log(JSON.stringify(results, null, 2));
  if (failed.length > 0) {
    console.error(`FAILED: ${failed.join(", ")}`);
    process.exit(1);
  }
  console.log("all browser assertions passed");
}

if (mode === "screenshot") await screenshot();
else if (mode === "checks") await checks();
else {
  console.error("usage: evidence-qa.mjs screenshot|checks ...");
  process.exit(64);
}

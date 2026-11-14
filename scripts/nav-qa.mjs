/**
 * Behavioural QA for the navigation.
 *
 * The menu is a modal with real motion and real focus behaviour, so every
 * acceptance criterion is checked against a browser and leaves a screenshot
 * or a JSON report behind. Each case exits non-zero on failure.
 *
 *   pnpm dev                                   # in one terminal
 *   node scripts/nav-qa.mjs --case en-open --out artifacts
 *
 * Cases: en-top, en-reveal, en-open, en-close, ar-open, mobile, reduced,
 * locale, lip, stub, pause.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const args = process.argv.slice(2);
const readArg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const CASE = readArg("case");
const OUT = path.resolve(readArg("out", "artifacts"));

if (!CASE) {
  console.error(
    "usage: node scripts/nav-qa.mjs --case <en-top|en-reveal|en-open|en-close|locale|ar-open|lip|scrollpage|closewait|mobile|reduced|stub|pause> --out <dir>",
  );
  process.exit(2);
}

await mkdir(OUT, { recursive: true });

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const report = { case: CASE, base: BASE, checks: [] };

function check(name, condition, detail) {
  assert(condition, `${name}${detail ? ` — ${detail}` : ""}`);
  report.checks.push(name);
}

async function screenshot(page, name) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, type: "png" });
  report.artifact = path.relative(path.resolve(OUT, "../.."), file);
}

/** The home is one screen tall today; a spacer lets the scroll threshold run. */
async function makeScrollable(page) {
  await page.evaluate(() => {
    document.body.style.paddingBottom = "80vh";
  });
}

async function openMenu(page) {
  await makeScrollable(page);
  await page.evaluate(() => window.scrollTo(0, window.innerHeight * 0.5));
  await page.waitForTimeout(300);
  await page.locator(".menu-trigger").click();
  await page.waitForFunction(
    () => document.querySelector("#site-menu")?.open === true,
  );
  await page.waitForTimeout(950);
  // The pointer would otherwise still hover the close button, which is where
  // the trigger was.
  await page.mouse.move(4, 4);
  await page.waitForTimeout(200);
}

async function waitForClosed(page) {
  await page.waitForFunction(
    () => {
      const dialog = document.querySelector("#site-menu");
      return (
        dialog?.open === false &&
        getComputedStyle(document.documentElement).overflow !== "hidden"
      );
    },
    undefined,
    { timeout: 3000 },
  );
}

const browser = await chromium.launch();

try {
  if (CASE === "en-top") {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const links = await page.locator(".site-header__link").allTextContents();
    check("header links", links.join(",") === "Work,About,Contact", links.join(","));

    const trigger = await page
      .locator(".menu-trigger")
      .evaluate((el) => getComputedStyle(el).visibility);
    check("trigger hidden at the top", trigger === "hidden", trigger);

    check(
      "locale switch in the header",
      (await page.locator(".site-header__locale").getAttribute("href")) === "/ar",
    );

    await screenshot(page, "en-top.png");
  }

  if (CASE === "en-reveal") {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);

    await makeScrollable(page);
    await page.evaluate(() => window.scrollTo(0, 420));
    await page.waitForTimeout(700);

    const trigger = await page.locator(".menu-trigger").evaluate((el) => ({
      visibility: getComputedStyle(el).visibility,
      transform: getComputedStyle(el).transform,
      visible: el.dataset.visible,
    }));
    check("trigger appears past 30%", trigger.visibility === "visible", trigger.visibility);
    check("trigger is scaled to 1", trigger.transform.startsWith("matrix(1"), trigger.transform);
    check("revealed flag", trigger.visible === "true", trigger.visible);

    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(600);
    const back = await page
      .locator(".menu-trigger")
      .evaluate((el) => getComputedStyle(el).visibility);
    check("trigger hides back above the threshold", back === "hidden", back);

    await page.evaluate(() => window.scrollTo(0, 420));
    await page.waitForTimeout(600);
    await screenshot(page, "en-revealed.png");
  }

  if (CASE === "en-open") {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    await openMenu(page);

    const state = await page.evaluate(() => {
      const dialog = document.querySelector("#site-menu");
      const panel = document.querySelector(".nav-panel").getBoundingClientRect();
      const trigger = document.querySelector(".menu-trigger");
      const close = document.querySelector(".nav-close").getBoundingClientRect();
      return {
        open: dialog.open,
        state: dialog.dataset.state,
        expanded: trigger.getAttribute("aria-expanded"),
        controls: trigger.getAttribute("aria-controls"),
        focusInside: dialog.contains(document.activeElement),
        panelX: Math.round(panel.x),
        panelW: Math.round(panel.width),
        closeSize: [Math.round(close.width), Math.round(close.height)],
        overflow: getComputedStyle(document.documentElement).overflow,
        backdrop: getComputedStyle(dialog, "::backdrop").opacity,
        triggerSize: (() => {
          const r = trigger.getBoundingClientRect();
          return [Math.round(r.width), Math.round(r.height)];
        })(),
      };
    });

    check("dialog is open", state.open === true);
    check("open phase", state.state === "open", state.state);
    check("aria-expanded", state.expanded === "true", state.expanded);
    check("aria-controls", state.controls === "site-menu", state.controls);
    check("focus inside the dialog", state.focusInside === true);
    check("panel is on the inline-end edge", state.panelX > 1440 / 2, String(state.panelX));
    check("panel width", Math.abs(state.panelW - 540) <= 2, String(state.panelW));
    check("scroll locked", state.overflow === "hidden", state.overflow);
    check("backdrop faded in", Number(state.backdrop) > 0.3, state.backdrop);
    check("close target is at least 44px", state.closeSize[0] >= 44 && state.closeSize[1] >= 44, state.closeSize.join("x"));
    check("trigger target is at least 44px", state.triggerSize[0] >= 44 && state.triggerSize[1] >= 44, state.triggerSize.join("x"));

    await screenshot(page, "en-open.png");

    // Focus cycle: every stop is inside the dialog, and the last one wraps.
    const focusStops = [];
    for (let index = 0; index < 7; index += 1) {
      await page.keyboard.press("Tab");
      focusStops.push(
        await page.evaluate(() => {
          const dialog = document.querySelector("#site-menu");
          const active = document.activeElement;
          return {
            label: (active.textContent ?? active.getAttribute("aria-label") ?? "").trim().slice(0, 20),
            inside: dialog.contains(active),
          };
        }),
      );
    }
    check(
      "focus stays inside the dialog",
      focusStops.every((stop) => stop.inside),
      JSON.stringify(focusStops),
    );
  }

  if (CASE === "en-close") {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    await openMenu(page);

    await page.keyboard.press("Escape");
    await waitForClosed(page);
    const afterEsc = await page.evaluate(() => ({
      open: document.querySelector("#site-menu").open,
      focusReturned: document.activeElement === document.querySelector(".menu-trigger"),
      overflow: getComputedStyle(document.documentElement).overflow,
      expanded: document.querySelector(".menu-trigger").getAttribute("aria-expanded"),
    }));
    check("Escape closes the dialog", afterEsc.open === false);
    check("focus returns to the trigger", afterEsc.focusReturned === true);
    check("scroll unlocks", afterEsc.overflow === "visible", afterEsc.overflow);
    check("aria-expanded resets", afterEsc.expanded === "false", afterEsc.expanded);

    await openMenu(page);
    await page.mouse.click(200, 400);
    await waitForClosed(page);
    const afterBackdrop = await page.evaluate(() => ({
      open: document.querySelector("#site-menu").open,
      focusReturned: document.activeElement === document.querySelector(".menu-trigger"),
      overflow: getComputedStyle(document.documentElement).overflow,
      expanded: document.querySelector(".menu-trigger").getAttribute("aria-expanded"),
    }));
    check("backdrop click closes the dialog", afterBackdrop.open === false);
    check("backdrop click returns focus", afterBackdrop.focusReturned === true);
    check("backdrop click unlocks scroll", afterBackdrop.overflow === "visible", afterBackdrop.overflow);
    check("backdrop click resets aria", afterBackdrop.expanded === "false", afterBackdrop.expanded);

    await screenshot(page, "en-closed.png");
  }

  if (CASE === "lip") {
    // The rounded edge must lead the panel on the page-facing side. In English
    // that is the panel's left edge; in Arabic the panel is on the left, so the
    // lip has to be on its right edge. A wrong logical property hides it.
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    await makeScrollable(page);
    await page.evaluate(() => window.scrollTo(0, 420));
    await page.waitForTimeout(300);
    await page.locator(".menu-trigger").click();
    await page.waitForTimeout(220);
    const ltr = await page.evaluate(() => {
      const panel = document.querySelector(".nav-panel").getBoundingClientRect();
      const lip = document.querySelector(".nav-lip").getBoundingClientRect();
      return {
        panelLeft: panel.x,
        lipRight: lip.x + lip.width,
        lipWidth: lip.width,
      };
    });
    check("english lip leads the panel", ltr.lipRight <= ltr.panelLeft + 2, JSON.stringify(ltr));
    check("english lip is visible mid-transition", ltr.lipWidth > 40, String(ltr.lipWidth));
    await page.keyboard.press("Escape");
    await waitForClosed(page);

    await page.goto(`${BASE}/ar`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    await makeScrollable(page);
    await page.evaluate(() => window.scrollTo(0, 420));
    await page.waitForTimeout(300);
    await page.locator(".menu-trigger").click();
    await page.waitForTimeout(220);
    const rtl = await page.evaluate(() => {
      const panel = document.querySelector(".nav-panel").getBoundingClientRect();
      const lip = document.querySelector(".nav-lip").getBoundingClientRect();
      return {
        panelRight: panel.x + panel.width,
        lipLeft: lip.x,
        lipWidth: lip.width,
      };
    });
    check("arabic lip leads the panel", rtl.lipLeft >= rtl.panelRight - 2, JSON.stringify(rtl));
    check("arabic lip is visible mid-transition", rtl.lipWidth > 40, String(rtl.lipWidth));

    await screenshot(page, "ar-lip-mid.png");
    report.ltr = ltr;
    report.rtl = rtl;
  }

  if (CASE === "scrollpage") {
    // A long page is where closing can go wrong: unlocking the scroll before
    // the panel has left brings the scrollbar back and moves every fixed
    // element by its width mid-animation.
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    await page.evaluate(() => {
      document.body.style.minHeight = "300vh";
      window.scrollTo(0, 1200);
    });
    await page.waitForTimeout(400);

    const before = await page.evaluate(() => ({
      x: Math.round(document.querySelector(".menu-trigger").getBoundingClientRect().x),
      scrollY: window.scrollY,
    }));

    await page.locator(".menu-trigger").click();
    await page.waitForTimeout(950);
    const open = await page.evaluate(() => ({
      x: Math.round(document.querySelector(".menu-trigger").getBoundingClientRect().x),
      scrollY: window.scrollY,
      overflow: getComputedStyle(document.documentElement).overflow,
    }));
    check("scroll locks on a long page", open.overflow === "hidden", open.overflow);
    check("trigger holds its position when opening", Math.abs(open.x - before.x) <= 3, `${before.x} -> ${open.x}`);

    await page.locator(".nav-close").click();
    await page.waitForTimeout(220);
    const closing = await page.evaluate(() => {
      const root = document.documentElement;
      return {
        overflow: getComputedStyle(root).overflow,
        x: Math.round(document.querySelector(".menu-trigger").getBoundingClientRect().x),
        scrollY: window.scrollY,
        scrollW: root.scrollWidth,
        clientW: root.clientWidth,
        closeBg: getComputedStyle(document.querySelector(".nav-close")).backgroundColor,
        triggerBg: getComputedStyle(document.querySelector(".menu-trigger")).backgroundColor,
        closeRgb: (() => {
          const c = document.createElement("canvas");
          c.width = c.height = 1;
          const ctx = c.getContext("2d");
          ctx.fillStyle = getComputedStyle(document.querySelector(".nav-close")).backgroundColor;
          ctx.fillRect(0, 0, 1, 1);
          return [...ctx.getImageData(0, 0, 1, 1).data];
        })(),
        triggerRgb: (() => {
          const c = document.createElement("canvas");
          c.width = c.height = 1;
          const ctx = c.getContext("2d");
          ctx.fillStyle = getComputedStyle(document.querySelector(".menu-trigger")).backgroundColor;
          ctx.fillRect(0, 0, 1, 1);
          return [...ctx.getImageData(0, 0, 1, 1).data];
        })(),
        innerScrollW: document.querySelector(".nav-panel__inner").scrollWidth,
        innerW: document.querySelector(".nav-panel__inner").clientWidth,
        innerOverflowX: getComputedStyle(document.querySelector(".nav-panel__inner")).overflowX,
      };
    });
    check("scroll stays locked while the panel leaves", closing.overflow === "hidden", closing.overflow);
    check("trigger does not move while closing", Math.abs(closing.x - before.x) <= 3, `${before.x} -> ${closing.x}`);
    check("page does not scroll while closing", closing.scrollY === before.scrollY, `${before.scrollY} -> ${closing.scrollY}`);
    check("no horizontal overflow while closing", closing.scrollW === closing.clientW, `${closing.scrollW}/${closing.clientW}`);
    check(
      "close button becomes the trigger",
      closing.closeRgb.every((channel, index) => Math.abs(channel - closing.triggerRgb[index]) <= 2),
      `${closing.closeRgb.join(",")} vs ${closing.triggerRgb.join(",")}`,
    );
    check(
      "panel content never shows a horizontal scrollbar",
      closing.innerOverflowX === "hidden",
      closing.innerOverflowX,
    );

    await screenshot(page, "close-300vh.png");
    await waitForClosed(page);
    const after = await page.evaluate(() => ({
      overflow: getComputedStyle(document.documentElement).overflow,
      x: Math.round(document.querySelector(".menu-trigger").getBoundingClientRect().x),
      scrollY: window.scrollY,
    }));
    check("scroll unlocks after the panel is gone", after.overflow !== "hidden", after.overflow);
    check("trigger still has not moved", Math.abs(after.x - before.x) <= 3, `${before.x} -> ${after.x}`);
    check("page keeps its scroll position", after.scrollY === before.scrollY, `${before.scrollY} -> ${after.scrollY}`);

    report.before = before;
    report.open = open;
    report.closing = closing;
    report.after = after;
  }

  if (CASE === "closewait") {
    // The dialog must stay until the exit finishes, and an interrupted exit
    // must not leave a stuck modal or an unlocked page.
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    await openMenu(page);

    const started = Date.now();
    await page.locator(".nav-close").click();
    await waitForClosed(page);
    const elapsed = Date.now() - started;
    check(
      "normal close lasts the transition",
      elapsed >= 700 && elapsed <= 1200,
      `${elapsed}ms`,
    );

    await openMenu(page);
    await page.locator(".nav-close").click();
    await page.waitForTimeout(150);
    await page.evaluate(() => document.querySelector(".menu-trigger").click());
    await page.waitForTimeout(1200);
    const reopened = await page.evaluate(() => ({
      open: document.querySelector("#site-menu").open,
      state: document.querySelector("#site-menu").dataset.state,
      overflow: getComputedStyle(document.documentElement).overflow,
    }));
    check("reopening during the exit keeps the menu open", reopened.open === true && reopened.state === "open", JSON.stringify(reopened));
    check("reopening keeps the scroll locked", reopened.overflow === "hidden", reopened.overflow);

    await page.keyboard.press("Escape");
    await waitForClosed(page);
    const final = await page.evaluate(() => ({
      open: document.querySelector("#site-menu").open,
      overflow: getComputedStyle(document.documentElement).overflow,
    }));
    check("it still closes after the interruption", final.open === false, JSON.stringify(final));
    check("scroll unlocks after the interruption", final.overflow !== "hidden", final.overflow);

    await screenshot(page, "closewait.png");
    report.elapsedMs = elapsed;
  }

  if (CASE === "locale") {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${BASE}/ar/work`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    await openMenu(page);

    const href = await page.locator(".nav-locale").getAttribute("href");
    check("locale switch keeps the path", href === "/en/work", String(href));

    await page.locator(".nav-locale").click();
    await page.waitForURL("**/en/work", { timeout: 5000 });
    await page.waitForTimeout(1200);

    const landed = await page.evaluate(() => ({
      path: location.pathname,
      heading: document.querySelector("h1")?.textContent?.trim(),
      menuOpen: document.querySelector("#site-menu").open,
    }));
    check("lands on the other locale", landed.path === "/en/work", landed.path);
    check("same destination", landed.heading === "Work", String(landed.heading));
    check("menu closes on navigation", landed.menuOpen === false);

    await screenshot(page, "locale-switch.png");
  }

  if (CASE === "ar-open") {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${BASE}/ar`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    await openMenu(page);

    const state = await page.evaluate(() => {
      const dialog = document.querySelector("#site-menu");
      const panel = document.querySelector(".nav-panel").getBoundingClientRect();
      return {
        dir: document.documentElement.dir,
        open: dialog.open,
        panelX: Math.round(panel.x),
        panelW: Math.round(panel.width),
        hScroll:
          document.documentElement.scrollWidth >
          document.documentElement.clientWidth,
        labels: [...document.querySelectorAll(".nav-item a")].map((a) =>
          a.textContent.trim(),
        ),
        locale: document.querySelector(".nav-locale").getAttribute("href"),
      };
    });

    check("document is rtl", state.dir === "rtl", state.dir);
    check("dialog is open", state.open === true);
    check("panel enters from the left", state.panelX === 0, String(state.panelX));
    check("no horizontal overflow", state.hScroll === false);
    check(
      "arabic labels",
      state.labels.join(",") === "الرئيسية,الأعمال,نبذة,تواصل",
      state.labels.join(","),
    );
    check("locale switch keeps the path", state.locale === "/en", state.locale);

    await screenshot(page, "ar-open.png");
  }

  if (CASE === "mobile") {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true });
    await page.goto(`${BASE}/ar`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);

    const top = await page.evaluate(() => ({
      trigger: getComputedStyle(document.querySelector(".menu-trigger")).visibility,
      nav: getComputedStyle(document.querySelector(".site-header__nav")).display,
      scrollY: window.scrollY,
    }));
    check("trigger visible without scrolling", top.trigger === "visible", top.trigger);
    check("inline links hidden", top.nav === "none", top.nav);

    await page.locator(".menu-trigger").click();
    await page.waitForFunction(() => document.querySelector("#site-menu")?.open === true);
    await page.waitForTimeout(950);
    await page.mouse.move(4, 4);
    await page.waitForTimeout(200);

    const panel = await page.evaluate(() => {
      const rect = document.querySelector(".nav-panel").getBoundingClientRect();
      return {
        x: Math.round(rect.x),
        width: Math.round(rect.width),
        vw: window.innerWidth,
      };
    });
    check("panel covers the screen", panel.width >= panel.vw - 1, `${panel.width} of ${panel.vw}`);

    await screenshot(page, "ar-mobile-open.png");
  }

  if (CASE === "reduced") {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(400);
    await makeScrollable(page);
    await page.evaluate(() => window.scrollTo(0, 420));
    await page.waitForTimeout(300);

    await page.locator(".menu-trigger").click();
    await page.waitForFunction(() => document.querySelector("#site-menu")?.open === true);
    await page.waitForTimeout(200);
    const panelX = await page
      .locator(".nav-panel")
      .evaluate((el) => Math.round(el.getBoundingClientRect().x));
    check("panel settles immediately", Math.abs(panelX - 900) <= 2, String(panelX));

    const started = Date.now();
    await page.keyboard.press("Escape");
    await waitForClosed(page);
    const elapsed = Date.now() - started;
    check("closing is instant", elapsed < 500, `${elapsed}ms`);

    report.elapsedMs = elapsed;
    await screenshot(page, "reduced.png");
    await context.close();
  }

  if (CASE === "stub") {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const routes = [
      "/en",
      "/en/work",
      "/en/about",
      "/en/contact",
      "/ar",
      "/ar/work",
      "/ar/about",
      "/ar/contact",
    ];
    const results = [];

    for (const route of routes) {
      const response = await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
      const header = await page.locator(".site-header__brand").count();
      const heading = await page.locator("h1").first().textContent();
      results.push({ route, status: response?.status(), header, heading: heading?.trim() });
      check(`${route} status`, response?.status() === 200, String(response?.status()));
      check(`${route} has the header`, header === 1);
      check(`${route} has a heading`, Boolean(heading?.trim()));
    }

    report.routes = results;
    await page.goto(`${BASE}/ar/work`, { waitUntil: "domcontentloaded" });
    await screenshot(page, "ar-work.png");
    await writeFile(
      path.join(OUT, "stub.json"),
      JSON.stringify(results, null, 2),
    );
  }

  if (CASE === "pause") {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.goto(`${BASE}/en`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);

    const ready = await page.locator("[data-ready]").getAttribute("data-ready");
    check("scene is live", ready === "true", String(ready));

    await openMenu(page);
    const openA = await page.locator("canvas").screenshot();
    await page.waitForTimeout(600);
    const openB = await page.locator("canvas").screenshot();
    check("scene is paused while the menu is open", openA.equals(openB));

    // A tab switch back must not restart the loop behind the modal.
    await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
    await page.waitForTimeout(600);
    const openC = await page.locator("canvas").screenshot();
    check("visibilitychange does not resume behind the menu", openB.equals(openC));

    await page.keyboard.press("Escape");
    await waitForClosed(page);
    await page.waitForTimeout(600);
    const closedA = await page.locator("canvas").screenshot();
    await page.waitForTimeout(600);
    const closedB = await page.locator("canvas").screenshot();
    check("scene resumes after closing", closedA.equals(closedB) === false);

    report.pausedWhileOpen = openA.equals(openB);
    report.resumedAfterClose = closedA.equals(closedB) === false;
  }

  await writeFile(
    path.join(OUT, `nav-${CASE}.json`),
    JSON.stringify(report, null, 2),
  );
  console.log(`${CASE}: PASS (${report.checks.length} checks)`);
} catch (error) {
  report.error = String(error?.message ?? error);
  await writeFile(
    path.join(OUT, `nav-${CASE}.json`),
    JSON.stringify(report, null, 2),
  );
  console.error(`${CASE}: FAIL — ${report.error}`);
  process.exitCode = 1;
} finally {
  await browser.close();
}

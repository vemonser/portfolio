/**
 * Behavioural QA for the hero canvas.
 *
 * The scene is GPU state — no unit test can see it — so each acceptance
 * criterion is checked against a real browser and leaves a screenshot behind.
 * Screenshots are analysed numerically (brightness, white-pixel band, frame
 * difference) because the check has to run unattended.
 *
 *   pnpm dev                                  # in one terminal
 *   node scripts/hero-qa.mjs --case ripple --out artifacts
 *
 * Cases: idle, ripple, wordmark, frozen, reduced, mobile, nowebgl, hover-text, seo.
 * Each exits non-zero on failure so it can gate a release.
 */import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { chromium } from "@playwright/test";
import sharp from "sharp";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

const args = process.argv.slice(2);
const readArg = (name, fallback) => {
  const index = args.indexOf(`--${name}`);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};

const CASE = readArg("case");
const OUT = path.resolve(readArg("out", "artifacts"));

if (!CASE) {
  console.error("usage: node scripts/hero-qa.mjs --case <idle|ripple|wordmark|frozen|reduced|mobile|nowebgl|seo> --out <dir>");
  process.exit(2);
}

await mkdir(OUT, { recursive: true });

/** Mean brightness and the light-pixel distribution (the bone wordmark over dark metal). */
async function analyse(file) {
  const { data, info } = await sharp(file).raw().toBuffer({ resolveWithObject: true });
  const pixels = data.length / info.channels;
  let sum = 0;
  let light = 0;
  let minX = info.width;
  let maxX = 0;
  let peakRow = 0;
  let peakRowCount = 0;
  for (let y = 0; y < info.height; y++) {
    let rowLight = 0;
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels;
      const [r, g, b] = [data[i], data[i + 1], data[i + 2]];
      sum += r + g + b;
      // Bone (#f5f1e8) over the dark metal. Pure-white speculars are a few
      // pixels; the wordmark is a wide band.
      if (r > 225 && g > 220 && b > 205) {
        light += 1;
        rowLight += 1;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }
    }
    if (rowLight > peakRowCount) {
      peakRowCount = rowLight;
      peakRow = y;
    }
  }
  return {
    mean: sum / (pixels * 3),
    lightPct: (light / pixels) * 100,
    lightWidthPct: light ? ((maxX - minX) / info.width) * 100 : 0,
    peakRowPct: info.height ? (peakRow / info.height) * 100 : 0,
    peakRowWidthPct: (peakRowCount / info.width) * 100,
  };
}

/** Mean absolute channel difference between two screenshots. */
async function difference(a, b) {
  const left = await sharp(a).resize(720, null, { fit: "inside" }).raw().toBuffer();
  const right = await sharp(b).resize(720, null, { fit: "inside" }).raw().toBuffer();
  const length = Math.min(left.length, right.length);
  let sum = 0;
  for (let i = 0; i < length; i++) sum += Math.abs(left[i] - right[i]);
  return sum / length;
}

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

async function waitReady(page) {
  await page.waitForSelector('[data-ready="true"]', { timeout: 25_000 });
}

async function drag(page, { synthesize = false } = {}) {
  if (synthesize) {
    await page.evaluate(() => {
      const section = document.querySelector("#hero");
      const rect = section.getBoundingClientRect();
      for (let i = 0; i <= 20; i++) {
        section.dispatchEvent(
          new PointerEvent("pointermove", {
            clientX: rect.left + (rect.width * i) / 20,
            clientY: rect.top + rect.height / 2 + Math.sin(i / 2) * 80,
            bubbles: true,
            pointerType: "touch",
          }),
        );
      }
    });
    return;
  }
  await page.mouse.move(240, 420);
  for (let i = 0; i <= 24; i++) {
    await page.mouse.move(240 + i * 44, 420 + Math.sin(i / 3) * 140, { steps: 2 });
  }
}

const browser = await chromium.launch();

try {
  switch (CASE) {
    case "idle": {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(`${BASE}/en`, { waitUntil: "networkidle" });
      await waitReady(page);
      await page.waitForTimeout(1400);
      const a = path.join(OUT, "idle-a.png");
      const b = path.join(OUT, "idle-b.png");
      await page.screenshot({ path: a });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: b });
      const { mean } = await analyse(a);
      check(mean > 5 && mean < 200, `idle frame is not a plausible scene (mean ${mean.toFixed(1)})`);
      check((await difference(a, b)) > 0.5, "idle scene is not animating");
      await page.close();
      break;
    }

    case "ripple": {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(`${BASE}/en`, { waitUntil: "networkidle" });
      await waitReady(page);
      await page.waitForTimeout(1200);
      const before = path.join(OUT, "ripple-before.png");
      const after = path.join(OUT, "ripple-after.png");
      await page.screenshot({ path: before });
      await drag(page);
      await page.waitForTimeout(350);
      await page.screenshot({ path: after });
      check((await difference(before, after)) > 8, "drag did not disturb the surface");
      await page.close();
      break;
    }

    case "wordmark": {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(`${BASE}/en?t=3`, { waitUntil: "networkidle" });
      await waitReady(page);
      await page.waitForTimeout(500);
      const file = path.join(OUT, "wordmark.png");
      await page.screenshot({ path: file });
      const { lightPct, lightWidthPct, peakRowPct } = await analyse(file);
      check(lightPct > 1, `no wordmark band in the frame (light ${lightPct.toFixed(2)}%)`);
      check(lightWidthPct > 80, `wordmark band is too narrow (${lightWidthPct.toFixed(1)}% of width)`);
      check(peakRowPct > 50, `wordmark band is not at the bottom (peak row ${peakRowPct.toFixed(0)}%)`);
      await page.close();
      break;
    }

    case "frozen": {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(`${BASE}/en?t=3`, { waitUntil: "networkidle" });
      await waitReady(page);
      const a = path.join(OUT, "frozen-a.png");
      const b = path.join(OUT, "frozen-b.png");
      await page.waitForTimeout(400);
      await page.screenshot({ path: a });
      await page.waitForTimeout(1200);
      await page.screenshot({ path: b });
      check((await difference(a, b)) < 0.5, "?t= frame is not frozen");
      await page.close();
      break;
    }

    case "reduced": {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      await page.goto(`${BASE}/en`, { waitUntil: "networkidle" });
      await waitReady(page);
      const a = path.join(OUT, "reduced-a.png");
      const b = path.join(OUT, "reduced-b.png");
      await page.waitForTimeout(500);
      await page.screenshot({ path: a });
      await page.waitForTimeout(1400);
      await page.screenshot({ path: b });
      const { mean } = await analyse(a);
      check(mean > 5, "reduced-motion frame is blank");
      check((await difference(a, b)) < 0.5, "reduced-motion frame is animating");
      check(
        (await page.evaluate(() => getComputedStyle(document.querySelector("canvas")).opacity)) === "1",
        "canvas never became visible under reduced motion",
      );
      await context.close();
      break;
    }

    case "mobile": {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 2,
        isMobile: true,
        hasTouch: true,
      });
      const page = await context.newPage();
      await page.goto(`${BASE}/ar`, { waitUntil: "networkidle" });
      await waitReady(page);
      await page.waitForTimeout(1200);
      check(
        await page.evaluate(() => Boolean(document.querySelector("canvas")?.getContext("webgl2"))),
        "mobile context has no WebGL 2",
      );
      const before = path.join(OUT, "mobile-before.png");
      const after = path.join(OUT, "mobile-after.png");
      await page.screenshot({ path: before });
      await page.touchscreen.tap(195, 420);
      await drag(page, { synthesize: true });
      await page.waitForTimeout(350);
      await page.screenshot({ path: after });
      check((await difference(before, after)) > 5, "touch did not disturb the surface");
      const { lightPct } = await analyse(before);
      check(lightPct > 0.5, "Arabic wordmark was not rendered over the canvas");
      await context.close();
      break;
    }

    case "nowebgl": {
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await context.addInitScript(() => {
        const original = HTMLCanvasElement.prototype.getContext;
        HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
          if (type === "webgl2") return null;
          return original.call(this, type, ...rest);
        };
      });
      const page = await context.newPage();
      await page.goto(`${BASE}/en`, { waitUntil: "networkidle" });
      await page.waitForTimeout(2500);
      const file = path.join(OUT, "nowebgl.png");
      await page.screenshot({ path: file });
      const state = await page.evaluate(() => {
        const stage = document.querySelector("[data-ready]");
        const img = document.querySelector('[data-ready] img');
        return {
          ready: stage?.getAttribute("data-ready"),
          posterLoaded: Boolean(img?.complete && img?.naturalWidth),
          posterOpacity: img ? getComputedStyle(img.parentElement).opacity : null,
        };
      });
      check(state.ready !== "true", "scene claimed readiness without WebGL 2");
      check(state.posterLoaded, "poster did not load as the fallback");
      check(state.posterOpacity === "1", "poster is not the visible layer");
      await context.close();
      break;
    }

    case "hover-text": {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(`${BASE}/en`, { waitUntil: "networkidle" });
      await waitReady(page);
      await page.waitForTimeout(1200);

      const word = await page.evaluate(() => {
        const element = document.querySelector("#hero-title");
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return {
          x: rect.x,
          y: rect.y,
          w: rect.width,
          h: rect.height,
          filter: style.filter,
          transform: style.transform,
        };
      });
      // The reference keeps the text untouched: no effect is applied to it.
      check(word.filter === "none", "a filter is applied to the wordmark");
      check(word.transform === "none", "a transform is applied to the wordmark");

      // Hover belongs to the surface: moving across the word must reach the
      // canvas and disturb the liquid shape.
      await page.mouse.move(20, 20);
      await page.evaluate(() => {
        window.__sectionMoves = 0;
        document.querySelector("#hero").addEventListener("pointermove", () => {
          window.__sectionMoves += 1;
        });
      });
      const before = path.join(OUT, "hover-before.png");
      await page.screenshot({ path: before });

      const y = word.y + word.h * 0.6;
      await page.mouse.move(word.x + word.w * 0.2, y);
      for (let i = 0; i <= 16; i++) {
        await page.mouse.move(
          word.x + word.w * (0.2 + i * 0.04),
          y + Math.sin(i / 2) * 12,
          { steps: 2 },
        );
      }
      await page.waitForTimeout(350);

      const after = path.join(OUT, "hover-after.png");
      await page.screenshot({ path: after });

      const moves = await page.evaluate(() => window.__sectionMoves);
      check(moves > 0, "pointer moves over the wordmark did not reach the canvas");
      check(
        (await difference(before, after)) > 6,
        "the liquid shape was not disturbed while dragging over the word",
      );

      await page.close();
      break;
    }

    case "seo": {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(`${BASE}/en`, { waitUntil: "networkidle" });
      const state = await page.evaluate(() => {
        const h1 = document.querySelector("#hero-title");
        const rect = h1?.getBoundingClientRect();
        const style = h1 ? getComputedStyle(h1) : null;
        return {
          exists: Boolean(h1),
          text: h1?.textContent?.trim() ?? "",
          visible: Boolean(rect && rect.width > 100 && getComputedStyle(h1).visibility === "visible"),
          untouched: style?.filter === "none" && style?.transform === "none",
        };
      });
      check(state.exists, "hero h1 is missing");
      check(state.text.length > 0, "hero h1 has no text");
      check(state.visible, "hero h1 is not visible");
      check(state.untouched, "an effect is applied to the hero h1");
      await writeFile(path.join(OUT, "seo.json"), JSON.stringify(state, null, 2));
      await page.close();
      break;
    }

    default:
      console.error(`unknown case "${CASE}"`);
      process.exit(2);
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(JSON.stringify({ case: CASE, status: "FAIL", failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ case: CASE, status: "PASS" }));

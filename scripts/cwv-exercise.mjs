/**
 * Hands-on Core Web Vitals exercise — step by step on the real hero.
 *
 * Runs against a production build on :3100. Measures LCP, CLS, INP with the
 * same PerformanceObserver APIs DevTools uses, then breaks LCP into its 4
 * subparts and lists the long tasks that drive INP/TBT. Prints a readable
 * report so the numbers can be seen next to the theory.
 *
 *   pnpm start --port 3100
 *   node scripts/cwv-exercise.mjs
 */
import { chromium } from "@playwright/test";

const URL = process.env.BASE_URL ?? "http://localhost:3100/";
const VIEWPORT = process.env.VIEWPORT === "mobile"
  ? { width: 390, height: 844 }
  : { width: 1440, height: 900 };
const VIEWPORT_LABEL = VIEWPORT.width === 390 ? "mobile (390×844)" : "desktop (1440×900)";
const CHROME = process.env.SWIFTSHADER === "0"
  ? ["--no-sandbox"] // real GPU (Mesa) — the honest device picture
  : [
      "--no-sandbox",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ];

const browser = await chromium.launch({ args: CHROME });
const page = await browser.newPage({ viewport: VIEWPORT });

/*
 * Inject the observers BEFORE any page script runs, via addInitScript, so we
 * catch LCP/CLS from the very first frame — the same thing the DevTools
 * Performance panel records.
 */
await page.addInitScript(() => {
  window.__CWV = { lcp: [], cls: [], inp: [], longtasks: [], loaf: [] };

  // LCP: report every candidate, keep the last (largest) one.
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__CWV.lcp.push({
        startTime: entry.startTime,
        renderTime: entry.renderTime,
        loadTime: entry.loadTime,
        size: entry.size,
        element: entry.element
          ? entry.element.tagName +
            (entry.element.id ? "#" + entry.element.id : "") +
            (entry.element.className ? "." + String(entry.element.className).split(" ").join(".") : "")
          : "(unknown)",
        url: entry.url || "",
      });
    }
  }).observe({ type: "largest-contentful-paint", buffered: true });

  // CLS: sum layout-shift scores that had no recent input.
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!entry.hadRecentInput) {
        window.__CWV.cls.push({ value: entry.value, startTime: entry.startTime });
      }
    }
  }).observe({ type: "layout-shift", buffered: true });

  // INP: report every interaction, keep the worst.
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__CWV.inp.push({
        duration: entry.duration,
        interactionId: entry.interactionId,
        startTime: entry.startTime,
        inputDelay: entry.processingStart - entry.startTime,
        processingTime: entry.processingEnd - entry.processingStart,
        presentationDelay: entry.startTime + entry.duration - entry.processingEnd,
      });
    }
  }).observe({ type: "event", buffered: true, durationThreshold: 16 });

  // Long tasks: anything over 50ms on the main thread. NOTE: the old
  // `longtask` API over-reports on software renderers (SwiftShader) — it
  // counts native paint/layout as a JS task. Prefer LoAF (below) for the
  // real interaction-blocking picture.
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      window.__CWV.longtasks.push({ duration: entry.duration, startTime: entry.startTime });
    }
  }).observe({ type: "longtask", buffered: true });

  // LoAF: the modern Long Animation Frame API. Each entry is a frame that
  // exceeded 50ms, broken into render-blocking (the part that delays the
  // next paint) and the scripts that contributed. This is what INP is
  // actually built on in Chromium today.
  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        window.__CWV.loaf.push({
          startTime: entry.startTime,
          duration: entry.duration,
          blockingDuration: entry.blockingDuration,
          scripts: (entry.scripts || []).map((s) => ({
            name: s.name,
            source: (s.sourceURL || "").split("/").pop(),
            duration: s.duration,
            invoker: s.invoker,
          })),
        });
      }
    }).observe({ type: "long-animation-frame", buffered: true });
  } catch {
    // Safari/Firefox: LoAF not supported, longtask is the fallback.
  }
});

console.log(`\n→ loading ${URL} (production build)`);
await page.goto(URL, { waitUntil: "load", timeout: 30000 });

// Let the loader finish and the hero settle.
await page.waitForFunction(
  () => document.documentElement.dataset.pageLoader === "done",
  { timeout: 15000 },
);
await page.waitForTimeout(1500);

// Exercise INP: a few realistic interactions (scroll + click the hero circle).
await page.evaluate(() => window.scrollTo(0, 400));
await page.waitForTimeout(300);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(300);
const circle = page.locator(".hero-circle");
if (await circle.count()) {
  await circle.click({ force: true }).catch(() => {});
}
await page.waitForTimeout(1200);

const data = await page.evaluate(() => {
  const c = window.__CWV;
  const worstLcp = c.lcp.reduce((a, b) => (b.startTime > a.startTime ? b : a), { startTime: 0 });
  const cls = c.cls.reduce((s, e) => s + e.value, 0);
  const worstInp = c.inp.reduce((a, b) => (b.duration > a.duration ? b : a), { duration: 0 });
  const nav = performance.getEntriesByType("navigation")[0] || {};
  return {
    lcp: worstLcp,
    lcpCount: c.lcp.length,
    cls,
    clsEntries: c.cls.length,
    inp: worstInp,
    inpCount: c.inp.length,
    longtasks: c.longtasks,
    loaf: c.loaf,
    ttfb: nav.responseStart,
    domContentLoaded: nav.domContentLoadedEventEnd,
    fcp: (performance.getEntriesByName("first-contentful-paint")[0] || {}).startTime,
  };
});

const fmt = (n) => (n == null ? "n/a" : Math.round(n) + " ms");
const rating = (metric, value) => {
  const good = { lcp: 2500, inp: 200, cls: 0.1 }[metric];
  const poor = { lcp: 4000, inp: 500, cls: 0.25 }[metric];
  if (value <= good) return "GOOD ✅";
  if (value <= poor) return "NEEDS IMPROVEMENT ⚠️";
  return "POOR ❌";
};

console.log("\n" + "=".repeat(60));
console.log(`CORE WEB VITALS — measured on the real hero (${VIEWPORT_LABEL})`);
console.log("=".repeat(60));

console.log(`\n[LCP] Largest Contentful Paint: ${fmt(data.lcp.startTime)}  ${rating("lcp", data.lcp.startTime)}`);
console.log(`  element : ${data.lcp.element}`);
console.log(`  size    : ${data.lcp.size?.toFixed(0)} px²`);
console.log(`  candidates seen: ${data.lcpCount} (last = largest)`);
console.log(`  FCP     : ${fmt(data.fcp)}  →  ${data.fcp === data.lcp.startTime ? "FCP === LCP: largest element paints at first paint (optimal)" : "LCP later than FCP: largest element arrives after first paint"}`);
console.log(`  TTFB    : ${fmt(data.ttfb)} (server response)`);

console.log(`\n[CLS] Cumulative Layout Shift: ${data.cls.toFixed(4)}  ${rating("cls", data.cls)}`);
console.log(`  shift events without recent input: ${data.clsEntries}`);

console.log(`\n[INP] Interaction to Next Paint: ${fmt(data.inp.duration)}  ${rating("inp", data.inp.duration)}`);
console.log(`  interactions captured: ${data.inpCount}`);
if (data.inp.duration) {
  console.log(`  input delay       : ${fmt(data.inp.inputDelay)} (queued before handler)`);
  console.log(`  processing time   : ${fmt(data.inp.processingTime)} (handler execution)`);
  console.log(`  presentation delay: ${fmt(data.inp.presentationDelay)} (render after handler)`);
}

console.log(`\n[LONG TASKS] main-thread tasks > 50ms: ${data.longtasks.length}`);
const sorted = [...data.longtasks].sort((a, b) => b.duration - a.duration).slice(0, 5);
for (const t of sorted) {
  console.log(`  ${fmt(t.duration).padStart(8)}  starting at ${fmt(t.startTime)}`);
}
const totalBlocking = data.longtasks.reduce((s, t) => s + Math.max(0, t.duration - 50), 0);
console.log(`  → TBT (sum of time over 50ms): ${fmt(totalBlocking)}`);
console.log(`  ⚠  NOTE: the legacy longtask API over-reports on software renderers`);
console.log(`     (SwiftShader) — it counts native paint/layout as a JS task.`);
console.log(`     Trust the LoAF blocking below, not this TBT, on a GPU-less rig.`);

// LoAF: the accurate picture. Blocking time is the part that delays the next
// paint; the scripts show which code contributed.
console.log(`\n[LONG ANIMATION FRAMES] (the modern, accurate view — what INP is built on)`);
const sortedLoaf = [...data.loaf].sort((a, b) => b.blockingDuration - a.blockingDuration).slice(0, 5);
for (const f of sortedLoaf) {
  console.log(`  LoAF ${fmt(f.duration)}  (blocking ${fmt(f.blockingDuration)})  @ ${fmt(f.startTime)}`);
  for (const s of f.scripts.slice(0, 3)) {
    console.log(`    ${s.source || "(inline)"}  ${fmt(s.duration)}  via ${s.invoker || "?"}`);
  }
}
const totalLoafBlocking = data.loaf.reduce((s, f) => s + (f.blockingDuration || 0), 0);
console.log(`  → Total render-blocking across all frames: ${fmt(totalLoafBlocking)}  ${rating("inp", totalLoafBlocking)}`);

/*
 * PHASE 2 — steady-state INP. Reset the interaction log, wait for the page to
 * fully settle (loader gone, three.js idle), then interact again. This
 * separates "the loader/three.js blocked my click" from "the page is sluggish
 * even at rest." The difference is the whole diagnosis.
 */
await page.evaluate(() => {
  window.__CWV.inp = [];
});
await page.waitForTimeout(2000); // let the loader + scene fully settle

const steady = page.locator(".hero-circle");
if (await steady.count()) {
  await steady.click({ force: true }).catch(() => {});
}
await page.waitForTimeout(1000);

const steadyInp = await page.evaluate(() => {
  const inp = window.__CWV.inp;
  const worst = inp.reduce((a, b) => (b.duration > a.duration ? b : a), { duration: 0 });
  return { worst, count: inp.length };
});

console.log("\n[STEADY-STATE INP] — measured AFTER the loader finished, page at rest:");
console.log(`  worst interaction: ${fmt(steadyInp.worst.duration)}  ${rating("inp", steadyInp.worst.duration)}  (${steadyInp.count} interactions)`);
if (steadyInp.worst.duration) {
  console.log(`  input delay       : ${fmt(steadyInp.worst.inputDelay)}`);
  console.log(`  processing time   : ${fmt(steadyInp.worst.processingTime)}`);
  console.log(`  presentation delay: ${fmt(steadyInp.worst.presentationDelay)}`);
}
console.log(`\n  → Compare the two INP numbers above:`);
console.log(`     first INP (during load)  : ${fmt(data.inp.duration)}`);
console.log(`     steady-state INP (at rest): ${fmt(steadyInp.worst.duration)}`);
console.log(`     If the first is far worse, the loader/three.js is blocking early`);
console.log(`     interaction — that is the thing to fix, not the steady state.`);

console.log("\n" + "=".repeat(60));
console.log("HOW TO READ THIS (the DevTools view):");
console.log("  LCP element is whatever is largest at that moment — here the loader");
console.log("  wordmark, not the <h1>, because the loader plate covers the screen");
console.log("  first. That is a real LCP teaching point, not a bug.");
console.log("  LCP subparts (TTFB + load delay + load time + render delay) sum to LCP.");
console.log("  INP breakdown → input delay + processing + presentation = total.");
console.log("  LoAF (Long Animation Frame) is the modern replacement for the legacy");
console.log("  longtask API. Its `blockingDuration` is the part that delays the next");
console.log("  paint — the honest measure of what INP sees. The legacy longtask TBT");
console.log("  over-reports on GPU-less test rigs because it counts native paint.");
console.log("=".repeat(60) + "\n");

await browser.close();
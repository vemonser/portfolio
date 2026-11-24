import { chromium } from "@playwright/test";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 120)); });
page.on("pageerror", (e) => errors.push("PAGEERROR " + String(e).slice(0, 120)));

await page.goto("http://localhost:3000/work", { waitUntil: "networkidle" });
await page.waitForTimeout(1000);

// Hover the first project card
const card = page.locator("[data-cursor='view']").first();
await card.scrollIntoViewIfNeeded();
await card.hover();
await page.waitForTimeout(400);
const state = await page.evaluate(() => document.documentElement.dataset.cursorState);
const dot = await page.evaluate(() => {
  const disc = document.querySelector(".cursor-dot__disc");
  if (!disc) return { scale: "none", size: null, backdrop: null };
  const cs = getComputedStyle(disc);
  return {
    scale: cs.scale,
    size: disc.getBoundingClientRect().width,
    backdrop: cs.backdropFilter || cs.webkitBackdropFilter,
  };
});

// Check the cover plate is armed and collapses once the card is in view
const overlayCheck = await page.evaluate(() => {
  const o = document.querySelector("[data-overlay]");
  if (!o) return "no-overlay";
  return getComputedStyle(o).transform;
});

console.log("cursor state on card hover:", state);
console.log("dot:", dot);
console.log("overlay transform:", overlayCheck);
console.log("console errors:", errors.length ? errors : "none");
await browser.close();
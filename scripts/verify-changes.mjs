import { chromium } from "@playwright/test";
const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 160)); });
page.on("pageerror", (e) => errors.push("PAGEERROR " + String(e).slice(0, 160)));

// Load home, then visit /work and /blog to exercise the MDX import in RouteCurtain.
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.goto(`${BASE}/work`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);
await page.goto(`${BASE}/blog/two-directions`, { waitUntil: "networkidle" });
await page.waitForTimeout(500);

// Back-to-top: check hidden at top, visible after scroll, and scrolls up.
await page.goto(`${BASE}/about`, { waitUntil: "networkidle" });
await page.waitForTimeout(400);
const atTop = await page.evaluate(() => document.querySelector(".back-to-top")?.getAttribute("data-visible"));
await page.evaluate(() => window.scrollTo(0, 1200));
await page.waitForTimeout(400);
const afterScroll = await page.evaluate(() => ({
  visible: document.querySelector(".back-to-top")?.getAttribute("data-visible"),
  opacity: getComputedStyle(document.querySelector(".back-to-top")).opacity,
}));
await page.click(".back-to-top");
await page.waitForTimeout(1800);
const afterClick = await page.evaluate(() => window.scrollY);

console.log("back-to-top at top:", atTop);
console.log("back-to-top after scroll:", JSON.stringify(afterScroll));
console.log("scrollY after clicking back-to-top:", afterClick);
console.log("console errors:", errors.length ? [...new Set(errors)] : "none");

await browser.close();
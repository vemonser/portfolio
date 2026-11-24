import { chromium } from "@playwright/test";
const BASE = "http://localhost:3000";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

async function captureNav(clickSelector, label) {
  await page.goto(`${BASE}/work`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  // Inject an observer that records curtain activations + label text.
  await page.evaluate(() => {
    window.__curtainLog = [];
    const root = document.querySelector(".route-curtain");
    const labelEl = document.querySelector(".route-curtain__label");
    const record = () => {
      const active = root?.getAttribute("data-active");
      const text = labelEl?.textContent ?? "";
      if (active === "true" || text) {
        window.__curtainLog.push(`active=${active} label="${text}"`);
      }
    };
    new MutationObserver(record).observe(root, { attributes: true, attributeFilter: ["data-active"] });
    new MutationObserver(record).observe(labelEl, { childList: true, characterData: true, subtree: true });
  });
  await page.click(clickSelector);
  await page.waitForTimeout(2600);
  const log = await page.evaluate(() => window.__curtainLog);
  const uniq = [...new Set(log)];
  console.log(`\n=== ${label} ===`);
  console.log(uniq.join("\n") || "(curtain never activated)");
  console.log("final path:", await page.evaluate(() => location.pathname));
}

await captureNav(".site-header__nav a[href='/about']", "About nav link");
await captureNav(".site-header__brand", "Brand (home)");
await captureNav("a[href='/blog/two-directions']", "Specific blog post (from /work? no link there)");
await browser.close();
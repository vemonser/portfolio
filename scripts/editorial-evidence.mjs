import { chromium } from "@playwright/test";

/**
 * Deterministic evidence capture for the editorial review.
 *
 * Run against `pnpm dev` on :3000. Full-page shots only after the reveal
 * observers have run; the JS flag is switched off before capture so a
 * mid-transition frame never lands in the evidence.
 */
const ROOT = "http://localhost:3000";
const OUT = "audit-shots/editorial";

const ROUTES = [
  ["home", ""],
  ["work", "/work"],
  ["project-nimbus", "/work/nimbus"],
  ["blog", "/blog"],
  ["post", "/blog/two-directions"],
  ["about", "/about"],
  ["contact", "/contact"],
];

async function settle(page) {
  await page.waitForTimeout(1100);
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 700) {
    await page.evaluate((value) => window.scrollTo(0, value), y);
    await page.waitForTimeout(60);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);
  await page.evaluate(() => {
    document.documentElement.dataset.js = "false";
  });
  await page.waitForTimeout(150);
}

const browser = await chromium.launch();

for (const locale of ["en", "ar"]) {
  for (const width of [390, 768, 1440, 1920]) {
    const page = await browser.newPage({
      viewport: { width, height: width < 800 ? 844 : 1000 },
    });

    for (const [name, path] of ROUTES) {
      // The four-width matrix is the required set; keep the extra routes to
      // the two review widths to keep the bundle proportionate.
      if (width === 768 || width === 1920) {
        if (name !== "home" && name !== "work") continue;
      }

      await page.goto(`${ROOT}/${locale}${path}`);
      await settle(page);
      await page.screenshot({
        path: `${OUT}/${locale}-${width}-${name}.png`,
        fullPage: true,
      });
    }

    await page.close();
  }

  // Hero title hover, live (the frozen `?t=` path cannot show the fold).
  const hover = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await hover.goto(`${ROOT}/${locale}`);
  await hover.waitForFunction(
    () =>
      document
        .querySelector("[data-scene-state]")
        ?.getAttribute("data-scene-state") === "running",
  );
  await hover.waitForTimeout(900);
  await hover.locator("[data-hero-wordmark]").hover({ position: { x: 700, y: 40 } });
  await hover.waitForTimeout(800);
  await hover.screenshot({ path: `${OUT}/hero-hover-${locale}.png` });
  await hover.close();

  // Reduced motion: the hero keeps a frozen frame and no pointer compression.
  const reduced = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
  });
  await reduced.goto(`${ROOT}/${locale}`);
  await reduced.waitForTimeout(1400);
  await reduced.screenshot({ path: `${OUT}/reduced-motion-${locale}.png` });
  await reduced.close();

  // Contact states.
  const form = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await form.goto(`${ROOT}/${locale}/contact`);
  await form.waitForTimeout(900);
  await form.locator("form[data-contact-form]").evaluate(() => {
    document.documentElement.dataset.js = "false";
  });
  const send = locale === "ar" ? "ابعت الرسالة" : "Send message";
  await form.getByRole("button", { name: send }).click();
  await form.waitForTimeout(300);
  await form.screenshot({ path: `${OUT}/contact-states-${locale}.png` });

  await form.getByLabel(locale === "ar" ? "الاسم" : "Name", { exact: true }).fill("Sam Rivera");
  await form.getByLabel(locale === "ar" ? "الإيميل" : "Email", { exact: true }).fill("sam@example.com");
  await form.getByLabel(locale === "ar" ? "الرسالة" : "Message", { exact: true }).fill("A bilingual site, from the first commit.");
  await form.getByRole("button", { name: send }).click();
  await form.waitForTimeout(400);
  await form.screenshot({ path: `${OUT}/contact-success-${locale}.png` });
  await form.close();
}

await browser.close();
console.log("evidence captured");

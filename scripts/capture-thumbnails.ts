/**
 * Deterministic project thumbnails.
 *
 * Captures each live site at 1440×900 with deviceScaleFactor 2, waits for the
 * intro/WebGL frame to settle, and writes a 16:10 WebP plus a tiny blur data
 * URL. A `<slug>.manual.(webp|png|jpg)` beside the output always wins.
 *
 * Run: pnpm capture:thumbs
 *      pnpm capture:thumbs -- --only anom-creative
 */
import { chromium, type Page } from "@playwright/test";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import { projects } from "../src/content/projects/projects.ts";
import {
  DEFAULT_EXTRA_DELAY,
  thumbnailOverrides,
} from "./thumbnails.config.ts";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "public/projects");
const GENERATED = path.join(
  ROOT,
  "src/content/projects/thumbnails.generated.ts",
);
const MANIFEST = path.join(OUT_DIR, "manifest.json");
const VIEWPORT = { width: 1440, height: 900 };
const MANUAL_EXTENSIONS = ["webp", "png", "jpg", "jpeg"] as const;

const HIDE_CSS = `
  html { scroll-behavior: auto !important; }
  * { cursor: auto !important; }
  [class*="cookie" i], [id*="cookie" i],
  [class*="consent" i], [id*="consent" i],
  #onetrust-banner-sdk, #CybotCookiebotDialog, .cc-window,
  [class*="intercom" i], [id*="intercom" i],
  nextjs-portal, [data-nextjs-toast] {
    display: none !important;
    visibility: hidden !important;
  }
`;

type Thumb = { slug: string; src: string; blurDataURL: string };

const onlyArg = process.argv.find((arg) => arg.startsWith("--only="));
const only = onlyArg?.split("=")[1];
const selected = only
  ? projects.filter((project) => project.slug === only)
  : projects;

async function manualPath(slug: string): Promise<string | null> {
  for (const extension of MANUAL_EXTENSIONS) {
    const candidate = path.join(OUT_DIR, `${slug}.manual.${extension}`);
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // next extension
    }
  }
  return null;
}

async function settle(page: Page, selector?: string, delay = 0) {
  if (selector) {
    await page.waitForSelector(selector, { timeout: 30_000 }).catch(() => {});
  }

  await page.evaluate(async () => {
    await document.fonts.ready;

    // Some marketing sites keep an image request open forever. The capture is
    // still valid without it, so wait at most 10s for the decode batch.
    await Promise.race([
      Promise.all(
        [...document.images].map((image) => {
          if (image.complete && image.naturalWidth > 0) {
            return image.decode().catch(() => {});
          }
          return new Promise<void>((resolve) => {
            image.addEventListener("load", () => resolve(), { once: true });
            image.addEventListener("error", () => resolve(), { once: true });
          });
        }),
      ),
      new Promise((resolve) => setTimeout(resolve, 10_000)),
    ]);
  });

  if (delay > 0) await page.waitForTimeout(delay);
}

type Crop = { left: number; top: number; width: number; height: number };

async function toThumb(buffer: Buffer, crop?: Crop) {
  let image = sharp(buffer);

  if (crop) {
    const meta = await image.metadata();
    const width = meta.width ?? VIEWPORT.width * 2;
    const height = meta.height ?? VIEWPORT.height * 2;
    image = image.extract({
      left: Math.round(crop.left * width),
      top: Math.round(crop.top * height),
      width: Math.round(crop.width * width),
      height: Math.round(crop.height * height),
    });
  }

  const webp = await image
    .resize(VIEWPORT.width, VIEWPORT.height, {
      fit: "cover",
      position: "top",
    })
    .webp({ quality: 85 })
    .toBuffer();

  const blur = await sharp(webp)
    .resize(24, 15, { fit: "cover" })
    .blur(1.1)
    .webp({ quality: 20 })
    .toBuffer();

  return {
    webp,
    blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
  };
}

async function capture(project: (typeof projects)[number]): Promise<Thumb> {
  if (!project.url) throw new Error(`${project.slug}: no live URL`);

  const override = thumbnailOverrides[project.slug] ?? {};
  const manual = await manualPath(project.slug);

  if (manual) {
    console.log(`· ${project.slug}: manual override ${path.basename(manual)}`);
    const { webp, blurDataURL } = await toThumb(await fs.readFile(manual));
    await fs.writeFile(path.join(OUT_DIR, `${project.slug}.webp`), webp);
    return { slug: project.slug, src: `/projects/${project.slug}.webp`, blurDataURL };
  }

  console.log(`· ${project.slug}: ${project.url}`);
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    locale: "en-US",
    timezoneId: "Africa/Cairo",
  });
  const page = await context.newPage();

  try {
    await page.goto(project.url, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page
      .waitForLoadState("networkidle", { timeout: 20_000 })
      .catch(() => {});

    await page.addStyleTag({ content: HIDE_CSS });
    if (override.css) await page.addStyleTag({ content: override.css });

    if (override.click) {
      await page
        .locator(override.click)
        .first()
        .click({ timeout: 5_000 })
        .catch(() => {});
    }

    if (override.scrollY) {
      await page.evaluate((y) => window.scrollTo(0, y), override.scrollY);
    } else {
      await page.evaluate(() => window.scrollTo(0, 0));
    }

    await settle(
      page,
      override.waitForSelector,
      override.extraDelay ?? DEFAULT_EXTRA_DELAY,
    );

    const buffer = await page.screenshot({ type: "png", timeout: 30_000 });
    const { webp, blurDataURL } = await toThumb(buffer, override.crop);
    await fs.writeFile(path.join(OUT_DIR, `${project.slug}.webp`), webp);
    return { slug: project.slug, src: `/projects/${project.slug}.webp`, blurDataURL };
  } finally {
    await context.close();
    await browser.close();
  }
}

async function contactSheet(thumbs: Thumb[]) {
  const cell = { width: 720, height: 450 };
  const gap = 16;
  const width = thumbs.length * cell.width + (thumbs.length - 1) * gap;

  const composites = await Promise.all(
    thumbs.map(async (thumb, index) => ({
      input: await sharp(path.join(OUT_DIR, `${thumb.slug}.webp`))
        .resize(cell.width, cell.height, { fit: "cover" })
        .toBuffer(),
      left: index * (cell.width + gap),
      top: 0,
    })),
  );

  await sharp({
    create: {
      width,
      height: cell.height,
      channels: 3,
      background: { r: 11, g: 11, b: 10 },
    },
  })
    .composite(composites)
    .webp({ quality: 85 })
    .toFile(path.join(OUT_DIR, "contact-sheet.webp"));
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true });

  // Merge into the existing manifest: `--only` must never erase the other
  // projects' generated entries.
  const manifest: Record<string, { src: string; blurDataURL: string }> =
    JSON.parse(await fs.readFile(MANIFEST, "utf8").catch(() => "{}"));

  const captured: Thumb[] = [];
  for (const project of selected) {
    try {
      const thumb = await capture(project);
      captured.push(thumb);
      manifest[thumb.slug] = {
        src: thumb.src,
        blurDataURL: thumb.blurDataURL,
      };
    } catch (error) {
      console.error(`✗ ${project.slug}:`, (error as Error).message);
    }
  }

  if (captured.length === 0) {
    throw new Error("No thumbnails captured; refusing to rewrite the sheet.");
  }

  await fs.writeFile(MANIFEST, JSON.stringify(manifest, null, 2));

  const generated = `/*
 * Generated by scripts/capture-thumbnails.ts — do not edit by hand.
 * Each entry is a deterministic capture of the live site plus a 24×15 blur.
 */
export const projectThumbnails: Record<
  string,
  { src: string; blurDataURL: string }
> = ${JSON.stringify(manifest, null, 2)};
`;

  await fs.writeFile(GENERATED, generated);

  const all = Object.entries(manifest).map(([slug, value]) => ({
    slug,
    ...value,
  }));
  await contactSheet(all);

  console.log(`\n${captured.length} captured → public/projects/`);
  console.log(`${all.length} total thumbnails in the manifest`);
  console.log("contact sheet → public/projects/contact-sheet.webp");
}

await main();

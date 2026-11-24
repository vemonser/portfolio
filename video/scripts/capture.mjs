#!/usr/bin/env node
/**
 * Capture showcase assets for one project (or all).
 *
 *   node video/scripts/capture.mjs anom-creative
 *   npm run capture -- anom-creative
 *
 * Idempotent: re-running replaces this project's captures and manifest entry.
 */
import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

import {
  DEFAULT_MAX_STOPS,
  PROJECTS,
  displayUrl,
  routeKey,
  routePath,
} from "../src/showcase/projects.ts";
import { normalizeStops } from "../src/showcase/timeline.ts";
import {
  DESKTOP,
  MOBILE,
  dismissCookieBanners,
  freezeVideos,
  neutralizeChrome,
  measureSections,
  openPage,
  primePage,
  recordScroll,
  resolveStops,
  waitForPreloader,
} from "./lib/browser.mjs";
import {
  measureFinalHeight,
  recordSmoothScroll,
} from "./lib/scroll.mjs";
import { captureTallPage, writeDerivative } from "./lib/stitch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VIDEO_ROOT = path.resolve(HERE, "..");
const CAPTURES = path.join(VIDEO_ROOT, "public", "captures");
const MANIFEST_PATH = path.join(VIDEO_ROOT, "src", "showcase", "captures.generated.json");
const RECORDINGS = path.join(VIDEO_ROOT, ".tmp", "recordings");

const DERIVATIVE_WIDTH = { desktop: 1600, mobile: 760 };
const SPECS = [DESKTOP, MOBILE];

const arg = process.argv[2];
if (!arg || arg === "--help" || arg === "help") {
  console.log("Usage: node video/scripts/capture.mjs <project-slug|all>");
  console.log(`Projects: ${PROJECTS.map((p) => p.slug).join(", ")}`);
  process.exit(arg ? 0 : 1);
}

const selected =
  arg === "all" ? PROJECTS : PROJECTS.filter((project) => project.slug === arg);
if (selected.length === 0) {
  console.error(`Unknown project "${arg}".`);
  console.error(`Valid: ${PROJECTS.map((p) => p.slug).join(", ")}, all`);
  process.exit(1);
}

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;

async function readManifest() {
  try {
    return JSON.parse(await readFile(MANIFEST_PATH, "utf8"));
  } catch {
    return { generatedAt: null, projects: {} };
  }
}

function dedupeCss(stops) {
  const sorted = [...stops].sort((a, b) => a.offsetY - b.offsetY);
  if (sorted.length === 0) return [];
  const maxOffset = sorted[sorted.length - 1].offsetY;
  const out = [];
  for (const stop of sorted) {
    const previous = out[out.length - 1];
    if (previous && Math.abs(stop.offsetY - previous.offsetY) < 200) {
      // The bottom of the page wins over a section edge just above it.
      if (stop.offsetY === maxOffset) out[out.length - 1] = stop;
      continue;
    }
    out.push(stop);
  }
  return out;
}

async function captureRoute(project, route, browser) {
  const key = routeKey(route);
  const outDir = path.join(CAPTURES, project.slug);
  await mkdir(outDir, { recursive: true });

  const manifestRoute = {
    path: route.path,
    label: route.label ?? key,
    url: routePath(project, route),
    displayUrl: displayUrl(project, route),
    desktop: null,
    mobile: null,
  };

  console.log(`\n→ ${project.slug} / ${key}  (${manifestRoute.url})`);

  for (const spec of SPECS) {
    const files = {
      png: path.join(outDir, `${key}.${spec.label}.png`),
      jpg: path.join(outDir, `${key}.${spec.label}.jpg`),
      sections: path.join(outDir, `${key}.${spec.label}.sections.json`),
    };
    await Promise.all(Object.values(files).map((file) => rm(file, { force: true })));

    const { context, page } = await openPage(
      browser,
      spec.context,
      manifestRoute.url,
    );

    try {
      const preloaderMs = await waitForPreloader(page);
      const cookies = await dismissCookieBanners(page);
      const primed = await primePage(page, spec.cssHeight);
      const frozenVideos = await freezeVideos(page);
      const neutralized = project.capture?.hideFixed === false
        ? { fixed: [], unstuck: [], kept: [] }
        : await neutralizeChrome(page);

      const pageHeight = primed.height;
      const maxScroll = Math.max(0, pageHeight - spec.cssHeight);
      const detected = (await measureSections(page)).map((row) => ({
        offsetY: row.offsetY,
        source: row.label,
        height: row.height,
      }));

      const overrides =
        spec.label === "desktop" ? route.stops : route.mobileStops;
      let stops;
      let overridden = false;

      if (overrides && overrides.length > 0) {
        overridden = true;
        stops = await resolveStops(page, overrides);
      } else {
        stops = detected;
        // The last frame of content is the bottom of the page, not the last
        // section's top edge.
        const last = stops[stops.length - 1];
        if (!last || Math.abs(maxScroll - last.offsetY) >= 200) {
          stops = [...stops, { offsetY: maxScroll, source: "bottom" }];
        } else {
          stops = [...stops.slice(0, -1), { offsetY: maxScroll, source: "bottom" }];
        }
      }

      stops = dedupeCss(
        stops.map((stop) => ({
          ...stop,
          offsetY: Math.min(maxScroll, Math.max(0, Math.round(stop.offsetY))),
        })),
      );

      const normalized = normalizeStops(
        stops.map((stop) => stop.offsetY),
        pageHeight,
        spec.cssHeight,
        project.capture?.maxStops ?? DEFAULT_MAX_STOPS,
      );
      const finalStops = normalized.map((offsetY) => {
        const match = stops.find((stop) => stop.offsetY === offsetY);
        return { offsetY, source: match?.source ?? (offsetY === 0 ? "top" : "selected") };
      });

      const captured = await captureTallPage({
        page,
        height: pageHeight,
        viewportHeight: spec.cssHeight,
        viewportWidth: spec.cssWidth,
        dpr: spec.dpr,
      });

      await writeFile(files.png, captured.buffer);
      await writeDerivative(captured.buffer, files.jpg, DERIVATIVE_WIDTH[spec.label]);

      const sectionsPayload = {
        url: manifestRoute.url,
        capturedAt: new Date().toISOString(),
        viewport: { width: spec.cssWidth, height: spec.cssHeight, dpr: spec.dpr },
        pageHeight,
        viewportHeight: spec.cssHeight,
        maxScroll,
        overridden,
        capture: captured.mode,
        stops: finalStops,
        detected,
        neutralizedChrome: neutralized,
        frozenVideos,
        cookieBanners: cookies,
        preloaderMs,
        heightPasses: primed.heights,
      };
      await writeFile(files.sections, `${JSON.stringify(sectionsPayload, null, 2)}\n`);

      const [pngStat, jpgStat] = await Promise.all([
        stat(files.png),
        stat(files.jpg),
      ]);

      manifestRoute[spec.label] = {
        png: `captures/${project.slug}/${key}.${spec.label}.png`,
        image: `captures/${project.slug}/${key}.${spec.label}.jpg`,
        cssWidth: spec.cssWidth,
        cssHeight: pageHeight,
        intrinsicWidth: captured.width,
        intrinsicHeight: captured.height,
        viewportHeight: spec.cssHeight,
        dpr: spec.dpr,
        stops: finalStops.map((stop) => stop.offsetY),
        override: overridden,
        mode: captured.mode,
        capturedAt: sectionsPayload.capturedAt,
      };

      const flag = captured.mode === "stitched" ? "  [STITCHED]" : "";
      console.log(
        `  ${spec.label.padEnd(7)} ${captured.mode.padEnd(8)} ${captured.width}x${captured.height}px  ` +
          `(${spec.cssWidth}x${pageHeight} css)  PNG ${kb(pngStat.size)}  JPG ${kb(jpgStat.size)}${flag}`,
      );
      if (captured.reason) console.log(`          fallback reason: ${captured.reason}`);
      if (cookies.clicked.length || cookies.hidden.length) {
        console.log(
          `          cookies: clicked ${JSON.stringify(cookies.clicked)} hidden ${JSON.stringify(cookies.hidden)}`,
        );
      }
      const frozenCount = frozenVideos.filter((v) => v.status === "frozen").length;
      if (frozenCount) console.log(`          videos frozen: ${frozenCount}`);
      if (neutralized.fixed.length) console.log(`          fixed hidden: ${neutralized.fixed.join(", ")}`);
      if (neutralized.unstuck.length) console.log(`          sticky->relative: ${neutralized.unstuck.join(", ")}`);
      if (neutralized.kept.length) console.log(`          fixed canvas kept: ${neutralized.kept.join(", ")}`);
      console.log(
        `          stops (${finalStops.length}${overridden ? ", config" : ", auto"}):`,
      );
      for (const [index, stop] of finalStops.entries()) {
        console.log(
          `            [${index}] ${String(stop.offsetY).padStart(6)}  ${stop.source}`,
        );
      }
    } finally {
      await context.close();
    }
  }

  if (route.liveScroll) {
    try {
      const scrollDir = path.join(VIDEO_ROOT, "public", "scrolling");
      await mkdir(scrollDir, { recursive: true });
      const fileName = `${project.slug}-${key}.mp4`;
      const outputPath = path.join(scrollDir, fileName);
      const frameDir = path.join(VIDEO_ROOT, ".tmp", "scroll", `${project.slug}-${key}`);

      console.log(`  recording real scroll …`);
      const measured = await measureFinalHeight(browser, manifestRoute.url);
      const scroll = await recordSmoothScroll(browser, {
        url: manifestRoute.url,
        finalHeight: measured.height,
        stops: measured.stops,
        frameDir,
        outputPath,
        publicSrc: `scrolling/${fileName}`,
      });
      manifestRoute.scroll = {
        ...scroll,
        capturedAt: new Date().toISOString(),
      };
      const { size } = await stat(outputPath);
      console.log(
        `  scroll  ${scroll.width}x${scroll.height}px  ${scroll.duration.toFixed(2)}s  ` +
          `${scroll.frames} frames  ${kb(size)}`,
      );
    } catch (error) {
      manifestRoute.scrollError = String(error);
      console.error(`  scroll recording failed: ${error?.stack ?? error}`);
    }
  }

  if (route.record) {
    // Optional reference clip: a failure here must not discard the stills.
    try {
      await mkdir(RECORDINGS, { recursive: true });
      const recordContext = await browser.newContext({
        ...DESKTOP.context,
        deviceScaleFactor: 1,
        recordVideo: { dir: RECORDINGS, size: { width: 1440, height: 900 } },
      });
      const page = await recordContext.newPage();
      await page.goto(manifestRoute.url, { waitUntil: "domcontentloaded" });
      await waitForPreloader(page);
      await recordScroll(page, 900, 7000);
      const video = page.video();
      await recordContext.close();
      const raw = await video.path();
      const target = path.join(outDir, `${key}.recording.webm`);
      await rename(raw, target);
      manifestRoute.recording = `captures/${project.slug}/${key}.recording.webm`;
      console.log(`  recording saved: ${target}`);
    } catch (error) {
      console.warn(`  recording failed (captures kept): ${error}`);
    }
  }

  return { key, route: manifestRoute };
}

const manifest = await readManifest();
const browser = await chromium.launch();
const failures = [];
const started = Date.now();

for (const project of selected) {
  const routes = {};
  for (const route of project.routes) {
    try {
      const result = await captureRoute(project, route, browser);
      routes[result.key] = result.route;
    } catch (error) {
      failures.push({
        project: project.slug,
        route: route.path,
        error: error instanceof Error ? error.message : String(error),
      });
      console.error(`\n✗ ${project.slug} ${route.path}: ${error?.stack ?? error}`);
    }
  }

  // Drop routes removed from the config, but keep a configured route whose
  // capture failed this run so a transient error does not erase a good entry.
  const configuredKeys = new Set(project.routes.map(routeKey));
  const previous = manifest.projects[project.slug];
  const preserved = Object.fromEntries(
    Object.entries(previous?.routes ?? {}).filter(([key]) =>
      configuredKeys.has(key),
    ),
  );
  manifest.projects[project.slug] = {
    slug: project.slug,
    name: project.name,
    accent: project.accent,
    routes: { ...preserved, ...routes },
  };
}

manifest.generatedAt = new Date().toISOString();
await mkdir(path.dirname(MANIFEST_PATH), { recursive: true });
await writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

await browser.close();

console.log(`\nManifest: ${MANIFEST_PATH}`);
console.log(`Done in ${((Date.now() - started) / 1000).toFixed(1)}s`);

if (failures.length > 0) {
  console.error(`\n${failures.length} capture(s) failed:`);
  for (const failure of failures) {
    console.error(`  - ${failure.project} ${failure.route}: ${failure.error}`);
  }
  process.exitCode = 1;
}

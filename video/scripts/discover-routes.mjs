#!/usr/bin/env node
/**
 * Prints likely showcase routes for every configured project.
 *
 *   npm run discover
 *
 * Read-only on purpose: it never edits projects.ts. Pick a path, add it to the
 * route list, then run the capture. Combines sitemap entries with same-origin
 * links found on the home page, so client-rendered navs still surface.
 */
import { PROJECTS } from "../src/showcase/projects.ts";

const STRONG = [
  "about",
  "work",
  "works",
  "projects",
  "portfolio",
  "services",
  "studio",
];
const WEAK = ["case", "archive", "contact"];

const BLOCKED = [
  /^\/(_next|api|assets|cdn-cgi|wp-|feed|rss|privacy|terms|cookies|legal)/i,
  /\.(png|jpe?g|webp|avif|svg|gif|css|js|mjs|xml|pdf|zip|mp4|webm|ico|woff2?)$/i,
];

const clean = (path) => {
  const trimmed = path.replace(/\/+$/, "");
  return trimmed.length === 0 ? "/" : trimmed;
};

async function fetchText(url) {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36",
      },
      signal: AbortSignal.timeout(20_000),
      redirect: "follow",
    });
    if (!response.ok) return "";
    return await response.text();
  } catch {
    return "";
  }
}

function sitemapPaths(xml, origin) {
  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map(
    (match) => match[1],
  );
  return locs
    .map((raw) => {
      try {
        // Al Ghaith's sitemap emits localhost URLs; only the path is useful.
        return new URL(raw, origin).pathname;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function navPaths(html, origin) {
  const hrefs = [...html.matchAll(/href=["']([^"']+)["']/g)].map(
    (match) => match[1],
  );
  return hrefs
    .map((raw) => {
      if (
        raw.startsWith("#") ||
        raw.startsWith("mailto:") ||
        raw.startsWith("tel:") ||
        raw.startsWith("javascript:")
      ) {
        return null;
      }
      try {
        const url = new URL(raw, origin);
        if (url.origin !== origin) return null;
        return url.pathname;
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function score(path, used, source) {
  let value = 0;
  const lower = path.toLowerCase();
  for (const keyword of STRONG) {
    if (lower.includes(keyword)) value += 6;
  }
  for (const keyword of WEAK) {
    if (lower.includes(keyword)) value += 1;
  }
  const depth = path.split("/").filter(Boolean).length;
  if (depth === 1) value += 3;
  if (depth > 2) value -= 2;
  if (source.sitemap) value += 2;
  if (source.nav) value += 1;
  if (used.has(clean(path))) value -= 20;
  if (/^\/(ar|fr|de|es)(\/|$)/i.test(path)) value -= 2;
  if (/(contact|privacy|terms|legal|cookies)/i.test(path)) value -= 4;
  return value;
}

for (const project of PROJECTS) {
  const origin = new URL(project.url).origin;
  const [sitemap, home] = await Promise.all([
    fetchText(`${origin}/sitemap.xml`),
    fetchText(`${origin}/`),
  ]);

  const fromSitemap = sitemapPaths(sitemap, origin);
  const fromNav = navPaths(home, origin);
  const known = new Map();

  for (const path of fromSitemap) {
    known.set(clean(path), {
      path: clean(path),
      sitemap: true,
      nav: false,
    });
  }
  for (const path of fromNav) {
    const key = clean(path);
    const entry = known.get(key) ?? { path: key, sitemap: false, nav: false };
    entry.nav = true;
    known.set(key, entry);
  }

  const used = new Set(project.routes.map((route) => clean(route.path)));
  const candidates = [...known.values()]
    .filter((entry) => entry.path === "/" || !BLOCKED.some((rx) => rx.test(entry.path)))
    .filter((entry) => entry.path !== "/")
    .map((entry) => ({
      ...entry,
      score: score(entry.path, used, entry),
    }))
    .sort((a, b) => b.score - a.score || a.path.localeCompare(b.path));

  console.log(`\n${project.slug}  ${project.url}`);
  console.log(
    `  current: ${project.routes.map((route) => clean(route.path)).join(", ")}`,
  );
  if (candidates.length === 0) {
    console.log("  no candidates (sitemap and nav empty)");
    continue;
  }
  for (const candidate of candidates.slice(0, 8)) {
    const source = [
      candidate.sitemap ? "sitemap" : null,
      candidate.nav ? "nav" : null,
    ]
      .filter(Boolean)
      .join("+");
    const already = used.has(candidate.path) ? "  [already used]" : "";
    console.log(
      `  ${candidate.path.padEnd(34)} ${source.padEnd(12)} score ${String(
        candidate.score,
      ).padStart(2)}${already}`,
    );
  }
  const suggestion = candidates.find(
    (candidate) => !used.has(candidate.path),
  );
  if (suggestion) {
    console.log(`  suggested route 2: ${suggestion.path}`);
  }
}


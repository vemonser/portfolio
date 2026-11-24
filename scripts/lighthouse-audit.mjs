/**
 * Reproducible Lighthouse audit runner.
 *
 * Produces a before/after performance comparison for the portfolio home page.
 * Runs Lighthouse (mobile + desktop) against a URL and writes JSON + HTML
 * reports plus a compact markdown summary.
 *
 * Usage:
 *   pnpm exec node scripts/lighthouse-audit.mjs <url> <label> [outdir]
 *
 * Example:
 *   pnpm exec node scripts/lighthouse-audit.mjs http://localhost:3100 before .quality/audits/before
 *
 * Requires a Chromium binary. Set CHROME_PATH or let it auto-detect a
 * Playwright Chromium build.
 */
import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function findChrome() {
  if (process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH)) {
    return process.env.CHROME_PATH;
  }
  const cache = path.join(homedir(), ".cache", "ms-playwright");
  if (!existsSync(cache)) return undefined;
  // Highest-numbered Chromium build first, newest layout before legacy.
  const dirs = readdirSync(cache)
    .filter((d) => d.startsWith("chromium-"))
    .sort((a, b) => Number(b.split("-")[1]) - Number(a.split("-")[1]));
  for (const dir of dirs) {
    for (const rel of ["chrome-linux64/chrome", "chrome-linux/chrome"]) {
      const candidate = path.join(cache, dir, rel);
      if (existsSync(candidate)) return candidate;
    }
  }
  return undefined;
}

const CHROME = findChrome();
const CHROME_FLAGS = [
  "--headless",
  "--no-sandbox",
  "--disable-gpu",
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
].join(" ");

const url = process.argv[2] ?? "http://localhost:3100/";
const label = process.argv[3] ?? "audit";
const outDir = path.resolve(
  process.argv[4] ?? path.join(ROOT, ".quality", "audits", label),
);
mkdirSync(outDir, { recursive: true });

const METRICS = [
  "first-contentful-paint",
  "largest-contentful-paint",
  "total-blocking-time",
  "cumulative-layout-shift",
  "speed-index",
  "interactive",
];

function runLighthouse({ formFactor, preset, suffix }) {
  const basePath = path.join(outDir, `lighthouse-${suffix}`);
  const args = [
    url,
    "--only-categories=performance",
    `--form-factor=${formFactor}`,
    `--screenEmulation.mobile=${formFactor === "mobile"}`,
    "--throttling-method=simulate",
    "--output=json",
    "--output=html",
    `--output-path=${basePath}`,
    `--chrome-flags=${CHROME_FLAGS}`,
  ];
  if (preset) args.push(`--preset=${preset}`);
  if (CHROME) args.push(`--chrome-path=${CHROME}`);
  args.push("--quiet");

  console.log(`→ lighthouse ${formFactor} (${suffix}) on ${url}`);
  execFileSync("npx", ["--yes", "lighthouse", ...args], {
    stdio: "inherit",
    cwd: ROOT,
  });

  // Lighthouse appends ".report.<ext>" to a bare --output-path.
  const jsonPath = `${basePath}.report.json`;
  const htmlPath = `${basePath}.report.html`;
  const report = JSON.parse(readFileSync(jsonPath, "utf8"));
  return { report, jsonPath, htmlPath };
}

function summarize(report, formFactor) {
  const a = report.audits;
  const rows = METRICS.map((m) => {
    const audit = a[m];
    return `| ${m} | ${audit?.displayValue ?? "n/a"} | ${Math.round((audit?.numericValue ?? 0))} |`;
  });
  return [
    `### ${formFactor} — Performance ${Math.round(report.categories.performance.score * 100)}`,
    "",
    "| Metric | Display | Numeric |",
    "|---|---|---|",
    ...rows,
    "",
  ].join("\n");
}

const mobile = runLighthouse({
  formFactor: "mobile",
  suffix: "mobile",
});
const desktop = runLighthouse({
  formFactor: "desktop",
  preset: "desktop",
  suffix: "desktop",
});

const summary = [
  `# Lighthouse audit — ${label}`,
  "",
  `URL: ${url}`,
  `Date: ${new Date().toISOString()}`,
  `Chrome: ${CHROME ?? "default"}`,
  "",
  summarize(mobile.report, "mobile"),
  summarize(desktop.report, "desktop"),
].join("\n");

const summaryPath = path.join(outDir, "SUMMARY.md");
writeFileSync(summaryPath, summary);
console.log("\n" + summary);
console.log(`\nWrote ${summaryPath}`);
# Project Media Showcase — Implementation Plan

> **For agentic workers:** Follow this plan task-by-task, in order. Steps use
> checkbox (`- [ ]`) syntax for tracking. Do not improvise outside a task's
> scope. Every verification step must actually be run and its real output
> recorded — a claimed pass without a run is a failure.
>
> **Executor note:** This plan is written to be executed by a standalone agent
> (DeepSeek CLI) with no access to the design conversation. The full design
> context lives in the spec named below — read both before starting.

**Goal:** Rebuild the portfolio's project presentation — CRZ-style two-image
cards outside, Dennis Snellenberg-style media streams (browser frames, phone
trio, scroll video) inside case studies — using real captures of four live
sites.

**Architecture:** A re-runnable Playwright capture pipeline produces per-project
assets into `public/work/<slug>/`; a typed `media` block model on `Project`
drives a declarative media sequence on the case-study page; CSS device frames
(browser chrome, phone bezel) present the captures; one client component adds
IO-driven muted looping video and one adds GSAP parallax.

**Tech Stack:** Next.js 16.4.6 (App Router, Turbopack), React 19.3, Tailwind
4.3.3, TypeScript 5, GSAP 3.15 + Lenis, Vitest (unit), Playwright 1.65
(browser), Sharp 0.35, ffmpeg (system, `/usr/bin/ffmpeg`).

**Spec:** `docs/superpowers/specs/2026-11-15-project-media-showcase-design.md`

## Global Constraints

- **Next.js 16.4.6 is NOT the Next.js you may know.** Before writing any
  React/Next code (Tasks 3–4), read the relevant bundled guides under
  `node_modules/next/dist/docs/01-app/` — especially the `<Image>` component
  and client-component guides — and follow 16.x APIs, not training-data
  assumptions. This is a repo mandate (`AGENTS.md`).
- Package manager is **pnpm** only. Work on branch `feat/portfolio-redesign`
  (already checked out). One atomic commit per task, conventional-commit
  style (`feat(work): …`, `test(work): …`), matching the existing history.
- **Design tokens only** — spacing `var(--space-0…8)`, durations
  `var(--dur-fast|base|slow)`, easing `var(--ease-editorial)`, colors
  `bone/ink/lime/warm/black`, radii and hairlines
  `var(--line-hairline|strong)`. No new colors, fonts, or magic numbers where
  a token exists. Hover crossfade uses `var(--dur-slow)` (450 ms).
- **Do not touch** hero, about, contact, blog, navigation, footer. Do not
  change theme or copy (capture `alt`/`aria-label` text is the only new copy,
  and it only describes what is on screen).
- The project card root `<Link>` must keep `data-project={project.slug}` and
  `data-compression-target="project"` (contract with the hero's compression
  test, `tests/hero-liquid-compression.spec.ts`).
- All media is local under `public/` — no remote patterns, no external
  embeds. WebP quality 82; `scroll.webm` VP8, ≤ 2 MB target, scaled to
  1280 wide.
- Never commit credentials or secrets (there are none in this work).
- If running `pnpm dev` rewrites the `AGENTS.md` agent-rules block, include
  that change in the next commit (it re-creates itself; committing keeps the
  tree clean).
- English copy only. The site is single-locale.
- Reduced motion: every motion added by this plan must collapse gracefully
  (Reveal already does; parallax and video must too).

## Review Focus

The five failure modes most likely to bite a visitor, each pinned by a test in
the task that owns the code:

1. **A referenced media file missing on disk** (broken image on a live page)
   → Task 2 unit test asserts every `src/srcs/poster/image/imageHover` path
   exists under `public/`.
2. **Capture targets drifting from the project catalogue** (new project added
   to `projects.ts` but never captured) → Task 2 sync test asserts
   `CAPTURE_TARGETS` matches `projects.ts` slug-for-slug, url-for-url.
3. **Breaking the hero↔card compression contract** → Task 3 keeps
   `data-compression-target` and re-runs the existing
   `tests/hero-liquid-compression.spec.ts` as a regression step.
4. **Video autoplaying for reduced-motion users, or playing off-screen**
   (motion sickness / battery drain) → Task 4 e2e asserts paused under
   `reducedMotion: 'reduce'` and paused after scrolling out of view.
5. **Horizontal overflow at 360–390 px from the phone trio or staggered
   media** → Task 4 e2e asserts `scrollWidth <= innerWidth` at 390 px on a
   case-study page and the work page.

File-size blowup (video) is covered by Task 1's size verification step and
re-checked in Task 5's evidence.

---

### Task 1: Capture pipeline — `scripts/capture-work.mjs`

**Files:**
- Create: `scripts/capture-work.mjs`
- Modify: `package.json` (scripts)

**Interfaces:**
- Consumes: nothing from other tasks. The four live URLs (hard-coded below —
  Task 2's sync test pins them to `projects.ts`).
- Produces: `CAPTURE_TARGETS: { slug: string; url: string }[]` (named export,
  no side effects on import — later imported by
  `src/content/projects/capture-sync.test.ts`), and on-disk assets per slug:

  | file | content |
  |---|---|
  | `public/work/<slug>/hero.webp` | desktop 1440×900 @2x, top of page |
  | `public/work/<slug>/mid-1.webp` | desktop, 45 % scroll position |
  | `public/work/<slug>/mid-2.webp` | desktop, 90 % scroll position |
  | `public/work/<slug>/m-1.webp` | mobile 390×844 @2x, top |
  | `public/work/<slug>/m-2.webp` | mobile, 50 % scroll |
  | `public/work/<slug>/m-3.webp` | mobile, 100 % scroll |
  | `public/work/<slug>/scroll.webm` | desktop scroll-through video, VP8, ≤ 2 MB |

- [ ] **Step 1: Verify the environment**

Run: `pnpm install && ffmpeg -version | head -1 && pnpm exec playwright install chromium`
Expected: install succeeds; ffmpeg prints a version (system path
`/usr/bin/ffmpeg`); chromium either installed or already present.

- [ ] **Step 2: Write `scripts/capture-work.mjs`**

Reference implementation — the choreography (settle → position → capture,
video timing, ffmpeg flags) is the part tests cannot pin, so implement it as
written; cosmetic restructuring is fine, behavioral changes are not:

```js
#!/usr/bin/env node
/**
 * Captures real media for every live project into public/work/<slug>/.
 * Re-runnable (idempotent): overwrites its own output. Run `pnpm capture:work`
 * whenever a live site changes. Standalone: guards main() behind direct
 * invocation so tests can import CAPTURE_TARGETS without launching a browser.
 */
import { execFileSync } from "node:child_process";
import { mkdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { chromium } from "@playwright/test";
import sharp from "sharp";

export const CAPTURE_TARGETS = [
  { slug: "anom-creative", url: "https://anomcreative.com/" },
  { slug: "fambam", url: "https://fambam.vemonser7.workers.dev/" },
  { slug: "advrt", url: "https://advrt.vercel.app/" },
  { slug: "al-ghaith", url: "https://alghaithac.com/" },
];

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const PUBLIC_ROOT = path.resolve("public", "work");

/** Wait for the page to settle, then scroll through once so lazy media
 *  loads, then return to top. Mirrors scripts/editorial-evidence.mjs. */
async function settle(page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1200);
  const height = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < height; y += 700) {
    await page.evaluate((value) => window.scrollTo(0, value), y);
    await page.waitForTimeout(70);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
}

async function scrollToFraction(page, fraction) {
  await page.evaluate(
    (f) =>
      window.scrollTo(
        0,
        (document.body.scrollHeight - window.innerHeight) * f,
      ),
    fraction,
  );
  await page.waitForTimeout(700); // let scroll-triggered animations finish
}

async function saveWebp(pngBuffer, outPath) {
  await sharp(pngBuffer).webp({ quality: 82 }).toFile(outPath);
}

async function captureStills(browser, target, outDir) {
  // Desktop — deviceScaleFactor 2 for crisp frames; video context stays 1×.
  const desktop = await browser.newContext({ ...DESKTOP, deviceScaleFactor: 2 });
  const dPage = await desktop.newPage();
  await dPage.goto(target.url, { waitUntil: "load", timeout: 60_000 });
  await settle(dPage);
  await saveWebp(await dPage.screenshot({ type: "png" }), `${outDir}/hero.webp`);
  await scrollToFraction(dPage, 0.45);
  await saveWebp(await dPage.screenshot({ type: "png" }), `${outDir}/mid-1.webp`);
  await scrollToFraction(dPage, 0.9);
  await saveWebp(await dPage.screenshot({ type: "png" }), `${outDir}/mid-2.webp`);
  await desktop.close();

  // Mobile — three screens.
  const mobile = await browser.newContext({ ...MOBILE, deviceScaleFactor: 2 });
  const mPage = await mobile.newPage();
  await mPage.goto(target.url, { waitUntil: "load", timeout: 60_000 });
  await settle(mPage);
  for (const [i, fraction] of [0, 0.5, 1].entries()) {
    await scrollToFraction(mPage, fraction);
    await saveWebp(await mPage.screenshot({ type: "png" }), `${outDir}/m-${i + 1}.webp`);
  }
  await mobile.close();
}

async function captureVideo(browser, target, outDir) {
  const context = await browser.newContext({
    ...DESKTOP,
    recordVideo: { dir: outDir, size: DESKTOP },
  });
  const page = await context.newPage();
  await page.goto(target.url, { waitUntil: "load", timeout: 60_000 });
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1200);

  // Slow programmatic scroll: ~8 s top → bottom in 60 steps.
  const steps = 60;
  const stepMs = 8000 / steps;
  for (let i = 1; i <= steps; i += 1) {
    await page.evaluate(
      (f) =>
        window.scrollTo(
          0,
          (document.body.scrollHeight - window.innerHeight) * f,
        ),
      i / steps,
    );
    await page.waitForTimeout(stepMs);
  }
  await page.waitForTimeout(600);

  const video = page.video();
  await context.close();
  const rawPath = await video.path();

  // Compress: VP8, no audio, 1280 wide, constrained quality → ~1 MB for 9 s.
  execFileSync("ffmpeg", [
    "-y", "-i", rawPath,
    "-c:v", "libvpx", "-crf", "34", "-b:v", "0", "-an",
    "-vf", "scale=1280:-2",
    "-deadline", "good", "-cpu-used", "2",
    path.join(outDir, "scroll.webm"),
  ]);
  await rm(rawPath, { force: true });
}

async function main() {
  const browser = await chromium.launch();
  for (const target of CAPTURE_TARGETS) {
    const outDir = path.join(PUBLIC_ROOT, target.slug);
    await mkdir(outDir, { recursive: true });
    process.stdout.write(`→ ${target.slug} …\n`);
    await captureStills(browser, target, outDir);
    await captureVideo(browser, target, outDir);
  }
  await browser.close();

  // Report sizes so a blown budget is visible immediately.
  for (const target of CAPTURE_TARGETS) {
    const outDir = path.join(PUBLIC_ROOT, target.slug);
    const files = await Promise.all(
      ["hero.webp", "mid-1.webp", "mid-2.webp", "m-1.webp", "m-2.webp",
        "m-3.webp", "scroll.webm"].map(async (name) => {
        const { size } = await stat(path.join(outDir, name));
        return `${name}: ${(size / 1024).toFixed(0)} KiB`;
      }),
    );
    process.stdout.write(`${target.slug}\n  ${files.join("\n  ")}\n`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
```

Add to `package.json` scripts (next to `"evidence"`):
`"capture:work": "node scripts/capture-work.mjs"`.

- [ ] **Step 3: Run the capture and verify outputs**

Run: `pnpm capture:work`
Expected: exits 0; prints a size table for all four slugs; each
`public/work/<slug>/` contains all 7 files. Then verify budgets:

Run: `du -h public/work/*/scroll.webm && ls public/work/*/ | sort | uniq -c | sort -rn | head -3`
Expected: every `scroll.webm` ≤ 2 MB (≈ 2000 KiB); the per-directory file list
shows 7 files per slug.

If one of the live sites fails to load: retry once with a longer settle; if
it still fails, stop and report to the owner — do not commit half a pipeline.

- [ ] **Step 4: Commit**

```bash
git add scripts/capture-work.mjs package.json pnpm-lock.yaml public/work
git commit -m "feat(work): add the live-site capture pipeline and per-project media"
```

---

### Task 2: Data model, catalogue content, and unit tests

**Files:**
- Modify: `src/content/projects/types.ts`
- Modify: `src/content/projects/projects.ts`
- Test: `src/content/projects/media.test.ts` (new)
- Test: `src/content/projects/capture-sync.test.ts` (new)
- Delete: `public/work/anom-creative.webp`, `public/work/fambam.webp`,
  `public/work/advrt.webp`, `public/work/al-ghaith.webp` (superseded)

**Interfaces:**
- Consumes: `CAPTURE_TARGETS` from `scripts/capture-work.mjs` (Task 1); the
  asset paths produced by Task 1.
- Produces: `ProjectMediaBlock` (exported union type with kinds
  `"browser" | "phones" | "video"`); `Project` gains
  `imageHover?: string` and `media: ProjectMediaBlock[]`. Tasks 3–5 consume
  these exact names.

- [ ] **Step 1: Write the failing tests**

`src/content/projects/media.test.ts`:

```ts
import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";

import { projects } from "./projects";

const publicRoot = fileURLToPath(new URL("../../../public", import.meta.url));

describe("project media", () => {
  it("gives every project a media stream of the agreed shape", () => {
    for (const project of projects) {
      expect(Array.isArray(project.media)).toBe(true);

      for (const block of project.media) {
        if (block.kind === "browser") {
          expect(block.src).toMatch(/^\/work\/[a-z-]+\/[a-z0-9-]+\.webp$/);
          expect(block.alt.length).toBeGreaterThan(0);
        } else if (block.kind === "phones") {
          expect(block.srcs).toHaveLength(3);
          expect(block.alts).toHaveLength(3);
          for (const alt of block.alts) expect(alt.length).toBeGreaterThan(0);
        } else if (block.kind === "video") {
          expect(block.src).toMatch(/\.webm$/);
          expect(block.poster).toMatch(/\.webp$/);
        } else {
          throw new Error(`unknown media kind: ${JSON.stringify(block)}`);
        }
      }
    }
  });

  it("references only files that exist in public/", () => {
    const paths: string[] = [];
    for (const project of projects) {
      if (project.image) paths.push(project.image);
      if (project.imageHover) paths.push(project.imageHover);
      for (const block of project.media) {
        if (block.kind === "browser") paths.push(block.src);
        if (block.kind === "phones") paths.push(...block.srcs);
        if (block.kind === "video") paths.push(block.src, block.poster);
      }
    }
    for (const p of paths) {
      expect(existsSync(`${publicRoot}${p}`), `missing ${p}`).toBe(true);
    }
  });

  it("uses the hero as the card image and a second capture on hover", () => {
    for (const project of projects) {
      expect(project.image).toMatch(/\/hero\.webp$/);
      expect(project.imageHover).toBeTruthy();
      expect(project.imageHover).not.toBe(project.image);
    }
  });
});
```

`src/content/projects/capture-sync.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { CAPTURE_TARGETS } from "../../../scripts/capture-work.mjs";
import { projects } from "./projects";

describe("capture targets", () => {
  it("match the catalogue slug-for-slug and url-for-url", () => {
    expect(CAPTURE_TARGETS.map((t) => t.slug)).toEqual(
      projects.map((p) => p.slug),
    );
    for (const target of CAPTURE_TARGETS) {
      const project = projects.find((p) => p.slug === target.slug);
      expect(project?.url).toBe(target.url);
    }
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm test`
Expected: FAIL — `media` does not exist on `Project` (type error surfaced by
the assertions on `project.media`).

- [ ] **Step 3: Extend `types.ts` and rewrite the media data in `projects.ts`**

`types.ts` — add the union and extend `Project`:

```ts
export type ProjectMediaBlock =
  | { kind: "browser"; src: string; alt: string }
  | { kind: "phones"; srcs: string[]; alts: string[] }
  | { kind: "video"; src: string; poster: string };
```

`Project` gains:

```ts
  /** Second capture, revealed on card hover. */
  imageHover?: string;
  /** Case-study media stream, in reading order. */
  media: ProjectMediaBlock[];
```

`projects.ts` — for each of the four projects, set
`image: "/work/<slug>/hero.webp"`,
`imageHover: "/work/<slug>/mid-1.webp"`, and:

```ts
media: [
  { kind: "browser", src: "/work/<slug>/hero.webp", alt: "<Title> — homepage, desktop" },
  { kind: "video", src: "/work/<slug>/scroll.webm", poster: "/work/<slug>/hero.webp" },
  {
    kind: "phones",
    srcs: ["/work/<slug>/m-1.webp", "/work/<slug>/m-2.webp", "/work/<slug>/m-3.webp"],
    alts: [
      "<Title> — homepage, mobile",
      "<Title> — mid-page, mobile",
      "<Title> — end of page, mobile",
    ],
  },
  { kind: "browser", src: "/work/<slug>/mid-1.webp", alt: "<Title> — mid-page section, desktop" },
  { kind: "browser", src: "/work/<slug>/mid-2.webp", alt: "<Title> — end of page, desktop" },
],
```

with `<slug>`/`<Title>` substituted per project (`anom-creative`/`Anom
Creative`, `fambam`/`FamBam`, `advrt`/`Advrt`, `al-ghaith`/`Al Ghaith`).
Everything else in each entry (tagline, role, year, url, cover, coverAlt,
sections) stays exactly as it is.

Delete the four superseded top-level captures (`public/work/<slug>.webp`).

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm test && pnpm typecheck`
Expected: PASS — all existing catalogue tests plus the two new files.

- [ ] **Step 5: Commit**

```bash
git add src/content/projects public/work
git commit -m "feat(work): give every project a typed media stream backed by real captures"
```

---

### Task 3: CRZ-style card hover swap (outside)

**Files:**
- Modify: `src/features/ui/EditorialMedia.tsx`
- Modify: `src/features/work/ProjectCard.tsx`
- Test: `tests/work-media.spec.ts` (new)

**Interfaces:**
- Consumes: `Project.imageHover` (Task 2).
- Produces: `EditorialMedia` accepts a new optional prop
  `hoverSrc?: string` — when set and the project has an `image`, a second
  `<Image>` layer crossfades in on `group-hover`/`group-focus-visible` while
  the base fades out. One shared `__index` badge and `__scrim`; the fallback
  (no image) path ignores `hoverSrc`. Task 5 does not use `hoverSrc`.

- [ ] **Step 0: Read the Next.js 16 guides first**

Read the `<Image>` guide under `node_modules/next/dist/docs/01-app/` and
confirm the `fill` / `sizes` / `loading` props behave as used in the existing
`EditorialMedia.tsx`. If 16.x changed any prop, follow the bundled doc.

- [ ] **Step 1: Write the failing e2e test**

`tests/work-media.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

test.describe("project cards (CRZ outside)", () => {
  test("crossfades to a second capture on hover", async ({ page }) => {
    await page.goto("/work");

    const card = page.locator("a[data-project='anom-creative']");
    await card.scrollIntoViewIfNeeded();
    await expect(card).toBeVisible();

    // Two captures, the second is the hover layer. (src is URL-encoded by
    // next/image, so match the filename only.)
    const imgs = card.locator("img");
    await expect(imgs).toHaveCount(2);
    await expect(imgs.nth(1)).toHaveAttribute("src", /mid-1\.webp/);

    // Crossfade: hidden by default, revealed on hover.
    await expect(imgs.nth(1)).toHaveCSS("opacity", "0");
    await card.hover();
    await expect(imgs.nth(1)).toHaveCSS("opacity", "1");
    await expect(imgs.nth(0)).toHaveCSS("opacity", "0");
  });

  test("the hero compression contract survives", async ({ page }) => {
    // Duplicate of the existing contract assertion, cheap insurance while
    // the card internals change.
    await page.goto("/");
    const card = page.locator("a[data-project]").first();
    await expect(card).toHaveAttribute("data-compression-target", "project");
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm exec playwright test tests/work-media.spec.ts`
Expected: FAIL — cards render one `<img>`.

- [ ] **Step 3: Implement the swap**

`EditorialMedia.tsx`, image branch only — base image gains
`group-hover:opacity-0 group-focus-visible:opacity-0` (with the same
`transition-opacity duration-[var(--dur-slow)] ease-[var(--ease-editorial)]`
as the hover layer), and when `hoverSrc` is set render a second `<Image>`
absolutely stacked (`fill`, same `sizes`, `alt=""`, `object-cover object-top`)
with:

```
absolute inset-0 opacity-0 transition-opacity
duration-[var(--dur-slow)] ease-[var(--ease-editorial)]
group-hover:opacity-100 group-focus-visible:opacity-100 will-change-opacity
```

`ProjectCard.tsx` — pass `hoverSrc={project.imageHover}` to both variants'
`EditorialMedia`. Change nothing else on the card: the root `<Link>` keeps
`data-project` and `data-compression-target`, the `P / 01` index, title,
role · year, tagline, and the existing arrow badge and wrapper scale stay.

- [ ] **Step 4: Run the new test and the hero regression**

Run: `pnpm exec playwright test tests/work-media.spec.ts tests/hero-liquid-compression.spec.ts`
Expected: PASS both files.

- [ ] **Step 5: Commit**

```bash
git add src/features/ui/EditorialMedia.tsx src/features/work/ProjectCard.tsx tests/work-media.spec.ts
git commit -m "feat(work): crossfade cards to a second capture on hover"
```

---

### Task 4: Dennis-style case-study media stream (inside)

**Files:**
- Create: `src/features/work/BrowserFrame.tsx` (server component)
- Create: `src/features/work/PhoneTrio.tsx` (server component)
- Create: `src/features/work/ProjectVideo.tsx` (client component)
- Create: `src/features/ui/Parallax.tsx` (client component)
- Create: `src/features/work/MediaBlock.tsx` (server component)
- Modify: `src/app/work/[slug]/page.tsx`
- Test: `tests/work-media.spec.ts` (append)

**Interfaces:**
- Consumes: `ProjectMediaBlock`, `project.media`, `project.url`
  (Tasks 1–2); `Reveal`, `LinkLine`, `NextProject`, `PageFrame`, copy tokens
  (existing).
- Produces (exact signatures later tasks/pages may reuse):

```ts
BrowserFrame:  { address: string; children: ReactNode; className?: string }
PhoneTrio:     { srcs: string[]; alts: string[]; className?: string }
ProjectVideo:  { src: string; poster: string; label: string; className?: string }
Parallax:      { children: ReactNode; className?: string }
MediaBlock:    { block: ProjectMediaBlock; title: string; url: string; priority?: boolean; className?: string }
```

- [ ] **Step 0: Read the Next.js 16 guides first**

Read the client-components guide (and the `<Image>` guide again) under
`node_modules/next/dist/docs/01-app/`. `Parallax`/`ProjectVideo` are
`"use client"` island children of a server page — follow whatever 16.x
prescribes for that composition.

- [ ] **Step 1: Write the failing e2e tests (append to `tests/work-media.spec.ts`)**

```ts
test.describe("case study (Dennis inside)", () => {
  const SLUG = "anom-creative";

  test("shows the media sequence with the real domain in the address bar", async ({ page }) => {
    await page.goto(`/work/${SLUG}`);

    const frames = page.locator(".browser-frame");
    await expect(frames.first()).toContainText("anomcreative.com");

    // Hero, video frame, and two mid shots are browser-framed.
    await expect(frames).toHaveCount(4);

    // Three phone screens.
    await expect(page.locator(".phone-trio img")).toHaveCount(3);

    // Live-site pill in the header.
    const pill = page.getByRole("link", { name: /visit site/i }).first();
    await expect(pill).toHaveAttribute("href", "https://anomcreative.com/");
    await expect(pill).toHaveAttribute("target", "_blank");
  });

  test("video is muted, looping, and plays only in viewport", async ({ page }) => {
    await page.goto(`/work/${SLUG}`);

    const video = page.locator("video");
    await expect(video).toHaveCount(1);
    // React renders `muted` as a DOM property, not always an attribute —
    // assert the property. loop/playsinline are safe as attributes.
    expect(await video.evaluate((v) => v.muted)).toBe(true);
    await expect(video).toHaveAttribute("loop");
    await expect(video).toHaveAttribute("playsinline");

    await video.scrollIntoViewIfNeeded();
    await expect
      .poll(() => video.evaluate((v) => v.currentTime))
      .toBeGreaterThan(0);

    // Scrolled far past it — paused again.
    await page.locator("footer").scrollIntoViewIfNeeded();
    await expect
      .poll(() => video.evaluate((v) => v.paused))
      .toBe(true);
  });
});

// Variant-scoped tests: `test.use` must sit at describe level.
test.describe("case study — reduced motion", () => {
  test.use({ reducedMotion: "reduce" });

  test("video never plays", async ({ page }) => {
    await page.goto(`/work/anom-creative`);

    const video = page.locator("video");
    await video.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    expect(await video.evaluate((v) => v.paused)).toBe(true);
  });
});

test.describe("case study — narrow viewports", () => {
  for (const width of [360, 390]) {
    test.use({ viewport: { width, height: 844 } });

    test(`no horizontal overflow at ${width}px`, async ({ page }) => {
      await page.goto(`/work/anom-creative`);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});
```

Note: the `reduced-motion` and narrow-viewport tests live in their own
`test.describe` blocks because `test.use` applies at describe level.

- [ ] **Step 2: Run them to verify they fail**

Run: `pnpm exec playwright test tests/work-media.spec.ts`
Expected: FAIL — no `.browser-frame`, no `video`, no pill.

- [ ] **Step 3: Implement the five components**

`BrowserFrame.tsx` — a chrome shell; children bring their own aspect ratio:

```tsx
<div className={`browser-frame overflow-hidden rounded-[1.25rem] border
  border-[var(--line-strong)] bg-[var(--surface-raised)] ${className ?? ""}`}>
  <div className="flex h-11 items-center gap-[var(--space-2)] border-b
    border-[var(--line-hairline)] px-[var(--space-3)]">
    <span aria-hidden="true" className="flex shrink-0 gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full bg-bone/15" />
      <span className="h-2.5 w-2.5 rounded-full bg-bone/15" />
      <span className="h-2.5 w-2.5 rounded-full bg-bone/15" />
    </span>
    <span className="browser-frame__address mx-auto max-w-[60%] truncate
      rounded-full bg-bone/5 px-[var(--space-2)] py-[0.2rem] font-label
      text-t-14 tracking-[var(--track)] text-warm" dir="ltr">
      {address}
    </span>
    <span aria-hidden="true" className="w-[3.75rem] shrink-0" /> {/* balances the dots */}
  </div>
  <div className="relative">{children}</div>
</div>
```

`PhoneTrio.tsx` — three bezel frames, middle raised on large screens:

```tsx
<div className={`phone-trio flex flex-wrap items-end justify-center
  gap-[var(--space-2)] ${className ?? ""}`}>
  {srcs.map((src, i) => (
    <div key={src} className={`relative aspect-[9/19.5] w-[clamp(5.5rem,26vw,14rem)]
      rounded-[2.4rem] border border-[var(--line-strong)] bg-[var(--surface-raised)]
      ${i === 1 ? "lg:-translate-y-10" : ""}`}>
      <span aria-hidden="true" className="absolute left-1/2 top-[0.55rem] z-[1]
        h-[1.1rem] w-[4.5rem] -translate-x-1/2 rounded-full bg-[var(--color-black)]" />
      <span className="absolute inset-[0.3rem] block overflow-hidden rounded-[2.1rem]">
        <Image src={src} alt={alts[i]} fill sizes="(min-width: 1024px) 22vw, 32vw"
          className="object-cover object-top" />
      </span>
    </div>
  ))}
</div>
```

`ProjectVideo.tsx` — `"use client"`; no `autoplay` attribute, the observer
drives play so reduced motion can opt out entirely:

```tsx
"use client";
// <video loop playsInline preload="metadata" poster={poster}
//  aria-label={label} className={className}> <source src={src} type="video/webm" />
// Muted: React renders it as a property, not reliably as an attribute, so set
// it on the element too (ref callback: el.muted = true) to be safe for
// autoplay policies and SSR'd HTML.
// useEffect: if prefers-reduced-motion → return (never plays).
// Else IntersectionObserver({ threshold: 0.25 }) on the element:
//   isIntersecting → video.play().catch(() => {}); else → video.pause().
// Cleanup: observer.disconnect().
```

`Parallax.tsx` — `"use client"`, the `Reveal` pattern applied to GSAP:

```tsx
"use client";
// gsap.registerPlugin(ScrollTrigger) (module level, like SmoothScroll.tsx).
// useEffect: if prefers-reduced-motion → return.
// gsap.fromTo(el, { yPercent: -5 }, { yPercent: 5, ease: "none",
//   scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.6 } })
// inside a gsap.context(); revert() on cleanup.
// Render: <div className={className} style={{ scale: 1.12 }}>{children}</div>
// (the constant 1.12 scale covers the ±5% shift inside the fixed crop).
```

`MediaBlock.tsx` — one block, one presentation; `address` derives from the
project url:

```tsx
const address = (url: string) => new URL(url).hostname.replace(/^www\./, "");
```

- `browser` → `BrowserFrame` + `Parallax` wrapping an `aspect-[16/10]`
  relative span + `next/image` (`fill`, `sizes` matching placement:
  `"100vw"` full-bleed, `"(min-width: 1024px) 80vw, 100vw"` when the caller
  passes the offset `className`), `priority` when requested.
- `video` → `BrowserFrame` + `ProjectVideo` with
  `label={`${title} — scroll-through recording`}` and
  `className="block aspect-[16/10] w-full"`.
- `phones` → `PhoneTrio`.

- [ ] **Step 4: Rewire `src/app/work/[slug]/page.tsx`**

Keep: `generateStaticParams`, `generateMetadata`, `notFound`, the whole
`<header>` (title, tagline, the meta `<dl>`), the sections grid, the bottom
`LinkLine` visit link, and `NextProject` — unchanged. Add:

1. In the header, after the `<dl>`, when `project.url` exists — the pill:

```tsx
<a href={project.url} target="_blank" rel="noopener noreferrer"
   className="mt-[var(--space-4)] inline-flex min-h-11 items-center
     gap-[var(--space-1)] rounded-full border border-[var(--line-strong)]
     px-[var(--space-4)] font-label text-t-14 uppercase tracking-[var(--track)]
     text-bone no-underline transition-colors duration-[var(--dur-base)]
     hover:border-lime hover:bg-lime hover:text-ink">
  {copy.project.visit}
  <span aria-hidden="true">↗</span>
</a>
```

2. Replace the single full-bleed `EditorialMedia` with the media stream:

```tsx
{project.media[0] ? (
  <Reveal delay={80}>
    <div className="-mx-[var(--inset-edge)] mt-[var(--space-6)]">
      <MediaBlock block={project.media[0]} title={project.title} url={project.url} priority />
    </div>
  </Reveal>
) : null}

{/* sections grid stays exactly where it is, between hero and the stream */}

{project.media.length > 1 ? (
  <div className="mt-[var(--space-8)] grid gap-[var(--chapter-gap)]">
    {project.media.slice(1).map((block, i) => (
      <Reveal key={`${block.kind}-${i}`} delay={60}
        className={block.kind === "browser" && i % 2 === 1
          ? "lg:w-[78%] lg:ms-auto" : undefined}>
        <MediaBlock block={block} title={project.title} url={project.url} />
      </Reveal>
    ))}
  </div>
) : null}
```

Reading order the data produces: hero → text sections → video → phone trio →
mid-1 (full) → mid-2 (offset right). A project with empty `media` renders
text-only, unchanged from today.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm exec playwright test tests/work-media.spec.ts`
Expected: PASS — all card and case-study tests.

If the 390 px overflow test fails, fix the phone clamp width or the stagger
offset — never the global inset tokens.

- [ ] **Step 6: Commit**

```bash
git add src/features src/app/work
git commit -m "feat(work): case studies stream browser-framed captures, phone trio, and scroll video"
```

---

### Task 5: Full verification and evidence

**Files:**
- Create: `docs/superpowers/evidence/2026-11-15-media-showcase.md`
- No source changes expected in this task — if a check fails, fix the owning
  task's code and re-run everything below.

- [ ] **Step 1: Run the complete suite**

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm exec playwright test
```

Expected: all four commands exit 0. Record the real exit codes.

- [ ] **Step 2: Capture evidence screenshots**

Run: `pnpm evidence` (existing `scripts/editorial-evidence.mjs`; it already
includes `/work/anom-creative` among its routes) with the dev server up.

Then two manual states, saved under `audit-shots/media-showcase/` via a
throwaway Playwright snippet (not committed as a permanent script):
home card hover state at 1440, and the phone-trio section of
`/work/anom-creative` at 1440 and 390.

- [ ] **Step 3: Record budgets**

Run: `du -h public/work/*/scroll.webm public/work/*/hero.webp`
Expected: every video ≤ 2 MB. Record the numbers.

- [ ] **Step 4: Write the evidence document**

`docs/superpowers/evidence/2026-11-15-media-showcase.md` — for every command
above: the command, its real exit code, and a one-line result; the budget
table; the screenshot paths. No claimed pass without a recorded run.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/evidence audit-shots
git commit -m "docs(work): record media showcase verification evidence"
```

- [ ] **Step 6: Report back**

Summarize: tasks completed, commits (hashes), evidence location, media sizes,
and anything that deviated from the plan (with the reason). The owner runs a
final review pass before this is called done.

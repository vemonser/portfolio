# Single-Language (English) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the locale system and Arabic content, leaving one English site at root routes with no `next-intl`, no RTL code, and all tests green.

**Architecture:** Flatten `src/app/[locale]/*` to `src/app/*`; replace `next-intl` with a single typed `src/content/copy.ts`; keep only English project/blog data; delete locale props and RTL/Arabic CSS; add permanent redirects for the old `/en/*` and `/ar/*` URLs.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Three.js, GSAP, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-14-single-language-english-design.md`

## Global Constraints

- Keep every English string, project, post, metadata value and MDX body verbatim.
- Keep the palette, editorial tokens, Mercury material and Liquid Compression behaviour.
- No locale segment, no `Locale` type, no `next-intl`, no `ar:` utilities, no RTL selectors.
- Old `/en/*` and `/ar/*` URLs must permanently redirect to the un-prefixed path.
- No new runtime dependency.
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` and all Playwright specs exit 0.

---

### Task 1: Remove the locale system and move routes to the root

**Files:**
- Create: `src/app/layout.tsx`
- Move: `src/app/[locale]/{page.tsx,work,blog,about,contact}` → `src/app/`
- Modify: `next.config.ts`, `package.json`
- Delete: `src/app/[locale]/layout.tsx`, `src/i18n/`, `src/messages/`
- Create: `src/content/copy.ts`
- Test: `tests/editorial-routes.spec.ts` (redirect case, written first)

- [ ] **Step 1: Write the failing redirect assertion**

Add to `tests/editorial-routes.spec.ts`: `/en/work` lands on `/work`, `/ar` lands on `/`, and both return 200 content.

- [ ] **Step 2: Run it and watch it fail**

`pnpm playwright test tests/editorial-routes.spec.ts -g redirect --project=chromium`

Expected: FAIL — `/en/work` currently stays at `/en/work`, `/ar` redirects to `/ar`.

- [ ] **Step 3: Create the copy module**

`src/content/copy.ts` exports a single `copy` object with the current `en.json` shape, minus the language-switch and social labels. No async translation API.

- [ ] **Step 4: Flatten routing and rewrite the shell**

Create `src/app/layout.tsx` (`lang="en" dir="ltr"`, Inter + JetBrains only, single metadata from `copy`), move each page out of `[locale]`, delete the locale layout, `src/i18n/**` and `src/messages/**`.

- [ ] **Step 5: Replace translations with `copy`**

Every `getTranslations` / `setRequestLocale` / `params.locale` use is replaced by direct `copy.*` reads and static routes.

- [ ] **Step 6: Update `next.config.ts` and dependencies**

Drop the next-intl plugin and `/` → `/ar` redirect; add permanent `/en/:path*` and `/ar/:path*` → `/:path*` redirects. Remove `next-intl` from `package.json` and run `pnpm install`.

- [ ] **Step 7: Validate and commit**

`pnpm typecheck` (content/children may still need Task 2), then commit after Task 2 compiles.

---

### Task 2: De-localize content, primitives, hero and navigation

**Files:**
- Modify: `src/content/projects/**`, `src/content/blog/posts.ts`, `src/content/blog/*.mdx`
- Modify: `src/features/ui/editorial.ts` (+ test), `PageFrame.tsx`, `ChapterLabel.tsx`, `Prose.tsx`, `ProjectIndex.tsx`, `ProjectCard.tsx`, `EditorialMedia.tsx`, `NextProject.tsx`, `PostIndex.tsx`, `styles.ts`
- Modify: `src/features/hero/*`, `src/features/hero-scene/{types.ts,mercuryScene.ts,compression.ts,compression.test.ts}`
- Modify: `src/features/navigation/*`, `src/features/footer/SiteFooter.tsx`, `src/features/blog/format.ts`
- Delete: `src/content/projects/projects.ar.ts`, `src/content/blog/*.ar.mdx`, `src/features/navigation/locale-href.ts`, `src/features/navigation/locale-href.test.ts`

- [ ] **Step 1: Collapse the content model**

Rename `projects.en.ts` → `projects.ts` and `*.en.mdx` → `*.mdx`; delete Arabic sources; accessors drop the locale argument.

- [ ] **Step 2: Collapse editorial tokens**

`editorialType()` returns one composition; `formatNumber(value, { pad })` is Latin-only; remove `Locale`/`toLocale`; update its unit test.

- [ ] **Step 3: Drop locale props from primitives**

`PageFrame`, `ChapterLabel`, `Prose`, `ProjectIndex`, `EditorialMedia`, `ProjectCard`, `NextProject`, `PostIndex` lose locale/data-locale and keep the English composition.

- [ ] **Step 4: Fix the Hero**

`Hero` always renders the English metadata order; `HeroStage` fixes `ltr`; compression geometry loses `direction`, and the scene loses its direction option.

- [ ] **Step 5: Fix navigation and footer**

Remove the language link, `switchLocalePath`, `otherLocale`, `localizedHref`; header active state compares the pathname directly; footer links are plain paths.

- [ ] **Step 6: Validate and commit**

`pnpm test`, `pnpm typecheck`, `pnpm lint`.

---

### Task 3: Remove RTL and Arabic styling

**Files:**
- Modify: `src/app/globals.css`
- Modify: any remaining `ar:`/`en:` utilities in `src/features/**`

- [ ] **Step 1: Delete bilingual CSS**

Remove `html[lang="ar"]`, `html[dir="rtl"]`, `[data-locale="ar"]`, `ar:`/`en:` variants, the Arabic font variables and the Plex import left in any component.

- [ ] **Step 2: Lock the English composition**

Set `--chapter-open-measure: 64rem`, `--display-lead: 0.94`, `--measure-body: 68ch`; remove `--leading-arabic` and the Arabic display overrides.

- [ ] **Step 3: Verify visually**

Capture Home/Work/Blog/About/Contact at 390 and 1440; confirm no RTL remnants and no overflow.

- [ ] **Step 4: Commit**

`git commit -m "refactor(site): remove bilingual styling and locale plumbing"`

---

### Task 4: Update the test suite

**Files:**
- Modify: `tests/hero-liquid-compression.spec.ts`, `tests/contact-form.spec.ts`, `tests/editorial-routes.spec.ts`
- Modify: `src/features/blog/format.test.ts`, `src/content/projects/index.test.ts`

- [ ] **Step 1: Make browser specs English-only**

Root paths, one locale, no Arabic cases, no language-switch test, no locale-composition test. Keep hero fallbacks, contact states, nav/drawer/footer, route parity, overflow and the redirect assertion.

- [ ] **Step 2: Make unit tests English-only**

Drop Arabic token/format/catalogue cases; remove the deleted `locale-href` test.

- [ ] **Step 3: Run everything**

`pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build`, `pnpm playwright test`.

- [ ] **Step 4: Commit**

---

### Task 5: Final validation, evidence and docs

**Files:**
- Modify: `scripts/editorial-evidence.mjs`
- Modify: `README.md`
- Update: `audit-shots/editorial/*`

- [ ] **Step 1: Re-capture evidence in English only**

Idle/hover Home, Work, project, Blog, post, About, Contact, reduced motion, contact states at 390/768/1440/1920. Remove Arabic captures.

- [ ] **Step 2: Update the README**

Describe an English-only Next.js site; remove the bilingual/RTL sections and the locale-routing notes.

- [ ] **Step 3: Full validation**

All four commands plus the full Playwright suite; confirm the redirects and no overflow.

- [ ] **Step 4: Commit**

`git commit -m "docs(site): finalize English-only portfolio"`

## Final acceptance criteria

1. No locale segment, no language switch, no `next-intl`, no `Locale` type.
2. Arabic content files and messages are gone from the tree.
3. Every English page, project, post and metadata value is unchanged.
4. `/en/*` and `/ar/*` permanently redirect to the root paths.
5. No RTL/Arabic CSS, fonts or utilities remain.
6. Hero compression, contact states, navigation and responsive behaviour still pass.
7. `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` exit 0.

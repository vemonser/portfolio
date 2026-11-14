# Single-Language (English) Portfolio — Design Specification

**Date:** 2026-11-14
**Status:** Approved direction
**Scope:** Convert the whole site from a bilingual EN/AR system to an English-only site at root paths.

## 1. Purpose

The site currently treats English and Arabic as equal, first-class languages: locale-prefixed
routing, a translation runtime, per-locale content, mirrored RTL rules and per-locale
compositions. That machinery is no longer wanted. The site becomes one English product,
built once, with no locale concept in the codebase.

## 2. Decisions

- **Language:** English only.
- **Translation layer:** remove `next-intl` entirely. Copy lives in one typed module,
  `src/content/copy.ts`, shaped like the current `en.json`.
- **Routing:** no locale segment. `/`, `/work`, `/work/[slug]`, `/blog`, `/blog/[slug]`,
  `/about`, `/contact`.
- **Arabic content:** deleted from the working tree (`projects.ar.ts`, `*.ar.mdx`,
  `messages/ar.json`). Git history keeps them.
- **Old URLs:** permanent redirects from `/en/:path*` and `/ar/:path*` to `/:path*`.
- **RTL:** removed. No `dir="rtl"`, no `ar:` variants, no mirrored selectors, no Arabic
  font stack.

## 3. Target architecture

```
src/app/layout.tsx           root shell: lang="en" dir="ltr", fonts, metadata
src/app/page.tsx             Home
src/app/work/page.tsx        Work archive
src/app/work/[slug]/page.tsx Project detail
src/app/blog/page.tsx        Blog archive
src/app/blog/[slug]/page.tsx Post detail
src/app/about/page.tsx       About
src/app/contact/page.tsx     Contact
src/content/copy.ts          the only copy source
src/content/projects/        English catalogue only
src/content/blog/            English posts only
```

`next.config.ts` keeps MDX and Turbopack rules, drops the next-intl plugin and the
`/` → `/ar` redirect, and adds the legacy-locale redirects.

## 4. Component contracts

- No `Locale` type, no `toLocale`, no locale parameter anywhere.
- `editorialType()` returns one fixed composition; `formatNumber(value, { pad })` pads a
  counter with Latin digits.
- `PageFrame`, `ChapterLabel`, `Prose`, `ProjectIndex`, `EditorialMedia`, `ProjectCard`,
  `NextProject`, `PostIndex` and `Hero` lose their locale props.
- Project and blog accessors lose the locale argument:
  `getProjects()`, `getProject(slug)`, `getNextProject(slug)`, `getPosts()`, `getPost(slug)`.
- `date` formatting is English (`en-GB`) and keeps the ISO `dateTime` attribute.
- The Hero keeps its Mercury material and Liquid Compression. Compression geometry loses
  the `direction` field: the fold is always LTR and the scene has no direction option.
- Navigation loses the language switch. `localizedHref` is removed; links are plain paths.

## 5. Styling

- Keep the palette, editorial tokens, type ratio and chapter rhythm.
- Remove every `html[lang="ar"]`, `html[dir="rtl"]` and `[data-locale="ar"]` rule, every
  `ar:` utility, the `@custom-variant` definitions for `ar`/`en` (the `en:` utilities are
  inlined), and the IBM Plex Sans Arabic font.
- The English composition is the only composition: 64rem opening measure, 0.94 display
  leading, 68ch body measure, 8.5rem display ceiling.

## 6. Validation

- Unit: editorial tokens, project catalogue, date formatting — English-only cases.
- Browser: hero compression/fallbacks, contact states, navigation/drawer/footer, route
  parity, no overflow 360–1920, and legacy `/en/*`, `/ar/*` redirects.
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm build` all exit 0.
- Evidence is re-captured in English only; README describes an English-only site.

## 7. Non-goals

- No visual redesign, no copy rewrite, no new features.
- No change to the palette, the Mercury material, or the editorial system's values.
- No deployment or infrastructure change.

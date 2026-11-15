# Project Media Showcase — Design Spec

**Date:** 2026-11-15
**Status:** Approved by the owner (conversational review, 2026-11-15)
**Branch:** `feat/portfolio-redesign`
**Scope:** Project cards (outside) and case-study pages (inside) only.

## Goal

Upgrade the work presentation of the portfolio to an award-level standard:

- **Outside (cards on Home and `/work`)** — the CRZ.studio card pattern: a real
  browser-framed capture as the card image, crossfading to a **second capture**
  on hover, with the existing `P / 01` numbering, title, role · year, tagline.
- **Inside (case studies at `/work/[slug]`)** — the Dennis Snellenberg media
  pattern: a header with meta and a "Live site" pill, then a scrolling media
  stream — full-bleed browser-framed desktop captures, a recorded scroll-through
  video, a trio of phone-framed mobile captures, and staggered mid-page shots —
  closing with "Next project".

Both applied **inside the existing dark editorial identity** (bone / ink /
lime on black, JetBrains labels, Inter display). The identity is not changed.

## References

- `https://dennissnellenberg.com/work/twice` — case-study structure (meta
  header, live-site button, media stream, next case).
- `https://www.crz.studio/` — card pattern (two images per project, hover
  swap, `P / 01` index, short description).
- The four live projects already in the catalogue
  (`src/content/projects/projects.ts`):

  | slug | url |
  |---|---|
  | `anom-creative` | `https://anomcreative.com/` |
  | `fambam` | `https://fambam.vemonser7.workers.dev/` |
  | `advrt` | `https://advrt.vercel.app/` |
  | `al-ghaith` | `https://alghaithac.com/` |

## Approved decisions

1. **Keep the dark identity.** Dennis/CRZ contribute the *media presentation
   structure* only — not their light theme.
2. **Full media treatment.** Real captures: desktop screenshots (top, mid,
  end), mobile screenshots (3 screens), and one real recorded scroll-through
  video per project.
3. **CSS-built device frames**, not image mockups: a browser chrome frame
  (traffic dots + address bar showing the project's real hostname) for desktop
  captures and video; a phone bezel frame (rounded corners, notch) for mobile
  captures.
4. **Card hover swap** ≈ 400 ms crossfade — implemented with the house token
   `var(--dur-slow)` (450 ms). The audit already flagged the current 950 ms
   gradient fade as too slow and meaningless.
5. **Video**: WebM (VP8), muted, loop, `playsInline`, `preload="metadata"`,
   IntersectionObserver-driven play/pause, poster = the hero capture. Under
   reduced motion the video never plays (static poster). Size target ≤ 2 MB
   per project (scale to 1280 wide, CRF 34).
6. **Media pipeline is a re-runnable script** (`scripts/capture-work.mjs`,
   Playwright + Sharp + ffmpeg), idempotent — re-run it whenever a live site
   changes. `ffmpeg` is available at `/usr/bin/ffmpeg`.
7. **Untouched:** hero (WebGL mercury scene), about, contact, blog, navigation.
   The card's `data-compression-target="project"` contract with the hero stays.

## Data model

```ts
export type ProjectMediaBlock =
  | { kind: "browser"; src: string; alt: string }
  | { kind: "phones"; srcs: string[]; alts: string[] }
  | { kind: "video"; src: string; poster: string };

// Project gains (image/cover stay as the card's primary + fallback):
imageHover?: string;   // second card capture, revealed on hover
media: ProjectMediaBlock[];  // case-study stream, reading order
```

Per project, `media` is:

1. `browser` — `hero.webp` (homepage, desktop)
2. `video` — `scroll.webm` + poster `hero.webp`
3. `phones` — `m-1/m-2/m-3.webp` (homepage / mid-page / end-of-page, mobile)
4. `browser` — `mid-1.webp` (mid-page, desktop)
5. `browser` — `mid-2.webp` (end of page, desktop)

## Case-study composition

```
Header      title · tagline · meta (Role / Year / Stack) · "Visit site ↗" pill
Media 1     hero.webp, full-bleed, browser frame, parallax
Text        existing sections (Overview…), existing alternating alignment
Media 2     scroll.webm, full-bleed, browser frame
Media 3     phone trio (m-1/m-2/m-3), centered, middle phone raised
Media 4+    mid-1/mid-2 browser frames, alternating full-bleed / 78% offset
Close       "Visit site" link · Next project (existing NextProject)
```

## Performance

- All stills WebP (Sharp, quality 82), desktop captured at 1440×900 @2x,
  mobile at 390×844 @2x; `next/image` with `fill` + correct `sizes`.
- Video lazy by viewport (IntersectionObserver), `preload="metadata"`,
  ≤ 2 MB target.

## Acceptance criteria

1. Every card (Home selected work + `/work` archive) shows two captures and
   crossfades between them on hover/focus-visible in ~450 ms.
2. Every case study renders: browser-framed hero (address bar shows the real
   hostname), one muted looping scroll video, three phone-framed mobile
   captures, two mid-page browser frames, "Visit site" pill, Next project.
3. Video: plays only in viewport, pauses off-screen, never plays under
   `prefers-reduced-motion: reduce`.
4. No horizontal overflow at 360/390 px on any touched route.
5. `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm exec playwright test`
   all pass; evidence screenshots recorded.
6. The hero compression test (`tests/hero-liquid-compression.spec.ts`) still
   passes unchanged.

## Out of scope

Hero, about, contact, blog, navigation, footer, copywriting beyond capture
`alt`/`aria-label` descriptions, any theme/color changes.

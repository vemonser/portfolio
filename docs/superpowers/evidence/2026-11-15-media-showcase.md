# Project media showcase — verification evidence

**Date:** 2026-11-15
**Branch:** `feat/portfolio-redesign`
**Plan:** `docs/superpowers/plans/2026-11-15-project-media-showcase.md`
**Spec:** `docs/superpowers/specs/2026-11-15-project-media-showcase-design.md`
**Commits:** `5b91cd9` (capture pipeline + media), `6d5fd2a` (typed media
stream), `5123552` (card crossfade), `615a592` (case-study stream), plus the
final fixes and this evidence commit.

## Change contract

- **Scope:** project cards on Home and `/work`; case studies at
  `/work/[slug]`; a re-runnable capture pipeline and its assets.
- **Non-goals:** hero, about, contact, blog, navigation, footer, copy, theme.
- **Risk:** MEDIUM. Presentation and client islands only, but the card is
  shared by two routes and the hero has a documented compression contract.
- **Blast radius:** the card component (hero contract), the case-study page,
  `public/work`, and new client components (`ProjectVideo`, `Parallax`).
- **Rollback:** revert the four feature commits; the media directory is
  self-contained under `public/work/<slug>/`.

## Environment

- Node v26.11.1, pnpm 12.6.0
- Next.js 16.4.6 (Turbopack dev), React 19.3.0, Tailwind 4.3.3
- Playwright 1.65.0 (Chromium), Vitest 5.1.0
- Sharp 0.35.5, ffmpeg n9.0.1 at `/usr/bin/ffmpeg`
- Dev server: `pnpm dev --port 3000`

## Commands run (real exit codes)

| command | exit | result |
|---|---|---|
| `pnpm install` | 0 | already up to date |
| `pnpm capture:work` | 0 | four slugs × seven files; size table printed |
| `pnpm typecheck` | 0 | no errors |
| `pnpm lint` | 0 | no findings |
| `pnpm test` | 0 | 39/39 tests, 7 files |
| `pnpm exec playwright test` | 0 | 38/38 tests, 4 files (1.2 m) |
| `pnpm evidence` | 0 | `audit-shots/editorial/` refreshed |
| Evidence Gate validate | 0 | PASS; all six criteria backed by recorded artifacts |

Full logs from the recorded runs are under
`.quality/runs/2026-11-15T01-00-39Z/artifacts/` (local, git-ignored).

## Media budget

| project | `hero.webp` | `scroll.webm` | video duration | ≤ 2 MB |
|---|---:|---:|---:|---|
| `anom-creative` | 183,568 B | 626,796 B | 9.96 s | yes |
| `fambam` | 119,736 B | 457,114 B | 9.72 s | yes |
| `advrt` | 147,930 B | 837,520 B | 21.44 s | yes |
| `al-ghaith` | 149,090 B | 935,902 B | 23.28 s | yes |

- Desktop stills: 2880×1800 (1440×900 @2x), WebP q82.
- Mobile stills: 780×1688 (390×844 @2x), WebP q82.
- Video: VP8, 1280×800, no audio; the slow scroll loop takes longer on the
  heavier `advrt`/`al-ghaith` pages.
- Largest video: 935,902 B (0.89 MiB), under the 2,097,152 B budget.

## Acceptance criteria coverage

| id | status | proof |
|---|---|---|
| AC-01 | COVERED | e2e: card crossfade + two captures on every card on `/` and `/work`; `audit-shots/media-showcase/home-card-hover-1440.png` |
| AC-02 | COVERED | e2e: `.browser-frame` ×4, real hostname, `.phone-trio img` ×3, Visit-site pill href/target; `phone-trio-1440.png`, `phone-trio-390.png` |
| AC-03 | COVERED | e2e: muted/loop/playsinline, plays in view, pauses at footer, never plays under reduced motion; `video-playing-1440.png` |
| AC-04 | COVERED | e2e: 0 px overflow at 360/390 on `/`, `/work`, `/work/anom-creative`; `overflow-390-home.png`, `overflow-390-work.png` |
| AC-05 | COVERED | typecheck, lint, unit, full Playwright all exit 0; `pnpm evidence` refreshed `audit-shots/editorial/` |
| AC-06 | COVERED | `tests/hero-liquid-compression.spec.ts` unchanged, 7/7 pass; `hero-card-compression-1440.png` |

No criterion is `PARTIAL` or `UNCOVERED`.

## Screenshots

Refreshed by `pnpm evidence` (all widths, all routes):

- `audit-shots/editorial/{390,768,1440,1920}-home.png`
- `audit-shots/editorial/{390,768,1440,1920}-work.png`
- `audit-shots/editorial/1440-project-anom.png` (and 390)
- `audit-shots/editorial/hero-hover.png`, `reduced-motion.png`,
  `contact-states.png`, `contact-success.png`

Manual states for this feature (`audit-shots/media-showcase/`):

- `home-card-hover-1440.png` — Home card after hover; the second capture
  (`mid-1.webp`) is the visible layer.
- `phone-trio-1440.png` — case-study phone trio, middle screen raised.
- `phone-trio-390.png` — the same section at 390 px.
- `video-playing-1440.png` — the scroll recording mid-playback inside the
  browser frame.
- `overflow-390-home.png`, `overflow-390-work.png` — 390 px routes with the
  measured overflow printed as 0 by the capture script.
- `hero-card-compression-1440.png` — hero compressing around a visible
  project card (`data-compression-kind="project"`).

`audit-shots/editorial/1440-home-card-hover.png` is a pre-existing artifact
not produced by the current evidence script and is not cited as evidence.

## Review

Independent adversarial review (fresh context, full diff `86cea06..615a592`):
no Critical or High findings.

Fixed in one pass:

- The 78 %-wide mid-2 capture requested `sizes="100vw"` because the offset
  class lived on the `Reveal`, not `MediaBlock`. The offset moved onto the
  media block; the image now requests `(min-width: 1024px) 80vw, 100vw`, and
  a test pins it. Probe before the fix: `sizes=100vw`; after: `80vw`.
- AC-04 coverage was case-study-only. Added `/` and `/work` overflow tests at
  360 and 390 px.
- Added card-wide coverage (two captures on every card on both routes) and a
  reduced-motion parallax assertion (`transform: none`).

Deferred minors: `will-change-opacity` computes to `auto` (inert Tailwind
utility); `ProjectVideo` cleanup disconnects the observer without an explicit
`pause()`.

## Rulings and deviations

- **Capture viewport:** the plan's `newContext({ width, height })` is not a
  Playwright viewport option; used `viewport: DESKTOP | MOBILE`. Without it
  every still was 2560×1440. Verified 2880×1800 / 780×1688.
- **Video trim:** trim the pre-scroll idle segment (`-ss`, 0.3 s guard).
  Three sites recorded 28–54 s of loading screen and `al-ghaith` exceeded
  2 MB; the spec asks for a scroll-through and a ≤ 2 MB budget.
- **Parallax:** reduced from ±5 % / scale 1.12 to ±2 % / scale 1.04. The
  prescribed overscan cropped ~86 px per side at 1440 and cut the captures'
  own text and margins; 1.04 covers ±2 % exactly. The drift is subtler.
- **`MediaBlock.url`:** optional, because `Project.url` is optional; an
  absent URL renders an empty address bar.
- **Test typing:** `evaluate` callbacks annotated as `HTMLVideoElement`;
  Playwright otherwise infers `HTMLElement` and `pnpm typecheck` fails.
- **`BrowserFrame` content:** `relative overflow-hidden`, so the parallax
  crop clips at the content edge instead of painting over the chrome.
- **Stream grid:** `grid-cols-[minmax(0,1fr)]`; the implicit `auto` track took
  the items' 384.3 px min-content and overflowed 360/390 px by 18 px.
- **Viewport tests:** one `test.describe` per width; looped `test.use`
  options merge within a suite and both tests would run at the last width.
- **No `transform: scale()` fallback on `Parallax`:** GSAP owns `transform`
  for the yPercent scrub; the separate `scale` property is deliberate.

## Known limitations

- Captures are live-site snapshots. Re-run `pnpm capture:work` when a site
  changes; the sync test fails if the catalogue and targets drift.
- One repeat of the combined manual-capture script failed on a video timing
  wait; the criterion-specific capture script passed and its artifact is
  valid (`video-playing-1440.png`). This was a capture-tool wait, not a
  product failure.
- The Next.js dev indicator ("N") appears in screenshots taken against
  `pnpm dev`; it is not part of the production page.

## Evidence Gate

```
node /home/abdelrhman/.config/opencode/skills/software-factory/bin/evidence-gate.cjs \
  validate .quality/runs/2026-11-15T01-00-39Z/evidence-manifest.json
→ Result: PASS (exit 0)
```

The manifest and per-criterion logs are local quality artifacts (`.quality/`
is git-ignored); every cited screenshot is committed under `audit-shots/`.

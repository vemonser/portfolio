# Motion — Lottie menu icon + first-session intro

Scope: replace the CSS-drawn trigger/close marks with the supplied
`burger-menu` Lottie animation, and add a one-per-session intro overlay built
from a bespoke Lottie monogram.

Non-goals: Lottie anywhere else, copy changes, locale work, progress indicators,
external CDN assets, a loader that waits for the WebGL scene.

## Change contract

```text
SCOPE: Lottie burger icon in the site header + first-session intro overlay.
NON-GOALS: other Lottie placements, copy, i18n, progress UI, external assets.
ACCEPTANCE CRITERIA: AC-01 … AC-10 below.
AFFECTED AREAS: src/features/navigation/**, src/features/motion/**,
  src/features/intro/**, src/app/layout.tsx, src/app/globals.css, package.json,
  tests/**.
RISK: MEDIUM
BLAST RADIUS: SHARED (header on every route, root layout, new dependency)
COMMIT: 86a5ebe
BRANCH: feat/hero-c-prototype
PR: null
VALIDATION: unit (vitest), Playwright, typecheck, lint, production build,
  browser screenshots at 390/1440, reduced-motion run, Evidence Gate.
ROLLBACK/GATING: revert the commit; no runtime flag. The CSS icon remains as
  the pre-hydration fallback, so removing the player leaves a usable menu.
```

## Decisions

- `lottie-web` light SVG build, pinned; JSON bundled locally (no CDN, no fetch
  waterfall). Dynamic import keeps the player out of the first module graph.
- The supplied animation is an unzipped dotLottie. Only
  `burger-menu/animations/12345.json` is used; the manifest is not needed at
  runtime. The source folder stays untouched.
- Frames: 0 = two bars, 25 = the first frame of the authored X hold (held to
  30). Open plays 0→25 during the panel entrance; close plays 25→0 during the
  panel exit, so the close mark lands as the trigger behind it — the existing
  seamless swap is preserved.
- The icon is recolored with CSS `stroke: currentColor`, keeping the dark /
  lime / ink hover states.
- The CSS bars stay mounted until the player reports ready. A slow connection
  therefore never shows an empty menu button, and no-JS visitors keep an icon.
- Intro: ink overlay, a bespoke hairline “A” drawing in bone with a lime dot at
  the apex, and an `ABDELRHMAN` mono label. It is decorative
  (`aria-hidden`, `pointer-events: none`), runs at most 1.4s (850ms hold +
  550ms exit), and skips on the first pointer/key/scroll interaction.
- Gate: an inline head-of-body script sets `data-intro="run"` only when the key
  is absent and reduced motion is off, so the first paint is decided before
  React hydrates. The component marks the key when playback starts.
- `sessionStorage` is per tab: a new tab is a new session and will show the
  intro again. Documented, accepted.
- Reduced motion: no playback and no intro at all; the menu icon jumps between
  frames 0 and 18.

## Acceptance criteria

- AC-01 — Given any page, when the circular trigger is visible, then it renders
  the Lottie burger at rest (two bars), keeps its accessible name and
  `aria-expanded`, and hides the CSS fallback once the player is ready.
- AC-02 — Given the trigger, when the menu opens, then the close button’s mark
  morphs from bars to X during the panel entrance and settles on a clear X, and
  the dialog, focus, and scroll lock behave as before.
- AC-03 — Given the open menu, when it is closed by Escape, the close button,
  or the backdrop, then the mark morphs back to bars with the panel exit, focus
  returns to the trigger, and scroll unlocks.
- AC-04 — Given `prefers-reduced-motion: reduce`, when the menu opens or closes,
  then the mark jumps between bars and X with no playback and the state change
  is instant.
- AC-05 — Given the first visit in a session, when the page loads, then the
  intro overlay is present at the first content paint, its monogram plays once,
  and the overlay leaves within 1.6s.
- AC-06 — Given the intro is showing, when the visitor clicks, presses a key, or
  scrolls, then it leaves immediately and the interaction reaches the page.
- AC-07 — Given the intro has been shown, when the visitor reloads or navigates
  within the same session, then it does not show again.
- AC-08 — Given `prefers-reduced-motion: reduce`, when the page loads, then no
  intro overlay is shown.
- AC-09 — Given the intro has left, then the hero is visible and interactive, no
  element retains focus, and there is no horizontal overflow at 390 and 1440.
- AC-10 — Given the implementation, when static validation runs, then
  typecheck, unit tests, lint, the production build, and the existing
  Playwright navigation suite pass.

## Test scope & strategy

```text
FEATURE: Lottie menu icon + first-session intro
SCOPE: navigation marks + intro overlay only
NON-GOALS: other motion, copy, i18n
SOURCE OF TRUTH: acceptance criteria above + existing navigation behaviours
RISK: MEDIUM
BLAST RADIUS: SHARED
TEST DEPTH: STANDARD
PRIMARY FLOWS: menu open/close, reduced motion, first load, repeat load,
  skip-on-interaction
OUT-OF-SCOPE FLOWS: contact form, project media, hero shader internals
VALIDATION MODES: unit, e2e, browser, visual, static analysis
TEST DATA NEEDS: fresh Playwright context (empty sessionStorage); seeded
  sessionStorage for the existing suite via a fixture
REGRESSION AREAS: editorial-routes navigation tests, focus trap, scroll lock,
  hero-compression menu pause, contact form trigger geometry
```

## Coverage map

| Acceptance Criterion | Test Case(s) | Validation Type | Evidence | Result |
|---|---|---|---|---|
| AC-01 | motion-menu: mounts at rest; menu-rest-390.png | Playwright + screenshot | `.quality/runs/2026-11-17T02-13-07-000Z` | PASS |
| AC-02 | motion-menu: morphs on open; menu-open-390.png | Playwright + screenshot | same run | PASS |
| AC-03 | motion-menu: morphs on close; menu-close-mid-390.png | Playwright + screenshot | same run | PASS |
| AC-04 | motion-menu: reduced motion; reduced-menu-open-390.png | Playwright + screenshot | same run | PASS |
| AC-05 | motion-intro: plays once; intro-390-900ms.png | Playwright + screenshot | same run | PASS |
| AC-06 | motion-intro: skip on interaction; intro-390-450ms.png | Playwright + screenshot | same run | PASS |
| AC-07 | motion-intro: reload; menu-rest-390.png | Playwright + screenshot | same run | PASS |
| AC-08 | motion-intro: reduced motion; reduced-intro-390.png | Playwright + screenshot | same run | PASS |
| AC-09 | motion-intro: clean at 390/1440; menu-rest-1440.png | Playwright + screenshot | same run | PASS |
| AC-10 | full suite (108), typecheck, unit, lint, build | static + e2e | same run | PASS |

## Tasks

1. [x] Unit tests for the session gate and frame mapping (RED).
2. [x] Playwright specs for the menu mark and intro (RED).
3. [x] Shared Playwright fixture seeds the intro key for the existing suite.
4. [x] `lottie-web` + player hook.
5. [x] Burger icon wired into header and overlay.
6. [x] Bespoke intro Lottie JSON + overlay component + gate script.
7. [x] CSS, fallbacks, reduced motion.
8. [x] Verification, screenshots, Evidence Gate.

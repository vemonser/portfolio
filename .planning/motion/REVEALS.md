# Motion — masked image and text reveals + magnetic cursor

Scope: replace the page's entrance motion with two masked reveals and one
minimal cursor.

Non-goals: the home hero (WebGL, own reveal), the loader wordmark, the route
curtain label, header/footer/menu, form controls, copy or locale changes.

## Change contract

```text
SCOPE: masked image reveal (scaleY cover), masked text reveal (SplitText),
  one shared reveal gate, magnetic Lime cursor with a Bone lab alternative.
NON-GOALS: hero, loader, curtain, header/footer/menu, form chrome.
ACCEPTANCE CRITERIA: AC-01 … AC-08 below.
AFFECTED AREAS: src/features/motion/**, src/features/ui/{TextReveal,ImageReveal,
  Prose}.tsx, src/features/cursor/**, src/app/globals.css, page and feature
  copy across about/work/blog/contact/404, tests/**.
RISK: MEDIUM
BLAST RADIUS: SHARED (every route's content, site-wide cursor)
VALIDATION: typecheck, lint, vitest, production build, Playwright
  (reveal.spec.ts, work-media.spec.ts, lab-prototypes.spec.ts), 390/1440
  screenshots, reduced-motion and no-JS runs, Evidence Gate.
ROLLBACK/GATING: revert the commit. Reveals are progressive enhancements: the
  cover is hidden without JS and reduced motion shows the final state.
```

## Decisions

- One gate (`reveal-gate.ts`) for every reveal. It waits for
  `data-page-loader="done" | "skip"`, a curtain with `data-active != "true"`,
  then holds 200 ms. The gate re-closes when a loader or curtain starts, so a
  client navigation never animates under the wipe. A 12 s safety opens it even
  if a signal is lost.
- Images: a cover plate in the page colour collapses `scaleY: 1 → 0` with
  `transform-origin: bottom`; the media settles `scale: 1.16 → 1`. No fade, no
  translate, compositor-only. The plate is hidden unless `html[data-js="true"]`,
  so no-JS visitors see the image and JS visitors never see a full-size frame
  before the plate is armed.
- Text: SplitText with masks. Prose splits by line, display type by word; units
  start at `yPercent: 110` and rise to `0` (0.9 s, 70 ms line / 30 ms word
  stagger). `autoSplit` re-splits on font load and resize.
- The mask is a real block (`display: block` for lines, `inline-block` for
  words) with `overflow: clip`; the text inside is the same display and is
  parked one line below with `translateY(110%)`. There is no opacity anywhere:
  the mask keeps its height, so the empty line is the "before" state. The gate
  only controls when the rise starts, which leaves the empty beat after the
  loader.
- `aria: "none"` keeps the split nodes as the accessible text. `"auto"` would
  mirror the string into an `aria-label` on the wrapper and duplicate labels.
- Prose is split after hydration in a layout effect; the article is hidden
  until every block has its masks.
- Cursor: Lime is the production default: a 16 px filled disc at rest that
  expands to 64 px with the role word VIEW/PLAY/OPEN/HELLO/VISIT. Bone is the
  lab-only three-state treatment: 10 px inverted at rest, 64 px inverted for
  `data-cursor="emphasis"`, and 82 px normal-blended with an ink role word.
  Text entry keeps the native I-beam.
- Project media: cards overscan their fixed frame (`scale(1.08)`) and drift
  `yPercent: -4 → 4` with scroll (`scrub: 0.6`). Scale and travel live on
  separate nodes so GSAP cannot erase the overscan. Reduced motion rests at
  `scale(1)` with no transform.

## Acceptance criteria

- AC-01 — Given a project card, when it enters the viewport, then the cover
  collapses to `scaleY(0)` top-to-bottom and the media settles to `scale(1)`,
  with no opacity or translate on either.
- AC-02 — Given the page loader, when a reveal is armed, then it does not start
  until the loader is `done` (or `skip`) and the 200 ms hold has passed.
- AC-03 — Given a client navigation, when the route curtain is up, then the new
  page's reveals stay parked until `data-active` is no longer `"true"`.
- AC-04 — Given a paragraph, when it enters the viewport, then its masked lines
  rise from below with a 70 ms stagger; display headings split by word.
- AC-05 — Given `prefers-reduced-motion: reduce`, when a page loads, then all
  copy is visible with no masks and no cover.
- AC-06 — Given no JavaScript, when a page loads, then the cover is absent and
  the copy is visible.
- AC-07 — Given a fine pointer, when it rests, then a 16 px Lime disc follows
  it; when it enters an interactive element, the disc expands to 64 px and
  shows its role word (never an arrow underneath). The lab can switch to Bone.
- AC-08 — Given a text field, when it is hovered, then the custom cursor hides
  and the OS I-beam is used.
- AC-09 — Given a project card, when it crosses the viewport, then its capture
  drifts inside the fixed frame; reduced motion keeps it static.
- AC-10 — Given a case study with a live URL, then both Visit site actions use
  the shared masked text reveal.

## Cursor consolidation — Bone and Lime only

```text
SCOPE: keep the magnetic Bone and Lime cursors, remove every other cursor
  treatment, and make Lime the production default.
NON-GOALS: contact form, page copy, content, layout, motion outside the cursor.
ACCEPTANCE CRITERIA: CURSOR-AC-01 … CURSOR-AC-08 below.
AFFECTED AREAS: src/features/cursor/**, src/features/lab/CursorReadout.tsx,
  src/app/globals.css, tests/cursor.spec.ts, tests/lab-prototypes.spec.ts.
RISK: MEDIUM
BLAST RADIUS: SHARED (the cursor mounts on every route)
COMMIT: f58bb6a
BRANCH: main
PR: null
VALIDATION: targeted Playwright cursor suite, full Playwright suite,
  typecheck, lint, Vitest, production build, browser screenshots, independent
  review, Evidence Gate.
ROLLBACK/GATING: revert the cursor-consolidation commit. The native pointer
  remains the no-JS, touch, text-entry and unsupported-Popover fallback.
```

### Decisions

- Lime is the default treatment without a lab override. Bone is the only
  opt-in override, exposed in the lab alongside Lime.
- Both treatments keep borderless magnetic geometry and all role labels. Lime
  uses 16 → 64 px; Bone uses the three-state 10 / 64 / 82 px scale system.
- Remove the old dot/arrow swap, ring treatments, Inverse blend workaround and
  their unused tokens/DOM. The magnetic disc and its label share one normal
  blended cursor layer again.
- The lab starts on Lime, offers exactly Bone and Lime, and removes its override
  on unmount so production returns to Lime.

### Acceptance criteria

- CURSOR-AC-01 — The cursor lab exposes exactly Bone and Lime, starts on Lime,
  and no longer exposes Orbit, Lime Target, Editorial Double or Inverse.
- CURSOR-AC-02 — Production uses the Lime magnetic cursor by default: a 16 px
  lime disc at rest and a 64 px disc with the role word on interactive hover.
- CURSOR-AC-03 — Lime preserves its 16 → 64 px treatment; Bone preserves its
  colours, lag and role labels while using 10 px inverted rest, 64 px inverted
  emphasis and 82 px normal-blended label states.
- CURSOR-AC-04 — Existing cursor contracts remain intact: native-pointer
  replacement, text I-beam, disabled state, system-cursor toggle, menu top
  layer, scroll/resize role refresh, client navigation, reduced motion, touch
  and no-JavaScript fallbacks.
- CURSOR-AC-05 — A Bone selection in the lab does not leak into production;
  leaving the lab restores the default Lime treatment.
- CURSOR-AC-06 — The lab controls do not cover hero content or its focus ring,
  and they precede the demo content in keyboard order.
- CURSOR-AC-07 — On a coarse pointer, the lab reports the system cursor and
  disables controls that cannot change a custom cursor.
- CURSOR-AC-08 — A live change to reduced motion stops cursor trailing
  immediately; restoring normal motion restores the lag.

### Test scope and matrix

```text
FEATURE: cursor consolidation
SCOPE: Bone/Lime magnetic cursor and lab controls
NON-GOALS: contact form and all non-cursor behavior
SOURCE OF TRUTH: user request plus CURSOR-AC-01 … CURSOR-AC-05
RISK: MEDIUM
BLAST RADIUS: SHARED
TEST DEPTH: STANDARD
PRIMARY FLOWS: production default, lab selection, role hover, fallbacks
OUT-OF-SCOPE FLOWS: contact submission, content/case studies
VALIDATION MODES: Playwright E2E, browser visual, typecheck, lint, Vitest, build
TEST DATA NEEDS: none
REGRESSION AREAS: every route's cursor, menu/dialog stacking, text controls,
  reduced motion, touch/no-JS, client navigation
```

| ID | Acceptance criterion | Title | Preconditions | Steps | Expected result |
| --- | --- | --- | --- | --- | --- |
| CURSOR-TC-01 | CURSOR-AC-01 | Lab offers only Bone and Lime and starts on Lime | Fine pointer | Open `/lab/cursor` | One variant group; exactly Bone/Lime; Lime pressed; old options absent |
| CURSOR-TC-02 | CURSOR-AC-02 | Production defaults to Lime | Fine pointer | Open `/`; rest; hover a project card | Lime 16 px disc at rest; 64 px disc with `VIEW` on hover; no legacy nodes |
| CURSOR-TC-03 | CURSOR-AC-03 | Both magnetic variants keep their visual contract | Lab open | Select each variant; inspect rest and interactive states | Lime 16 → 64 px with 10 px label; Bone 10 / 64 / 82 px with 14 px label |
| CURSOR-TC-04 | CURSOR-AC-03 | Both variants map every interactive role | Lab open | Hover/dispatch pointerover for link, view, play, mailto and external link | `OPEN`, `VIEW`, `PLAY`, `HELLO`, `VISIT`; disc returns to 16 px on neutral surface |
| CURSOR-TC-05 | CURSOR-AC-03 | Bone inversion and Lime colour render correctly | Lab open; black/white swatches | Select each variant; move to swatch; sample centre pixel | Bone `245,241,232` on black and `10,14,23` on white; Lime `198,240,53` |
| CURSOR-TC-06 | CURSOR-AC-04 | Existing role and fallback contracts survive consolidation | Fine pointer | Exercise link/view/play/text/disabled, system toggle, menu, scroll, resize, navigation, reduced motion, touch and no-JS | Each existing contract still passes |
| CURSOR-TC-07 | CURSOR-AC-05 | Lab choice does not leak | Lab open | Select Bone; navigate home | No lab override; production disc is Lime |
| CURSOR-TC-08 | CURSOR-AC-06 | Lab controls clear hero content and precede the demo | Fine pointer | Open lab at 390/1440; inspect geometry; Tab through controls | No overlap; Scroll receives pointer; Lime/Bone precede View project |
| CURSOR-TC-09 | CURSOR-AC-07 | Touch state is honest | Coarse pointer | Open lab with touch emulation | `System · touch`; no cursor node; variant/toggle controls disabled |
| CURSOR-TC-10 | CURSOR-AC-08 | Live reduced-motion changes take effect immediately | Fine pointer | Move pointer; switch OS preference; move again | Reduced motion snaps; normal motion restores lag |

Negative coverage is CURSOR-TC-01 (removed choices are absent). Edge coverage is
CURSOR-TC-06 (text, disabled, reduced motion, touch, no-JS and viewport changes).

### Requirement-to-test coverage

| Criterion | Test case(s) | Validation type | Planned evidence | Status |
| --- | --- | --- | --- | --- |
| CURSOR-AC-01 | CURSOR-TC-01 | Playwright E2E | test report | PASS |
| CURSOR-AC-02 | CURSOR-TC-02 | Playwright E2E + visual | test report + screenshot | PASS |
| CURSOR-AC-03 | CURSOR-TC-03, CURSOR-TC-04, CURSOR-TC-05 | Playwright E2E + pixel visual | test report + screenshot | PASS |
| CURSOR-AC-04 | CURSOR-TC-06 | Playwright E2E | test report | PASS |
| CURSOR-AC-05 | CURSOR-TC-07 | Playwright E2E | test report | PASS |
| CURSOR-AC-06 | CURSOR-TC-08 | Playwright E2E + visual | test report + screenshot | PASS |
| CURSOR-AC-07 | CURSOR-TC-09 | Playwright E2E + visual | test report + screenshot | PASS |
| CURSOR-AC-08 | CURSOR-TC-10 | Playwright E2E + runtime measurement | test report + measurements | PASS |

Evidence run: `.quality/runs/2026-11-26T04-32-37-000Z/evidence-manifest.json`.
The cursor suite passes 24/24; the combined cursor, contact-form and technical
accessibility regression run passes 39/39. The full Playwright suite at the
time of the cursor-only change passed 155/163; the eight
failures are pre-existing stale hero-selector tests documented in that run's
`known-issues.md`. A later global typecheck is blocked by concurrent untracked
lab-scene work outside this change; the initial typecheck and production build
passed before those files appeared, and the final scoped cursor typecheck passes.

### Regression map

```text
CHANGED AREA: site-wide magnetic cursor and its lab controls
DIRECT CONSUMERS: RootLayout -> Cursor on every route; /lab/cursor -> CursorReadout
SHARED DEPENDENCIES: html cursor datasets, GSAP quickTo, Popover top layer,
  menu-store subscription, global cursor tokens
CRITICAL FLOWS AT RISK: project/link hover labels, text-entry I-beam, disabled
  controls, menu/dialog stacking, client navigation, reduced motion, touch/no-JS
REGRESSION TESTS TO RUN: tests/cursor.spec.ts, tests/lab-prototypes.spec.ts,
  tests/contact-form.spec.ts, tests/technical-a11y.spec.ts, full Playwright suite
UNCHANGED/SAFE AREAS: contact form implementation and layout, content, API,
  SEO, reveal system, hero scenes
```

## Requirement-to-test coverage

| Criterion | Test | Status |
| --- | --- | --- |
| AC-01 | `tests/work-media.spec.ts` image reveal | COVERED |
| AC-02 | `tests/reveal.spec.ts` loader gate | COVERED |
| AC-03 | `tests/reveal.spec.ts` route change | COVERED |
| AC-04 | `tests/reveal.spec.ts` prose + text | COVERED |
| AC-05 | `tests/reveal.spec.ts` reduced motion | COVERED |
| AC-06 | `tests/reveal.spec.ts` no-JS | COVERED |
| AC-07 | `tests/lab-prototypes.spec.ts` cursor | COVERED |
| AC-08 | `tests/lab-prototypes.spec.ts` text role | COVERED |
| AC-09 | `tests/work-media.spec.ts` project image parallax | COVERED |
| AC-10 | `tests/work-media.spec.ts` visit-site actions | COVERED |

## Bone three-state magnetic cursor

```text
SCOPE: Bone-only 10 px inverted rest, 64 px inverted emphasis, 82 px
  normal-blended role-label state; compositor scale/label transitions; manual
  emphasis attributes on selected paragraphs.
NON-GOALS: Lime visuals, contact form, copy/content changes, other cursor
  variants, new dependencies.
ACCEPTANCE CRITERIA: BONE-AC-01 … BONE-AC-05 below.
AFFECTED AREAS: src/features/cursor/**, src/features/ui/TextReveal.tsx,
  src/features/intro/IntroSection.tsx, src/app/about/page.tsx,
  src/app/work/[slug]/page.tsx, src/app/lab/cursor/page.tsx,
  src/app/globals.css, tests/cursor.spec.ts.
RISK: MEDIUM
BLAST RADIUS: SHARED (Cursor and TextReveal are shared; Bone is lab-only)
COMMIT: b988334
BRANCH: main
PR: null
VALIDATION: cursor Playwright, contact/a11y regression, scoped typecheck,
  scoped lint, Vitest, browser screenshots/pixel checks, independent review,
  Evidence Gate.
ROLLBACK/GATING: revert the Bone-motion commit; Lime production is unchanged.
```

### Acceptance criteria

- BONE-AC-01 — Bone rests as a 10 px exclusion-blended disc that inverts over
  light and dark surfaces.
- BONE-AC-02 — `data-cursor="emphasis"` expands Bone to 64 px while preserving
  exclusion blending and hiding the label.
- BONE-AC-03 — Interactive Bone roles use an 82 px normal-blended Bone disc with
  ink text for `VIEW`, `PLAY`, `OPEN`, `HELLO` and `VISIT`.
- BONE-AC-04 — Disc scale uses a 360 ms compositor transition, labels use a
  240 ms fade/scale transition, press feedback remains, and reduced motion snaps.
- BONE-AC-05 — Intro, About lead and case-study lead carry the manual emphasis
  attribute; Lime remains 16 → 64 px and the contact form is untouched.

### Test matrix

| ID | Criterion | Case | Expected |
| --- | --- | --- | --- |
| BONE-TC-01 | BONE-AC-01 | Bone rest on black and white | 10 px; pixel `245,241,232` on black and `10,14,23` on white |
| BONE-TC-02 | BONE-AC-02 | Hover `data-cursor="emphasis"` | 64 px; exclusion blend; label hidden |
| BONE-TC-03 | BONE-AC-03 | Hover every interactive role | 82 px; normal blend; correct ink label |
| BONE-TC-04 | BONE-AC-04 | Inspect computed motion and reduced-motion behavior | 360 ms scale; 240 ms label; no trailing under reduced motion |
| BONE-TC-05 | BONE-AC-05 | Inspect selected paragraphs and production Lime | Attributes present; Lime 16 → 64 px; form diff empty |

### Requirement-to-test coverage

| Criterion | Test case(s) | Validation | Status |
| --- | --- | --- | --- |
| BONE-AC-01 | BONE-TC-01 | Playwright + pixel screenshot | PASS |
| BONE-AC-02 | BONE-TC-02 | Playwright | PASS |
| BONE-AC-03 | BONE-TC-03 | Playwright | PASS |
| BONE-AC-04 | BONE-TC-04 | Playwright + computed styles | PASS |
| BONE-AC-05 | BONE-TC-05 | Playwright + diff review | PASS |

Evidence run: `.quality/runs/2026-11-26T11-08-26-000Z/evidence-manifest.json`.
The cursor suite passes 27/27. The combined cursor/contact/a11y run passed 40/41;
the one project-video `currentTime = 0` failure is outside the cursor scope and
passed 3/3 isolated reruns. Scoped typecheck and lint pass; Vitest passes 77/77.
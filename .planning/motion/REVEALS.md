# Motion — masked image and text reveals + inverting dot cursor

Scope: replace the page's entrance motion with two masked reveals and one
minimal cursor.

Non-goals: the home hero (WebGL, own reveal), the loader wordmark, the route
curtain label, header/footer/menu, form controls, copy or locale changes.

## Change contract

```text
SCOPE: masked image reveal (scaleY cover), masked text reveal (SplitText),
  one shared reveal gate, dot-only inverting cursor.
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
- Cursor: a 10 px difference-blended dot at rest; interactive roles hide the
  dot and reveal one treatment. The lab compares Orbit (30 → 72 px trailing
  ring with role words VIEW/PLAY/OPEN/HELLO/VISIT), Lime Target (lime/ink
  keyline, 44 px hover ring), Editorial Double (12 px keyed dot, 36 → 52 px
  double ring), and three magnetic variants (16 → 64 px lagging disc with role
  words): Bone, Lime and true Inverse/difference on the cursor layer. The
  Inverse label uses a separate normal-blended layer so the word stays readable
  while the disc inverts. Production uses the standalone
  arrow swap until a variant is chosen. Text entry keeps the native I-beam.
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
- AC-07 — Given a fine pointer, when it rests, then one inverting dot follows
  it; when it enters a link or project card, the dot is replaced by one arrow
  treatment (never both). The lab can switch the treatment live.
- AC-08 — Given a text field, when it is hovered, then the dot hides and the OS
  I-beam is used.
- AC-09 — Given a project card, when it crosses the viewport, then its capture
  drifts inside the fixed frame; reduced motion keeps it static.
- AC-10 — Given a case study with a live URL, then both Visit site actions use
  the shared masked text reveal.

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
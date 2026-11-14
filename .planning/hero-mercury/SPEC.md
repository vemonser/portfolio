# Hero — Mercury scene + HTML wordmark

Scope: the hero only. The scene is a screen-space mercury surface (wave
simulation + procedural metal). The wordmark is plain real HTML above the
canvas — no effect is applied to it — and hover belongs to the surface. The
rest of the page, the typography system, and the i18n content are out of
scope.

Non-goals: fixed-canvas page architecture, sections below the fold, Lenis,
ScrollTrigger, SplitText, contact form, footer.

## Acceptance criteria

- AC-01 — Given no pointer input, when the hero is idle, then the mercury field
  visibly animates at a calm pace (frames at two moments are not identical) and
  the frame is a plausible scene rather than blank or white.
- AC-02 — Given the hero is live, when the pointer is dragged across it, then
  the surface is disturbed (the frame after the drag differs substantially from
  the frame before).
- AC-03 — Given the hero is rendered, when the frame is analysed, then
  "software developer" is real HTML text, visible as a light band at the
  bottom of the screen and spanning most of the frame width.
- AC-04 — Given a mobile viewport with touch, when `/ar` loads, then the live
  scene runs on WebGL 2, touch disturbs the surface, and the Arabic wordmark
  (unsplit, so joining survives) is visible over the canvas.
- AC-05 — Given `prefers-reduced-motion: reduce`, when the hero loads, then the
  real scene renders as a single frozen frame and the canvas is the visible
  layer.
- AC-06 — Given a browser without WebGL 2, when the hero loads, then the scene
  never claims readiness and the poster image is the visible layer.
- AC-07 — Given `?t=<seconds>`, when the frame is captured twice, then the two
  captures are identical (reproducible still for the poster pipeline).
- AC-08 — Given the implementation, when static validation runs, then
  typecheck, unit tests, lint, and the production build all pass.
- AC-09 — Given the English locale, when the poster is regenerated, then the
  poster is a real capture of the live scene (the HTML wordmark is layered
  above it, not baked into it).
- AC-10 — Given any locale, when the page renders, then the hero h1 exists with
  translated text and is visible to sighted users.
- AC-11 — Given a mouse dragged across the hero, when the pointer passes over
  the wordmark, then the liquid shape is disturbed (the frame changes while
  the pointer is over the word), and the wordmark itself carries no effect (no
  filter, no transform).

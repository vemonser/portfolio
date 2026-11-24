# Not found — remove the intro, center the 404

Scope: remove the first-session “A” intro, and turn the 404 into a centered
not-found page with one bespoke Lottie mark.

Non-goals: palette/type changes, other motion placements, copy changes outside
the 404, page transitions.

## Change contract

```text
SCOPE: remove the intro overlay; center the 404; add the ring/comet Lottie mark.
NON-GOALS: other motion work, visual identity, page transitions.
ACCEPTANCE CRITERIA: AC-01 … AC-05 below.
AFFECTED AREAS: src/app/layout.tsx, src/app/not-found.tsx, src/features/intro
  (removal of SiteIntro only), src/features/not-found/**, tests/**, scripts.
RISK: MEDIUM
BLAST RADIUS: SHARED (root layout + a route)
COMMIT: bbe615a
BRANCH: feat/hero-c-prototype
PR: null
VALIDATION: Playwright (404 + full suite), typecheck, unit, lint, build,
  screenshots at 390/1440, reduced motion, Evidence Gate.
ROLLBACK/GATING: revert the commit; the intro remains in git history.
```

## Decisions

- The intro is removed completely: no component, no gate script, no session
  key, no intro test/fixture. The shared Lottie player stays for the menu and
  the new 404 mark.
- The 404 content is centered in the first viewport (`min-h-[100svh]`, flex
  column, `text-center`). The site header stays at the top; the contact CTA and
  footer remain below the fold.
- The mark is a hairline ring that draws while a lime comet makes one lap; the
  comet settles into a dot at the top. It plays once, is decorative
  (`aria-hidden`), and shows the final frame under reduced motion.
- Copy: “This page doesn't exist.” replaces the softer “has moved” line, so
  the state is explicit.
- The original burger asset and the menu mark are untouched.

## Acceptance criteria

- AC-01 — Given the first visit in a session, when the page loads, then no
  intro overlay, gate attribute, or intro session key exists.
- AC-02 — Given a missing route, when it is opened, then the response is 404
  and the 404 content is horizontally centered in the viewport at 390 and 1440.
- AC-03 — Given the 404, then the Lottie ring/comet mark renders, plays once,
  and shows a settled ring + lime dot under reduced motion.
- AC-04 — Given the 404, then the heading, the “doesn't exist” copy, and the
  Home/Work/Contact links remain, with no horizontal overflow at 390/1440.
- AC-05 — Given the implementation, when validation runs, then typecheck, unit
  tests, lint, the production build, and the full Playwright suite pass.

## Test scope

```text
FEATURE: intro removal + centered 404 with a Lottie mark
SCOPE: root layout, 404 route, not-found feature
NON-GOALS: other motion, other routes, visual identity
SOURCE OF TRUTH: the acceptance criteria above
RISK: MEDIUM
BLAST RADIUS: SHARED
TEST DEPTH: STANDARD
PRIMARY FLOWS: first load (no intro), missing route, centered mark, reduced
  motion, narrow viewport
OUT-OF-SCOPE FLOWS: contact form, work media, hero shader
VALIDATION MODES: unit, e2e, browser, visual, static analysis
TEST DATA NEEDS: a missing URL; fresh context
REGRESSION AREAS: root layout, seo 404 test, navigation tests
```

## Coverage map

| Acceptance Criterion | Test Case(s) | Validation Type | Evidence | Result |
|---|---|---|---|---|
| AC-01 | not-found: no intro node/attr/key | Playwright | test log | PENDING |
| AC-02 | not-found: 404 + centered mark | Playwright | screenshot + log | PENDING |
| AC-03 | not-found: mark + reduced motion | Playwright | screenshot + log | PENDING |
| AC-04 | not-found: copy, links, overflow | Playwright | test log | PENDING |
| AC-05 | full suite, typecheck, unit, lint, build | static + e2e | logs | PENDING |

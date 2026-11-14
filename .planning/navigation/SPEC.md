# Navigation — desktop reveal + modal menu

Scope: the site navigation only. A header that shows textual links at the top of
the page, a circular menu trigger that appears after scrolling 30% of the
viewport, and a modal menu panel that enters from the inline-end edge (right in
English, left in Arabic) with a rounded leading edge that straightens as the
panel lands. The pattern is adapted from dennissnellenberg.com; the measurement
record is in `docs/research/dennis-snellenberg-navigation.md`.

Non-goals: page content beyond navigation stubs, project case studies, footer,
contact form, social links, analytics.

## Decisions

- The menu panel direction follows the locale: `en` → enters from the right,
  `ar` → enters from the left (`html[dir]` drives it, no JS branch).
- Destinations are `/work`, `/about`, `/contact` plus home; each gets a minimal
  stub page so the menu never points at a 404.
- Strings are resolved on the server and passed as props. No
  `NextIntlClientProvider` is introduced.
- The hero WebGL scene pauses while the menu is open.

## Acceptance criteria

- AC-01 — Given any page at the top, when it renders on desktop, then the
  header shows Work / About / Contact links, and the circular menu trigger is
  not visible.
- AC-02 — Given the page scrolled past 30% of the viewport height, when the
  user stops, then the circular trigger is visible with a spring scale-in, and
  it hides again only after scrolling back above the threshold.
- AC-03 — Given the trigger, when it is activated, then a modal dialog opens:
  the panel enters from the inline-end edge, the rounded lip collapses to a
  straight edge, the four links stagger in, the backdrop fades, page scroll is
  locked, and focus moves inside the dialog.
- AC-04 — Given the open menu, when Escape, the close button, or the backdrop
  is used, then the reverse animation plays, the dialog closes, focus returns
  to the trigger, and page scroll is unlocked.
- AC-05 — Given the open menu, when the language switch is used, then the
  browser lands on the same path in the other locale.
- AC-06 — Given assistive technology or keyboard only, when navigating the
  menu, then the trigger exposes `aria-expanded`, the dialog is a native modal
  with an accessible name, focus is trapped, and every target is at least
  44×44 CSS px.
- AC-07 — Given the Arabic locale, when the menu opens, then the panel enters
  from the left, its content is mirrored, and the page has no horizontal
  overflow.
- AC-08 — Given any of the four destinations, when it is opened, then the page
  renders (no 404) with the header present.
- AC-09 — Given `prefers-reduced-motion: reduce`, when the menu opens or
  closes, then the state change is instant with no transitional motion.
- AC-10 — Given the implementation, when static validation runs, then
  typecheck, unit tests, lint, and the production build all pass.

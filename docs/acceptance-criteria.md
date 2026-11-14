# Portfolio Redesign — Acceptance Criteria

Authoritative criteria for the redesign run. Implementation plan:
`~/.opencode/plan/portfolio-redesign-PLAN.md` (copy of record kept with the
project history in `.superpowers/sdd/portfolio-redesign/progress.md`).

## AC-01 — Home composition
Given the home page, when it renders, then the order is: hero (with entrance,
meta layer and wordmark), intro section with **no** "About me" button, six
project cards in the staggered grid with a two-layer hover swap, a "See all
projects" link, a contact CTA with the real email and phone, and a footer with
Instagram / Twitter / LinkedIn plus the live Cairo clock.

## AC-02 — Work archive and case studies
Given `/work` and `/work/[slug]`, when the site is built, then all six
projects render on the index and each project has a statically generated
bilingual case-study page with role/year/stack, cover, sections and a
next-project link that wraps.

## AC-03 — Blog
Given `/blog` and `/blog/[slug]`, when the site is built, then two MDX posts
exist per locale, the index lists them newest first with formatted dates, each
post renders as prose, and Blog appears in the header, menu overlay and footer.

## AC-04 — About and contact
Given `/about` and `/contact`, when they render, then About shows the intro
copy, portrait placeholder and services grid, and Contact shows a labelled,
required form whose submit composes a `mailto:` to
`abdelrhmansamymoh@gmail.com`, alongside the direct email and phone.

## AC-05 — Bilingual and RTL
Given every route under `/en` and `/ar`, when rendered, then both locales
serve the same page structure with Arabic typography overrides (no tracking,
no uppercase) and the LinkLine underline mirrors: English enters from the
inline start and exits to the inline end; Arabic enters from the right and
exits left. No horizontal overflow at 390px.

## AC-06 — Accent
Given the token sheet, when the site renders, then `#C6F035` is the only accent
color and no `clay` token or usage remains in `src/`.

## AC-07 — Reduced motion
Given `prefers-reduced-motion: reduce`, when the page loads, then the hero
wordmark and intro content are visible immediately (no entrance choreography),
the scroll-hint pulse and scroll parallax are disabled, and the hero shows a
frozen frame instead of the live loop.

## AC-08 — Quality gates
Given the branch, when verification runs, then Vitest, ESLint, TypeScript and
`next build` all exit 0, and the build emits static routes for both locales
(home, work + 12 case-study pages, blog + 4 posts, about, contact).

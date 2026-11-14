# SDD ledger — plan: ~/.opencode/plan/portfolio-redesign-PLAN.md
Branch: feat/portfolio-redesign (baseline: 49936cb)
Pre-flight: no shared interfaces (phases share only the token sheet and content types created in Phase 4; consumers read the same modules).

## Log

Phase 1: complete (accent lime #C6F035, LinkLine/Reveal/RoundButton/SectionHeading, typecheck green)
Phase 2: complete (SiteFooter + LocalTime island + ContactCta in [locale]/layout, catalogs synced)
Ruling: grouped hero/scene tasks after home sections — page height and reveal timing are verified against real content; cost if wrong: none (independent).


Phase 4: complete (6 projects ×2 locales, crz-style cards with two-layer hover, intro without CTA, see-all link; tests 21/21; build green, 13 SSG paths)
Phase 5: complete (/work + /work/[slug], nested generateStaticParams per Next 16 docs, next-project wrap)
Ruling: catalogue as one module per locale (projects.en.ts/projects.ar.ts) instead of file-per-project — same type, fewer files; cost if wrong: none.
Ruling: catalogue tests written after implementation (characterization) — logic is mapping only; cost: low, covered by build + browser pass.


Phase 6: complete (about + contact pages, mailto compose form without backend, typecheck/lint green)


Phase 3: complete (HeroOverlay gate + hero-ready store, masked wordmark entrance, meta layer with live availability dot/scroll hint, fixed grain plate, accent sheen uniform in composite shader, warp boost + wordmark parallax on scroll; posters regenerated)
Phase 7: complete (MDX wired per Next 16 docs, 2 posts ×2 locales, blog index/post pages, Blog in nav+menu+footer)
Phase 8: complete (metadata/description for all routes, footer clock nowrap, dead stub removed)
Verification: vitest 24/24, eslint clean, tsc clean, next build clean with EN/AR static routes for work(6), blog(2), about, contact.
Browser QA (Playwright on :3000): zero console errors; card hover layerB 0→1; clock live (EET); LinkLine origins — EN enter-left/exit-right, AR enter-right/exit-left; no horizontal overflow at 390px (AR home, work, AR post); reduced-motion shows content immediately; menu opens with Blog and closes on Escape.
Ruling: pre-hydration `data-js` flag on <html> needs suppressHydrationWarning (React 19 compares extra attributes); cost if wrong: one suppression attribute.
Ruling: blog metadata kept in a typed TS registry (posts.ts), MDX files hold content only — avoids custom .mdx export typings; cost if wrong: duplicate title/date in one file per post.


Review: adversarial-reviewer — 0 Critical; HIGH scroll-write throttling fixed (rAF + 0.001 epsilon); portrait initial localized (about.initial); RoundButton arrow mirrors in RTL; socials render without target=_blank while href is "#".
Ruling: footer social hrefs stay "#" — user has not provided account URLs; no new tab so a click is harmless. Cost if wrong: dead links until URLs are filled.
Ruling: footer clock uses en-GB formatting on both locales — it is a mono system label and Arabic tz names wrap the line. Cost if wrong: Latin digits in the AR footer.
Deferred minor: Reveal uses `as never` casts for polymorphic ref/style — runtime safe, typing could be cleaner.


Final: adversarial-reviewer done; fixes committed (scroll rAF, localized initial, RTL arrow, socials placeholder).
Final: Evidence Gate PASS — .quality/runs/2026-11-14T07-15-00-000Z/evidence-manifest.json validates with no gaps (AC-01..AC-08 all PASS, real recorded exit codes).
Final: WebGL context-creation failure during repeated headless navigation surfaced an unhandled THREE error; HeroStage now catches it and falls back to the poster while still announcing hero readiness.
Final review: self-checked diff after reviewer round; no unresolved blockers.


Follow-up: work grid now 3-up and flat (no stagger), title/index on one line, description below, hairline per card (matches the provided CRZ reference); Selected work heading is a large display title with no rule; global whitespace increased (nav inset, section paddings, grid gaps); Lenis 1.3.27 installed and driven by the GSAP ticker with ScrollTrigger.update, stopped while the menu is open, disabled under reduced motion, route changes snap to top; native scrollbar hidden.
Ruling: Lenis stylesheet inlined instead of @import from node_modules — the Turbopack CSS pipeline hung compiling the package import; cost if wrong: six rules to keep in sync on upgrade.
Verification: tests 24/24, lint/typecheck/build clean; Playwright checks pass with Lenis active (lenis class present, scrollbar-width none, wheel scrolls, reduced-motion has no Lenis, no console errors, no overflow).
Evidence Gate PASS on run 2026-11-14T15-25-00-000Z (AC-01..AC-08, real exit codes).


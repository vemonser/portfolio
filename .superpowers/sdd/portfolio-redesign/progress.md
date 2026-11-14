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


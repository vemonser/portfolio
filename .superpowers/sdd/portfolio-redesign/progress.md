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


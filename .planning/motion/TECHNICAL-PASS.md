# Technical pass — accessibility, SEO, security and motion controls

## Design brief

```text
Purpose:    Close the audit's technical gaps without changing the visual identity.
Audience:   Keyboard/screen-reader users, mobile visitors, recruiters and search/social.
Tone:       Editorial Instrument — the existing black/bone/lime system.
Reference:  The live portfolio's existing hero, type and motion language.
Palette:    Existing black / ink / bone / lime tokens only.
Type:       Existing Inter + JetBrains Mono pairing; no new fonts.
Memorable:  The same hero and reveal system, now controllable and accessible.
Restraint:  No redesign, no new visual effects, no cursor changes in this pass.
```

## Token block

No new visual tokens. The pass reuses `--color-black`, `--color-ink`,
`--color-bone`, `--color-lime`, `--line-hairline`, `--space-*`, `--dur-*`,
`--ease-editorial`, `--text-t-12`, `--text-label`, `--gutter`, and the existing
44px minimum target size.

## Change contract

```text
SCOPE: skip link, route focus/announcement, persistent form live region,
  email spellcheck, mobile Contact CTA, privacy note, optional Turnstile,
  video/hero pause controls, theme color, JSON-LD, project/blog OG images,
  RSS, security headers.
NON-GOALS: copy rewrites, CV/experience content, new projects, cursor selection,
  visual redesign, performance-risk refactors.
RISK: MEDIUM
BLAST RADIUS: root layout, every route's main, contact API/form, case-study video,
  home hero, metadata and HTTP headers.
VALIDATION: Vitest, Playwright, typecheck, lint, production build, Lighthouse.
ROLLBACK/GATING: revert the commit; Turnstile stays optional behind env keys.
```

## Acceptance criteria and coverage

| Criterion | Test | Status |
| --- | --- | --- |
| Skip link is first keyboard stop and targets main | `tests/technical-a11y.spec.ts` | COVERED |
| Client navigation focuses the new main | `tests/technical-a11y.spec.ts` | COVERED |
| Form live region exists before request | `tests/technical-a11y.spec.ts` | COVERED |
| Mobile Contact CTA clears the menu trigger | `tests/technical-a11y.spec.ts` | COVERED |
| Video pause/play is keyboard accessible | `tests/technical-a11y.spec.ts` | COVERED |
| Hero motion pause/play works | `tests/technical-a11y.spec.ts` | COVERED |
| Theme color + RSS alternate | `tests/seo.spec.ts` | COVERED |
| Person/WebSite/CreativeWork/Article JSON-LD | `tests/seo.spec.ts` | COVERED |
| Project-specific OG + generated blog OG | `tests/seo.spec.ts` | COVERED |
| RSS contains all posts | `tests/seo.spec.ts` | COVERED |
| Baseline security headers | `tests/security.spec.ts` | COVERED |
| Turnstile fails closed and posts correct fields | `turnstile-server.test.ts` | COVERED |
| Contact route requires token when configured | `api/contact/route.test.ts` | COVERED |

## Evidence

- `pnpm typecheck`: pass.
- `pnpm lint`: 0 errors, 18 pre-existing warnings.
- `pnpm test`: 12 files, 60 tests passed.
- `pnpm build`: pass.
- Playwright full suite: 156 passed; 8 pre-existing failures in outdated
  `hero-home__line` / `hero-home__meta` selectors.
- Lighthouse production build:
  - Home: performance 84, accessibility 100, SEO 100, best practices 100.
  - Contact: performance 96, accessibility 100, SEO 100, best practices 100.
  - LCP 1.1s on both; CLS 0.001 / 0.011.
- Production response headers verified: CSP, HSTS, X-Content-Type-Options,
  X-Frame-Options, Referrer-Policy, Permissions-Policy; no X-Powered-By.
- Project OG assets are committed under `public/og/` and reproducible with
  `pnpm og:projects`; production smoke returned `200 image/jpeg`.
- Browser smoke at 1440/390: no console errors and no horizontal overflow.
- Evidence files: `/tmp/opencode/tech-lighthouse/`, `/tmp/opencode/tech-shots/`,
  `/tmp/opencode/tech-pw.log`.

## Environment required for spam protection

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

Without both, the form keeps its existing behaviour and mailto fallback.

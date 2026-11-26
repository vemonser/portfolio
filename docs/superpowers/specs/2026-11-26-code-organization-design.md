# Incremental code organization — design

Date: 2026-11-26  
Baseline: `c55e47f`  
Status: Proposed for review

## Context

The portfolio is already feature-based under `src/features`, but several tracked files mix many responsibilities. The largest examples are:

- `src/features/cursor/Cursor.tsx` — 370 lines combining browser gating, role resolution, pointer movement, magnetic targets, popover/menu integration, press feedback, event cleanup, and JSX.
- `src/features/contact/ContactForm.tsx` — 366 lines combining validation, submission, mailto fallback, Turnstile state, field state, and JSX.
- `src/features/hero/HeroScene.tsx` — 716 lines combining shader source, WebGL setup, pointer/puff simulation, render lifecycle, and JSX.
- `src/features/transition/RouteCurtain.tsx` — 349 lines combining path geometry, label resolution, GSAP timelines, navigation interception, popover lifecycle, and JSX.
- `src/features/navigation/MenuOverlay.tsx` — 338 lines combining dialog/focus behavior, scroll locking, menu-store synchronization, GSAP timelines, and JSX.

The user wants a gradual, feature-by-feature refactor performed with subagents and clean-code principles. Behavior and visual output must remain unchanged.

## Goals

- Make each feature understandable through a small public surface.
- Separate pure decisions from browser/React/GSAP orchestration.
- Reduce mixed-responsibility files without imposing an arbitrary line target.
- Add characterization and unit coverage around extracted decisions.
- Keep every refactor reversible with one commit per feature.
- Use independent subagents for implementation and independent review for integration.

## Non-goals

- No visual, copy, route, API, content, or dependency changes.
- No contact-form layout or interaction changes.
- No wholesale folder migration.
- No repository/service abstractions that only forward calls.
- No mandatory conversion of every GSAP effect to `useGSAP`.
- No edits to concurrent untracked `lab-scene` work until its owner explicitly includes it.

## Design principles

1. **Preserve public contracts.** Existing component props, DOM attributes, dataset names, and exported helpers used by tests remain stable.
2. **Deep modules over shallow files.** Extract a module only when it hides a decision or lifecycle that callers should not repeat.
3. **Pure cores first.** Role resolution, validation, geometry, and simulation math should be testable without a browser when practical.
4. **Thin React adapters.** Components wire refs and render markup; hooks/controllers own external-system lifecycle.
5. **No pass-through wrappers.** A file that only renames or forwards another function is not a useful boundary.
6. **Characterization before movement.** Existing behavior is captured before implementation changes.
7. **No line-count theater.** A cohesive 150-line module is acceptable; a 60-line file with two jobs is not.

## Target feature boundaries

### Cursor

- `Cursor.tsx` — refs and JSX only.
- `use-cursor.ts` — fine-pointer gating, popover/menu integration, event binding, cleanup.
- `cursor-roles.ts` — `CursorRole`, role labels, role precedence and hit-testing rules.
- `cursor-motion.ts` — GSAP pointer following, magnetic targets, press/release behavior.
- `cursor-variants.ts` — approved Lime/Bone variants and default variant.
- `cursor.css` — remains one cohesive stylesheet.

The HTML contract remains `data-cursor`, `data-cursor-state`, `data-cursor-variant`, `data-magnetic`, and the existing cursor class names.

### Contact form

- `ContactForm.tsx` — field markup and composition only.
- `use-contact-form.ts` — values, errors, status, submission, mailto fallback, Turnstile reset.
- `contact-validation.ts` — field validation and first-invalid ordering.
- Existing `Field`, `StatusMessage`, and `Turnstile` components remain unchanged.

The approved form layout and submission behavior are frozen.

### Route curtain

- `RouteCurtain.tsx` — refs and SVG/label markup.
- `route-curtain-geometry.ts` — easing, trail progress, path generation, label resolution.
- `use-route-curtain.ts` — GSAP timelines, safety timeout, click/popstate interception, popover lifecycle.

### Menu overlay

- `MenuOverlay.tsx` — dialog markup and content.
- `use-menu-dialog.ts` — open/close phase, focus return, scroll lock, pathname synchronization.
- `menu-animation.ts` — panel/lip/item GSAP timelines.

### Hero scene

- `HeroScene.tsx` — canvas refs and lifecycle adapter.
- `hero-scene/shaders.ts` — vertex/fragment shader source.
- `hero-scene/create-scene.ts` — Three.js resources, renderer, resize, render loop, disposal.
- `hero-scene/puffs.ts` — puff pool and pointer-trail simulation.
- Existing readiness and phase modules remain stable.

`HeroStage.tsx` is evaluated only after the HeroScene extraction; it is not automatically refactored.

## Testing strategy

### Characterization

Before each feature refactor:

- Run its existing Playwright coverage.
- Add tests for behavior not already protected, especially pure role/validation/geometry decisions.
- Record a green baseline.

### Unit coverage

- Cursor role precedence and labels.
- Contact validation and first-invalid field ordering.
- Curtain path/trail/easing helpers.
- Puff simulation math where it can be isolated deterministically.

### Regression coverage

- Cursor: `tests/cursor.spec.ts`, menu stacking, reduced motion, touch/no-JS.
- Contact: `tests/contact-form.spec.ts` and `tests/contact-api.spec.ts`.
- Transition/navigation: `tests/page-loader.spec.ts`, `tests/motion-menu.spec.ts`, `tests/editorial-routes.spec.ts`, `tests/technical-a11y.spec.ts`.
- Hero/media: `tests/hero-liquid-compression.spec.ts`, `tests/work-media.spec.ts`, `tests/reveal.spec.ts`, responsive overflow tests.

### Static and build checks

- Scoped typecheck and ESLint during each feature.
- Full Vitest and production build at feature milestones where the working tree is stable.
- Any failure caused by concurrent untracked work is reported separately, not hidden or "fixed" inside an unrelated refactor.

## Rollout and rollback

1. Cursor extraction.
2. Contact-form extraction without layout changes.
3. Route-curtain extraction.
4. Menu-overlay extraction.
5. Hero-scene extraction.
6. Re-evaluate HeroStage and stop if no clear responsibility win remains.

Each step:

1. Create a feature branch/worktree or isolate the subagent's file set.
2. Add characterization/unit tests.
3. Refactor.
4. Run targeted and shared regression checks.
5. Independent adversarial and interface review where UI is touched.
6. Run the Evidence Gate.
7. Commit and integrate.

Rollback is `git revert` of the feature commit. No multi-feature commit is required for safety.

## Subagent orchestration

- One implementation subagent per feature, with an explicit allowed file list.
- No two subagents edit the same file concurrently.
- The main agent reviews diffs, runs integration checks, and resolves cross-feature issues.
- A separate adversarial reviewer checks each feature before merge.
- UI-facing features also receive interface review.

## Risks and mitigations

- **Behavior drift during extraction:** characterization tests and stable public contracts.
- **Concurrent user work:** explicit file allowlists; untracked lab-scene files excluded.
- **Over-splitting:** deep-module rule and no pass-through wrappers.
- **Cross-feature regressions:** shared regression suite at each milestone.
- **Long-lived branches:** one feature at a time, small commits, prompt integration.
- **False confidence from tests alone:** independent code/interface review plus Evidence Gate.

## Acceptance criteria

- ORG-01 — Cursor responsibilities are separated behind the same public component and HTML contract, with all cursor tests passing.
- ORG-02 — Contact form logic is separated from markup without changing layout, validation, submission, or accessibility behavior.
- ORG-03 — Route curtain geometry and navigation lifecycle are separated without changing transition timing or navigation behavior.
- ORG-04 — Menu dialog lifecycle and animation are separated without changing focus, scroll lock, or keyboard behavior.
- ORG-05 — Hero shader/WebGL/puff responsibilities are separated without changing rendering, readiness, pause, or reduced-motion behavior.
- ORG-06 — Each feature has a committed, independently revertible refactor with real test/static/browser evidence and an Evidence Gate pass.
- ORG-07 — No pass-through-only modules, unrelated visual changes, or edits to excluded concurrent work are introduced.

## Open questions

None blocking. HeroStage is intentionally a post-HeroScene decision rather than a promised refactor.

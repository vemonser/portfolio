# Route curtain organization implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Separate route-curtain geometry/label resolution from GSAP/navigation lifecycle while preserving the exact wipe timing and DOM.

**Architecture:** `RouteCurtain.tsx` remains the SVG/label adapter. Add pure geometry helpers and a `useRouteCurtain` hook that owns the timeline, click/popstate interception, popover lifecycle and cleanup.

**Tech Stack:** Next.js 16, React 19, TypeScript, GSAP, Playwright, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-26-code-organization-design.md`

## Global Constraints

- No visual, copy, route, timing, dependency or API changes.
- Preserve the SVG DOM, popover behavior, label timing, safety timeout and navigation semantics.
- No edits outside each task allowlist.
- TDD and deterministic tests.
- No pass-through-only modules.

## Review Focus

- Cover → label → push → exit timing remains unchanged (Task 2/3).
- Rapid clicks while covered remain ignored (Task 2/3).
- Reduced motion and no-Popover fallback remain intact (Task 2/3).
- Back/forward and same-route clicks behave as before (Task 2/3).
- Geometry helpers are pure and unit-tested (Task 1).

---

### Task 1: Extract route-curtain geometry and label resolution

**Files:**
- Create: `src/features/transition/route-curtain-geometry.ts`
- Create: `src/features/transition/route-curtain-geometry.test.ts`

**Interfaces:**
- Exports timing constants, `easeOutExpo`, `trailProgress`, `coverPath`, `revealPath`, `labelFor`.
- `labelFor(pathname: string): string` preserves existing project/post/nav/fallback lookup.

- [ ] **Step 1:** Add failing Vitest cases for path shapes, trail progress, easing and labels for home/work/blog/nav/fallback.
- [ ] **Step 2:** Run and watch fail.
- [ ] **Step 3:** Implement the pure helpers by moving them from `RouteCurtain.tsx`.
- [ ] **Step 4:** Run and pass.
- [ ] **Step 5:** Commit.

### Task 2: Extract route-curtain lifecycle

**Files:**
- Create: `src/features/transition/use-route-curtain.ts`
- Test: `tests/page-loader.spec.ts`

**Interfaces:**
- `useRouteCurtain()` returns `rootRef`, `leadRef`, `trailRef`, `labelRef`.
- Owns GSAP context/timeline, click/popstate handlers, popover show/hide, safety timer and cleanup.

- [ ] **Step 1:** Run route transition Playwright as baseline.
- [ ] **Step 2:** Implement the hook using the geometry helpers.
- [ ] **Step 3:** Run route transition Playwright and verify pass.
- [ ] **Step 4:** Commit.

### Task 3: Slim RouteCurtain and verify

**Files:**
- Modify: `src/features/transition/RouteCurtain.tsx`
- Test: `tests/page-loader.spec.ts`, `tests/editorial-routes.spec.ts`

**Interfaces:**
- Consumes `useRouteCurtain` refs and renders the existing SVG/label markup.
- No DOM or timing change.

- [ ] **Step 1:** Replace inline orchestration with the hook.
- [ ] **Step 2:** Run route transition, navigation and a11y regression.
- [ ] **Step 3:** Capture desktop/mobile evidence and run adversarial/interface review.
- [ ] **Step 4:** Run Evidence Gate and commit review fixes.
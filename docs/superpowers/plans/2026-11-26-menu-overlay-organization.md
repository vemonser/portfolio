# Menu overlay organization implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Separate menu dialog state/focus/scroll locking from GSAP animation and markup without changing behavior.

**Architecture:** `MenuOverlay.tsx` remains the dialog/content adapter. Add `menu-animation.ts` for panel/lip/item timelines and `use-menu-dialog.ts` for phase, focus return, scroll lock, pathname synchronization and menu-store notification.

**Tech Stack:** Next.js 16, React 19, TypeScript, GSAP, Playwright, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-26-code-organization-design.md`

## Global Constraints

- No visual, copy, route, timing, dependency or API changes.
- Preserve native dialog semantics, focus trap/restore, scroll lock, Escape/outside click, menu-store notifications and reduced-motion behavior.
- No edits outside each task allowlist.
- TDD and deterministic tests; no pass-through wrappers.

## Review Focus

- Open moves focus to close and close restores trigger focus (Task 2/3).
- Scroll remains locked until exit completes (Task 2/3).
- Escape, outside click and route change close correctly (Task 2/3).
- Reduced motion opens/closes instantly (Task 2/3).
- Animation helpers are pure enough to unit-test where practical (Task 1).

---

### Task 1: Extract menu animation helpers

**Files:**
- Create: `src/features/navigation/menu-animation.ts`
- Create: `src/features/navigation/menu-animation.test.ts`

**Interfaces:**
- `animateMenuEnter({ panel, lip, items, reduced }): gsap.core.Timeline | null`
- `animateMenuExit({ panel, lip, items, reduced, onComplete }): gsap.core.Timeline | null`
- Helpers preserve existing durations, eases, transforms and reduced-motion behavior.

- [ ] **Step 1:** Add failing Vitest cases for reduced-motion null behavior and timeline creation with mock targets.
- [ ] **Step 2:** Run and watch fail.
- [ ] **Step 3:** Implement animation helpers by moving the GSAP blocks.
- [ ] **Step 4:** Run and pass.
- [ ] **Step 5:** Commit.

### Task 2: Extract menu dialog lifecycle

**Files:**
- Create: `src/features/navigation/use-menu-dialog.ts`
- Test: `tests/editorial-routes.spec.ts`

**Interfaces:**
- `useMenuDialog({ open, onClose, pathname, returnFocusRef })` returns `dialogRef`, `closeRef`, `phase`, `locked`, `handleClick`, `handleKeyDown`.
- Owns phase, focus, scroll lock, pathname close, menu-store sync and animation calls.

- [ ] **Step 1:** Run mobile drawer/menu Playwright baseline.
- [ ] **Step 2:** Implement the hook.
- [ ] **Step 3:** Run menu Playwright and verify pass.
- [ ] **Step 4:** Commit.

### Task 3: Slim MenuOverlay and verify

**Files:**
- Modify: `src/features/navigation/MenuOverlay.tsx`
- Test: `tests/editorial-routes.spec.ts`, `tests/technical-a11y.spec.ts`

**Interfaces:**
- Consumes hook return and renders existing dialog markup.
- No DOM/class/timing change.

- [ ] **Step 1:** Replace inline orchestration with hook.
- [ ] **Step 2:** Run menu, a11y and navigation regression.
- [ ] **Step 3:** Capture open/close evidence and run adversarial/interface review.
- [ ] **Step 4:** Run Evidence Gate and commit review fixes.
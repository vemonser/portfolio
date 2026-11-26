# Cursor organization and menu feedback implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Organize the cursor into deep, testable modules while preserving its public behavior, adding menu `OPEN`/`CLOSE` feedback, and removing the header “Get in touch” arrow.

**Architecture:** Keep `Cursor.tsx` as a thin React adapter. Move role resolution, approved variants, GSAP/magnetic/press motion, and browser lifecycle into focused modules under `src/features/cursor`. Preserve every existing DOM/dataset contract and add only the new menu roles.

**Tech Stack:** Next.js 16, React 19, TypeScript, GSAP 3, Playwright, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-26-code-organization-design.md`

## Global Constraints

- No contact-form layout or interaction changes.
- No edits to concurrent user work outside the active feature's explicit file allowlist.
- No dependency additions.
- Preserve existing cursor class names and `data-cursor*` / `data-magnetic` contracts.
- Lime remains the production default; Bone remains lab-only.
- No pass-through-only modules or arbitrary line-count targets.
- Every task uses TDD and ends with an independently revertible commit.

## Review Focus

- Stationary pointer while the menu opens/closes must refresh `OPEN` ↔ `CLOSE` (`tests/cursor.spec.ts`, Task 2).
- Disabled controls must keep higher priority than decorative menu/cursor roles (`src/features/cursor/cursor-roles.test.ts`, Task 2).
- Text inputs must continue to restore the OS I-beam (`tests/cursor.spec.ts`, Task 5).
- Rapid menu toggles must not leave a stale label or orphaned GSAP feedback (`tests/cursor.spec.ts`, Task 2).
- Touch and no-JavaScript visitors must keep the native pointer (`tests/cursor.spec.ts`, Task 5).

---

### Task 1: Remove the header CTA arrow

**Files:**
- Modify: `src/features/navigation/SiteHeader.tsx`
- Modify: `src/app/globals.css`
- Test: `tests/editorial-routes.spec.ts`

**Interfaces:**
- Consumes: existing header CTA link and `ctaLabel`.
- Produces: same link, accessible name and navigation target with no arrow element.

- [ ] **Step 1: Add a failing Playwright assertion**

Add a test asserting the header link named `Get in touch` contains no `svg`, while the circular contact CTA still contains no arrow.

- [ ] **Step 2: Run the test and verify it fails**

Run: `pnpm exec playwright test tests/editorial-routes.spec.ts -g "header CTA" --reporter=list`
Expected: FAIL because the header CTA still contains an SVG.

- [ ] **Step 3: Remove the arrow from the header CTA**

Remove the `ArrowUpRight` import and element from `SiteHeader.tsx`. Remove only the now-unused `.header-cta__arrow` rules from `globals.css`.

- [ ] **Step 4: Run the targeted test and verify it passes**

Run: `pnpm exec playwright test tests/editorial-routes.spec.ts -g "header CTA" --reporter=list`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/navigation/SiteHeader.tsx src/app/globals.css tests/editorial-routes.spec.ts
git commit -m "refactor(navigation): remove the header CTA arrow"
```

---

### Task 2: Extract cursor roles and add menu OPEN/CLOSE feedback

**Files:**
- Create: `src/features/cursor/cursor-roles.ts`
- Create: `src/features/cursor/cursor-roles.test.ts`
- Modify: `src/features/cursor/Cursor.tsx`
- Modify: `src/features/cursor/cursor.css`
- Test: `tests/cursor.spec.ts`

**Interfaces:**
- Produces: `type CursorRole`, `ROLE_LABELS`, `roleFromDataset(value: string | undefined): CursorRole | null`, `resolveCursorRole(node: Element, menuOpen: boolean): CursorRole`.
- `CursorRole` includes `close` in addition to existing roles; the menu trigger keeps the existing link → `OPEN` behavior.
- `ROLE_LABELS.close === "CLOSE"`.
- `.nav-close` resolves to `close` when `menuOpen` is true; `.menu-trigger` continues to resolve to `link`/`OPEN` when closed.

- [ ] **Step 1: Write failing unit tests for role mapping**

Test disabled precedence, explicit dataset roles, link/mailto/external/text mapping, and menu open/close mapping.

- [ ] **Step 2: Run unit tests and verify they fail**

Run: `pnpm exec vitest run src/features/cursor/cursor-roles.test.ts`
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement `cursor-roles.ts`**

Move the existing role union, labels, and hit-testing rules out of `Cursor.tsx`. Add only `close` and the pure `roleFromDataset` helper.

- [ ] **Step 4: Add failing Playwright coverage for live menu labels**

Assert `OPEN` over `.menu-trigger`, open the menu, assert `CLOSE` over `.nav-close`, close it, and assert `OPEN` returns. Include a stationary-pointer open/close check.

- [ ] **Step 5: Run the Playwright test and verify it fails**

Run: `pnpm exec playwright test tests/cursor.spec.ts -g "menu cursor" --reporter=list`
Expected: FAIL because menu controls currently resolve to generic `OPEN`.

- [ ] **Step 6: Wire the resolver and feedback into `Cursor.tsx`**

Use `resolveCursorRole(node, isMenuOpen())` in pointerover and refresh paths. Add `close` to the CSS interactive selectors. On role changes between the existing `link`/`OPEN` menu-trigger state and `close`/`CLOSE`, run a 180 ms GSAP scale/opacity feedback on the label without changing its final state.

- [ ] **Step 7: Run unit and Playwright tests and verify they pass**

Run:
```bash
pnpm exec vitest run src/features/cursor/cursor-roles.test.ts
pnpm exec playwright test tests/cursor.spec.ts -g "menu cursor" --reporter=list
```
Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add src/features/cursor/cursor-roles.ts src/features/cursor/cursor-roles.test.ts src/features/cursor/Cursor.tsx src/features/cursor/cursor.css tests/cursor.spec.ts
git commit -m "refactor(cursor): extract roles and add menu feedback"
```

---

### Task 3: Centralize approved cursor variants

**Files:**
- Create: `src/features/cursor/cursor-variants.ts`
- Create: `src/features/cursor/cursor-variants.test.ts`
- Modify: `src/features/lab/CursorReadout.tsx`
- Test: `tests/cursor.spec.ts`

**Interfaces:**
- Produces: `DEFAULT_CURSOR_VARIANT = "magnetic-lime"`, `CURSOR_VARIANTS`, `type CursorVariant`, `isCursorVariant(value: string | undefined): value is CursorVariant`.
- `CursorReadout` consumes these exports and keeps the same buttons, labels, order and `data-cursor-variant-option` attributes.

- [ ] **Step 1: Write failing unit tests for the variant registry**

Assert the default is Lime, the registry contains exactly Lime and Bone, and invalid values are rejected.

- [ ] **Step 2: Run unit tests and verify they fail**

Run: `pnpm exec vitest run src/features/cursor/cursor-variants.test.ts`
Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement `cursor-variants.ts` and update `CursorReadout.tsx`**

Move the registry, type, default and guard out of the lab component. Preserve all rendered output.

- [ ] **Step 4: Run unit and cursor tests and verify they pass**

Run:
```bash
pnpm exec vitest run src/features/cursor/cursor-variants.test.ts
pnpm exec playwright test tests/cursor.spec.ts -g "offers only Bone" --reporter=list
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/cursor/cursor-variants.ts src/features/cursor/cursor-variants.test.ts src/features/lab/CursorReadout.tsx tests/cursor.spec.ts
git commit -m "refactor(cursor): centralize approved variants"
```

---

### Task 4: Extract cursor motion and magnetic behavior

**Files:**
- Create: `src/features/cursor/cursor-motion.ts`
- Modify: `src/features/cursor/Cursor.tsx`
- Test: `tests/cursor.spec.ts`

**Interfaces:**
- Produces: `type CursorMotion` and `createCursorMotion(options: { cursor: HTMLElement; root: HTMLElement; reduced: MediaQueryList }): CursorMotion`.
- `CursorMotion` exposes `move(x: number, y: number): void`, `magnetize(x: number, y: number): void`, `releaseMagnets(): void`, `setPressed(pressed: boolean): void`, `destroy(): void`.
- The controller owns GSAP quickTo setup, initial positioning, magnetic target translation, press timeout/transitionend release, and tween/listener cleanup.

- [ ] **Step 1: Add failing regression coverage for motion ownership**

Keep the existing real-pointer press test and add assertions that movement, magnetic release, reduced-motion snapping and cleanup still work through the component contract.

- [ ] **Step 2: Run the motion regressions and verify the baseline is green**

Run: `pnpm exec playwright test tests/cursor.spec.ts -g "press feedback|stationary pointer|reduced motion|menu dialog" --reporter=list`
Expected: PASS before extraction.

- [ ] **Step 3: Implement `cursor-motion.ts`**

Move GSAP positioning, quickTo movement, magnetic target updates, press/release and their cleanup into the controller. Keep `data-cursor-down` as the public state contract.

- [ ] **Step 4: Replace the inline motion code in `Cursor.tsx`**

Create the controller inside the existing lifecycle and delegate movement, magnets and press state to it. Call `destroy()` during cleanup.

- [ ] **Step 5: Run motion regressions and verify they pass**

Run: `pnpm exec playwright test tests/cursor.spec.ts -g "press feedback|stationary pointer|reduced motion|menu dialog" --reporter=list`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/cursor/cursor-motion.ts src/features/cursor/Cursor.tsx tests/cursor.spec.ts
git commit -m "refactor(cursor): extract motion and magnetic behavior"
```

---

### Task 5: Extract cursor lifecycle and slim the component

**Files:**
- Create: `src/features/cursor/use-cursor.ts`
- Modify: `src/features/cursor/Cursor.tsx`
- Test: `tests/cursor.spec.ts`

**Interfaces:**
- Produces: `useCursor(): { enabled: boolean; layerRef: RefObject<HTMLDivElement | null>; cursorRef: RefObject<HTMLDivElement | null>; labelRef: RefObject<HTMLSpanElement | null> }`.
- The hook owns fine-pointer gating, popover/menu synchronization, dataset lifecycle, event listeners, role refresh and cleanup.
- `Cursor.tsx` consumes the hook and renders only the existing cursor layer/origin/disc/label markup.

- [ ] **Step 1: Add a failing structural regression test**

Assert the public DOM still has exactly one `.cursor-layer`, one `.cursor-magnetic`, one disc and one label, with no legacy nodes. Keep all existing behavior tests unchanged.

- [ ] **Step 2: Run the structural test and verify the baseline is green**

Run: `pnpm exec playwright test tests/cursor.spec.ts -g "offers only Bone|legacy" --reporter=list`
Expected: PASS before extraction.

- [ ] **Step 3: Implement `use-cursor.ts`**

Move the two effects and lifecycle orchestration into the hook. Compose `resolveCursorRole` and `createCursorMotion`; keep all dataset names and menu/popover fallbacks unchanged.

- [ ] **Step 4: Reduce `Cursor.tsx` to the adapter**

Use the returned refs and `enabled` state; remove all orchestration from the component file.

- [ ] **Step 5: Run the full cursor suite and verify it passes**

Run: `pnpm exec playwright test tests/cursor.spec.ts --reporter=list`
Expected: 27/27 PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/cursor/use-cursor.ts src/features/cursor/Cursor.tsx tests/cursor.spec.ts
git commit -m "refactor(cursor): isolate lifecycle from rendering"
```

---

### Task 6: Cursor integration review and evidence gate

**Files:**
- Modify only if review finds a concrete defect.
- Evidence: `.quality/runs/2026-11-26-cursor-org/`

**Interfaces:**
- Consumes: all modules and contracts from Tasks 1–5.
- Produces: reviewed, evidence-backed cursor refactor with no unresolved blockers.

- [ ] **Step 1: Run scoped static checks and shared regression**

Create `.quality/runs/2026-11-26-cursor-org/tsconfig.json` extending the root config with only the cursor, CursorReadout, SiteHeader and cursor test files in `include`, then run:
```bash
pnpm exec tsc --noEmit -p .quality/runs/2026-11-26-cursor-org/tsconfig.json
pnpm exec eslint src/features/cursor src/features/lab/CursorReadout.tsx src/features/navigation/SiteHeader.tsx tests/cursor.spec.ts
pnpm test
pnpm exec playwright test tests/cursor.spec.ts tests/editorial-routes.spec.ts tests/technical-a11y.spec.ts --reporter=list
```
Expected: all commands exit 0; report any unrelated concurrent-work failure separately.

- [ ] **Step 2: Capture browser evidence**

Capture 1440×900 and 390×844: menu closed with `OPEN`, menu open with `CLOSE`, Bone rest/emphasis/label, Lime rest/label, and the arrow-free header CTA.

- [ ] **Step 3: Run independent reviews**

Dispatch adversarial review for correctness/lifecycle/regressions and interface review for menu feedback, CTA appearance, keyboard/touch behavior.

- [ ] **Step 4: Fix any confirmed findings and rerun affected checks**

Do not weaken tests or change unrelated files.

- [ ] **Step 5: Record and validate the Evidence Gate**

Record real artifacts for ORG-01, ORG-08 and ORG-09. Validate until exit 0.

- [ ] **Step 6: Final integration commit if needed**

```bash
git add src/features/cursor src/features/lab/CursorReadout.tsx src/features/navigation/SiteHeader.tsx src/app/globals.css tests/cursor.spec.ts tests/editorial-routes.spec.ts
git commit -m "fix(cursor): address integration review findings"
```

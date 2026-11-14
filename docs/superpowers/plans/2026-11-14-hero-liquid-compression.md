# Hero Liquid Compression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the current mercury-based WebGL hero and layout, while adding localized liquid-compression responses to the Hero wordmark and selected-work cards in both English and Arabic.

**Architecture:** The canvas remains inside the Hero only. A small, pure interaction-state module converts DOM rectangles and pointer position into normalized compression zones; `HeroStage` measures the Hero title and project-card targets, then sends those zones to `HeroScene`. The composite shader adds a localized anisotropic compression term around the active zone, preserving the existing mercury material, ripple simulation, palette, and pointer wake rather than replacing them with a new visual system.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Three.js, GLSL, GSAP, Vitest, Playwright.

**Spec:** This plan implements the approved in-chat design: preserve the existing liquid material and layout; make the material compress around the hovered word/card; make Arabic an independently composed RTL experience; keep WebGL scoped to the Hero.

## Global Constraints

- The WebGL canvas remains inside `#hero`; it must not become a fixed page-wide background.
- The existing Mercury/Liquid material remains the primary visual language; do not replace it with geometric, particle, or solid-color effects.
- Hover behavior is **Liquid Compression**: the liquid folds and compresses toward the hovered word/card, with stronger specular response and calmer motion; it must not switch to a different material.
- English and Arabic share the Mercury material and motion timing but use independent layout, type scale, leading, and reading-direction composition.
- Preserve the current palette: black `#0b0b0a`, ink `#171614`, bone `#f5f1e8`, forest `#2f4a3c`, lime `#c6f035`, warm `#8a7f72`.
- The Hero wordmark remains real semantic HTML and the page `<h1>`; the shader must not render page text.
- No new runtime dependency is permitted.
- No source behavior may depend on the development-only Next.js Dev Tools trigger.
- Reduced motion must retain the existing frozen-frame fallback and must not run pointer-driven deformation.
- Touch/coarse-pointer visitors must not receive hover-only deformation.
- The existing Hero entrance, poster fallback, WebGL2 detection, visibility pausing, menu pausing, and context-loss fallback must continue to work.

## Review Focus

- **Off-screen project cards:** a card below the Hero must never create a visible compression zone or keep the shader active after the Hero leaves the viewport.
- **Arabic RTL geometry:** the compression axis and focus point must be mirrored correctly while remaining visually natural rather than mechanically flipped.
- **Rapid pointer/card transitions:** moving from one card to another must not leave stale compression or produce a large artificial ripple across the screen.
- **Reduced-motion and touch fallback:** frozen frames and coarse pointers must remain stable and avoid hover-only motion.
- **Resize/reflow:** title and card rectangles must update after viewport resize without stale normalized zones.

---

## File structure

- `src/features/hero-scene/compression.ts` — pure normalized compression-zone calculations; no DOM or WebGL dependencies.
- `src/features/hero-scene/compression.test.ts` — deterministic geometry tests for Hero title, card targets, RTL mirroring, and visibility filtering.
- `src/features/hero-scene/types.ts` — public `HeroScene` compression interface.
- `src/features/hero-scene/mercuryScene.ts` — stores compression-zone state, smooths transitions, and sends uniforms to the composite pass.
- `src/features/hero-scene/glsl/composite.ts` — applies anisotropic liquid compression to the existing Mercury field.
- `src/features/hero-scene/glsl/mercury.ts` — exposes a reusable folded-height helper if needed by the compression term.
- `src/features/hero/Hero.tsx` — passes locale to the Hero stage and exposes a stable wordmark target.
- `src/features/hero/HeroStage.tsx` — measures the title and project-card targets, handles pointer/focus input, and updates the scene.
- `src/features/hero/HeroOverlay.tsx` — preserves the existing first-frame entrance gate; no new state ownership.
- `src/features/work/ProjectCard.tsx` — exposes a stable `data-compression-target` target and emits no scene logic itself.
- `src/features/work/SelectedWork.tsx` — keeps project cards discoverable by the Hero stage through stable data attributes.
- `src/app/globals.css` — Arabic-specific Hero type scale/leading and any focus/target affordance needed for keyboard compression.
- `tests/hero-liquid-compression.spec.ts` — browser-level visual/behavior verification.

---

### Task 1: Pure compression-zone geometry

**Files:**
- Create: `src/features/hero-scene/compression.ts`
- Create: `src/features/hero-scene/compression.test.ts`

**Interfaces:**
- Consumes: existing `clamp(value, min, max)` from `src/features/hero-scene/math.ts`.
- Produces:
  - `type CompressionZone = { center: [number, number]; halfSize: [number, number]; direction: [number, number]; strength: number; }`
  - `type CompressionTarget = { rect: { left: number; top: number; width: number; height: number }; direction: "ltr" | "rtl"; }`
  - `compressionZone(target: CompressionTarget, viewport: { width: number; height: number }, strength: number): CompressionZone | null`
  - `activeCompressionZone(targets: CompressionTarget[], pointer: { x: number; y: number } | null, viewport: { width: number; height: number }, strength: number): CompressionZone | null`

- [ ] **Step 1: Write the failing normalization tests**

Add tests that prove:

```ts
expect(compressionZone(
  { rect: { left: 300, top: 700, width: 840, height: 120 }, direction: "ltr" },
  { width: 1440, height: 900 },
  1,
)).toEqual({
  center: [0.5, 0.8444444444],
  halfSize: [0.2916666667, 0.0666666667],
  direction: [1, 0],
  strength: 1,
});
```

Also prove:

- a zero-width or zero-height target returns `null`;
- viewport width or height of zero returns `null`;
- strength is clamped to `[0, 1]`;
- `"rtl"` produces direction `[-1, 0]`;
- a pointer selects the target whose rectangle contains the pointer;
- with `pointer: null`, no target is active;
- targets outside the viewport are ignored.

- [ ] **Step 2: Run the tests and verify they fail**

Run:

```bash
pnpm vitest run src/features/hero-scene/compression.test.ts
```

Expected: FAIL because `./compression` does not exist.

- [ ] **Step 3: Implement the pure geometry module**

Create `src/features/hero-scene/compression.ts` with the exact public interfaces above.

Normalize the rectangle into:

- `center = [(left + width / 2) / viewportWidth, (top + height / 2) / viewportHeight]`;
- `halfSize = [width / (2 * viewportWidth), height / (2 * viewportHeight)]`;
- `direction = [1, 0]` for LTR and `[-1, 0]` for RTL;
- `strength = clamp(strength, 0, 1)`.

For `activeCompressionZone`, select the containing target with the greatest requested strength; if multiple targets contain the pointer, use the nearest center as the tie-breaker.

- [ ] **Step 4: Run the focused tests**

Run:

```bash
pnpm vitest run src/features/hero-scene/compression.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run existing scene math tests**

Run:

```bash
pnpm vitest run src/features/hero-scene
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/hero-scene/compression.ts src/features/hero-scene/compression.test.ts
git commit -m "feat(hero): add liquid compression geometry"
```

---

### Task 2: Extend the scene interface without changing the material

**Files:**
- Modify: `src/features/hero-scene/types.ts`
- Modify: `src/features/hero-scene/mercuryScene.ts`

**Interfaces:**
- Consumes: `CompressionZone` from Task 1.
- Produces:
  - `HeroScene.setCompressionZone(zone: CompressionZone | null): void`
  - `HeroSceneOptions.direction?: "ltr" | "rtl"`

- [ ] **Step 1: Extend `HeroScene` and `HeroSceneOptions`**

Add the exact methods/types specified above. Keep all existing methods unchanged.

- [ ] **Step 2: Add scene state and uniforms**

In `mercuryScene.ts`, add:

```ts
const compressionUniforms = {
  uCompressionCenter: { value: new THREE.Vector2(0.5, 0.5) },
  uCompressionHalfSize: { value: new THREE.Vector2(0.2, 0.08) },
  uCompressionDirection: { value: new THREE.Vector2(1, 0) },
  uCompressionStrength: { value: 0 },
};
```

Add them to `COMPOSITE_GLSL` through the composite uniform declaration in `glsl/composite.ts`; do not add another render pass.

- [ ] **Step 3: Smooth zone changes with GSAP**

Maintain a plain `compression` object:

```ts
const compression = {
  centerX: 0.5,
  centerY: 0.5,
  halfX: 0.2,
  halfY: 0.08,
  directionX: 1,
  directionY: 0,
  strength: 0,
};
```

Use `gsap.quickTo` for `strength` with `duration: 0.35` and `ease: "power2.out"`. When a new zone arrives, animate the positional properties with `gsap.to(compression, { duration: 0.3, ease: "power2.out", ... })`. When the zone is removed, animate only `strength` to `0`; retain the last center to avoid a jump.

- [ ] **Step 4: Write the normalized values into the uniforms each frame**

In `draw()`, copy the smoothed `compression` values into the uniforms before rendering.

- [ ] **Step 5: Implement `setCompressionZone`**

Replace the current zone immediately in the state object, but let the GSAP interpolation own the visible transition. When `null` is supplied, interpolate strength to zero.

- [ ] **Step 6: Typecheck**

Run:

```bash
pnpm typecheck
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 7: Commit**

```bash
git add src/features/hero-scene/types.ts src/features/hero-scene/mercuryScene.ts src/features/hero-scene/glsl/composite.ts
git commit -m "feat(hero): add compression state to mercury scene"
```

---

### Task 3: Apply liquid compression inside the existing Mercury shader

**Files:**
- Modify: `src/features/hero-scene/glsl/composite.ts`
- Modify only if required: `src/features/hero-scene/glsl/mercury.ts`

**Interfaces:**
- Consumes: the compression uniforms from Task 2.
- Produces: a visible compression response while preserving the existing Mercury surface, environment reflections, dispersion, grain, and vignette.

- [ ] **Step 1: Add a signed-distance helper for the compressed rectangle**

In `COMPOSITE_GLSL`, add a helper that returns the normalized distance to the compression rectangle:

```glsl
float compressionDistance(vec2 p, vec2 center, vec2 halfSize) {
  vec2 d = abs(p - center) - halfSize;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
```

Adapt the input to centered/aspect-corrected coordinates so LTR and RTL zones use the same physical dimensions.

- [ ] **Step 2: Add the anisotropic fold term**

Compute a falloff that is strongest at the zone edge and fades outside it:

```glsl
float edge = 1.0 - smoothstep(0.0, 0.14, abs(compressionDistance(p, zoneCenter, zoneHalfSize)));
```

Apply the fold along `uCompressionDirection` and modulate the existing `mHeight`/`mWarp` inputs before calling `mercury(...)`. The fold must:

- pull the surface toward the target edge;
- create directional folds rather than a circular dent;
- remain zero when `uCompressionStrength == 0`;
- preserve the original Mercury color, environment, dispersion, grain, and vignette.

- [ ] **Step 3: Add a restrained specular response**

Increase the existing sheen contribution near the compressed zone by no more than `0.18` at full strength. Do not introduce a new accent color or a second material.

- [ ] **Step 4: Verify the shader compiles in the browser**

Start the dev server:

```bash
pnpm dev
```

Open `http://localhost:3000/en?t=2.4` in Playwright and assert:

```ts
expect(await page.locator("canvas").count()).toBe(1);
expect(page.url()).toContain("t=2.4");
```

Confirm no shader compilation error appears in the console.

- [ ] **Step 5: Commit**

```bash
git add src/features/hero-scene/glsl/composite.ts src/features/hero-scene/glsl/mercury.ts
git commit -m "feat(hero): compress mercury around active targets"
```

---

### Task 4: Measure and drive the Hero title compression

**Files:**
- Modify: `src/features/hero/Hero.tsx`
- Modify: `src/features/hero/HeroStage.tsx`
- Modify: `src/features/hero/HeroOverlay.tsx` only if a stable target ref requires it
- Modify: `src/app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `compressionZone`, `activeCompressionZone`, `HeroScene.setCompressionZone` from Tasks 1–2.
- Produces: Hero-title compression under pointer and keyboard focus in both locales.

- [ ] **Step 1: Pass locale explicitly to the Hero**

Change the server component to accept:

```ts
type Props = { locale: string };
export default async function Hero({ locale }: Props) {
```

Pass `locale` from `src/app/[locale]/page.tsx`.

- [ ] **Step 2: Add a stable wordmark target**

In `Hero.tsx`, add `data-hero-wordmark` to the `<h1>` and keep the existing `id="hero-title"`.

- [ ] **Step 3: Find the wordmark and optional card targets from `HeroStage`**

Inside `HeroStage`, query:

```ts
const title = section.querySelector<HTMLElement>("[data-hero-wordmark]");
const cards = section.querySelectorAll<HTMLElement>("[data-compression-target]");
```

Because the cards are outside `#hero`, query them from `document` and filter them by their current viewport intersection.

- [ ] **Step 4: Update the compression zone on pointer movement**

On `pointermove` over the Hero section:

- update the existing pointer coordinates passed to `scene.setPointer`;
- measure the wordmark rectangle;
- if the pointer is inside the wordmark rectangle, call `scene.setCompressionZone(compressionZone(...))`;
- otherwise, if a visible project card contains the pointer, call `scene.setCompressionZone(...)` for that card;
- otherwise call `scene.setCompressionZone(null)`.

Use `getBoundingClientRect()` values without transforming them through the scroll offset because the normalized zone is viewport-relative, matching the shader’s `vUv` space.

- [ ] **Step 5: Support keyboard focus compression**

Add `focusin` and `focusout` listeners on the section/document:

- when the Hero title or a visible project card receives focus, set its compression zone;
- when focus leaves, clear the zone unless the pointer is still over a valid target.

The Hero title must be focusable only if it is naturally interactive; if it is not a link or button, use `focusin` on the title’s wrapping element only when that element has a valid focus target. Otherwise provide a non-focus visual response through pointer and card hover only.

- [ ] **Step 6: Do not enable pointer compression on coarse pointers**

Guard pointer-driven compression with:

```ts
const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
```

When `canHover` is false, keep the ambient liquid behavior and do not register project-card compression.

- [ ] **Step 7: Refresh measurements on resize**

Use the existing `ResizeObserver` path or add a window `resize` listener that recomputes the active zone after layout settles. Do not use arbitrary sleeps; call the update function directly after `requestAnimationFrame`.

- [ ] **Step 8: Verify in the browser**

At 1440×900:

- hovering the English Hero title changes the shader uniforms/visible folds but does not change the title color or size;
- leaving the title returns the material to ambient motion;
- the same works in Arabic;
- keyboard focus on an interactive card activates compression.

- [ ] **Step 9: Commit**

```bash
git add src/features/hero/Hero.tsx src/features/hero/HeroStage.tsx src/features/hero/HeroOverlay.tsx src/app/[locale]/page.tsx
git commit -m "feat(hero): drive liquid compression from hero targets"
```

---

### Task 5: Expose project cards as compression targets without coupling cards to the scene

**Files:**
- Modify: `src/features/work/ProjectCard.tsx`
- Modify: `src/features/work/SelectedWork.tsx`
- Modify: `src/features/hero-scene/compression.test.ts`

**Interfaces:**
- Consumes: `CompressionTarget` from Task 1.
- Produces: stable `data-compression-target` values and locale direction metadata for each project card.

- [ ] **Step 1: Add stable target attributes**

On the `ProjectCard` root link, add:

```tsx
data-compression-target="project"
data-compression-direction={direction}
```

Pass a new `direction: "ltr" | "rtl"` prop from `SelectedWork`, derived from the existing locale (`locale === "ar" ? "rtl" : "ltr"`).

- [ ] **Step 2: Keep the card a single interaction target**

Do not add listeners or WebGL imports to `ProjectCard`. The card remains a `Link` with existing hover/focus treatment; the Hero stage discovers it by DOM attribute.

- [ ] **Step 3: Add geometry coverage for card targets**

Extend the compression tests to prove a card target produces the expected normalized center, half-size, and direction, including an Arabic card.

- [ ] **Step 4: Run focused tests and typecheck**

Run:

```bash
pnpm vitest run src/features/hero-scene/compression.test.ts
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/work/ProjectCard.tsx src/features/work/SelectedWork.tsx src/features/hero-scene/compression.test.ts
git commit -m "feat(work): expose project cards as compression targets"
```

---

### Task 6: Make the Arabic Hero an independently composed RTL version

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/features/hero/Hero.tsx`
- Modify: `src/features/hero/HeroStage.tsx`

**Interfaces:**
- Consumes: locale/direction already passed through Task 4.
- Produces: Arabic-specific Hero type scale, alignment, leading, metadata composition, and mirrored compression axis.

- [ ] **Step 1: Define Arabic Hero type values**

In the existing `html[lang="ar"] .hero-wordmark` rule, use:

```css
font-size: clamp(2.6rem, 11vw, 9rem);
line-height: 1.08;
--wordmark-drop: 0.06em;
```

Do not copy the English 8.5rem ceiling or the current 11rem Arabic ceiling.

- [ ] **Step 2: Give Arabic its own metadata composition**

In `Hero.tsx`, render the Arabic metadata order as:

1. location;
2. availability status;
3. scroll cue.

English remains:

1. availability status;
2. scroll cue;
3. location.

Use CSS logical properties or locale-conditional markup so the DOM reading order and visual order agree. Do not use `order` to create a visual order that conflicts with keyboard reading order.

- [ ] **Step 3: Align the Arabic title independently**

Arabic title alignment must be `end`/right and remain visually balanced against the right-side metadata. English remains centered only if the current approved layout is retained; if the comparison’s centered English title is adopted, use `text-align: center` for English and `text-align: right` for Arabic rather than applying one global alignment.

- [ ] **Step 4: Mirror only the directional response**

Set the scene direction from locale:

```ts
direction: locale === "ar" ? "rtl" : "ltr"
```

The shader should mirror the fold axis, not mirror the entire material lighting environment.

- [ ] **Step 5: Capture desktop and mobile visual comparisons**

At 1440×900 and 390×844, capture `/en` and `/ar` with:

- no active compression;
- pointer over the Hero title;
- pointer over the first project card while the Hero remains partially visible.

Expected: Arabic reads as a native RTL composition, not an English layout with reversed text.

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css src/features/hero/Hero.tsx src/features/hero/HeroStage.tsx
git commit -m "feat(hero): compose Arabic hero independently"
```

---

### Task 7: Protect reduced motion, touch, poster fallback, and lifecycle behavior

**Files:**
- Modify: `src/features/hero/HeroStage.tsx`
- Modify: `src/features/hero-scene/mercuryScene.ts` only if required
- Test: `tests/hero-liquid-compression.spec.ts`

**Interfaces:**
- Consumes: all prior task interfaces.
- Produces: verified fallback behavior for reduced motion, coarse pointer, WebGL1, menu-open, and context-loss conditions.

- [ ] **Step 1: Add browser-level assertions**

Create `tests/hero-liquid-compression.spec.ts` using stable user-facing selectors and data attributes. Cover:

1. `/en` and `/ar` load the Hero canvas.
2. Hovering `[data-hero-wordmark]` activates a compression target.
3. Leaving it clears the target.
4. Hovering `[data-compression-target="project"]` activates the card target when the card is visible.
5. Under `prefers-reduced-motion: reduce`, no pointer-driven zone is activated and the existing frozen frame remains.
6. With a coarse-pointer emulation, pointer-driven compression is not activated.
7. Opening the mobile menu pauses the scene.
8. No horizontal overflow is introduced at 360, 390, 768, 1024, 1280, 1440, and 1920px.

Expose testability through a small `data-compression-active="true|false"` attribute on the Hero section, updated only for diagnostics and not used for visual behavior.

- [ ] **Step 2: Run the browser test in both locales**

Run:

```bash
pnpm playwright test tests/hero-liquid-compression.spec.ts --project=chromium
```

Expected: PASS.

- [ ] **Step 3: Run the complete validation suite**

Run:

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Expected: all commands exit 0.

- [ ] **Step 4: Commit**

```bash
git add tests/hero-liquid-compression.spec.ts src/features/hero/HeroStage.tsx src/features/hero-scene/mercuryScene.ts
git commit -m "test(hero): verify liquid compression fallbacks"
```

---

### Task 8: Visual verification, artifact capture, and independent review

**Files:**
- Create: `audit-shots/hero-compression/en-1440-hero-idle.png`
- Create: `audit-shots/hero-compression/en-1440-hero-title-hover.png`
- Create: `audit-shots/hero-compression/ar-1440-hero-idle.png`
- Create: `audit-shots/hero-compression/ar-1440-hero-title-hover.png`
- Create: `audit-shots/hero-compression/en-390-hero-idle.png`
- Create: `audit-shots/hero-compression/ar-390-hero-idle.png`
- Create: `audit-shots/hero-compression/en-1440-card-hover.png`
- Create: `audit-shots/hero-compression/ar-1440-card-hover.png`
- Create: `audit-shots/hero-compression/reduced-motion-en.png`
- Create: `audit-shots/hero-compression/reduced-motion-ar.png`

**Interfaces:**
- Consumes: the completed implementation.
- Produces: visual evidence and an independent review verdict.

- [ ] **Step 1: Capture deterministic comparison frames**

Use `?t=` to freeze the ambient drift at the same time for English and Arabic, then capture idle and hover states at the same viewport dimensions.

- [ ] **Step 2: Inspect the captures**

Confirm:

- the material remains recognizably Mercury;
- hover compresses rather than changes material;
- the Hero title remains legible;
- the Arabic title and metadata are independently composed;
- the effect is restrained rather than a new full-screen animation;
- no accidental scroll jank or title movement occurs.

- [ ] **Step 3: Run an independent read-only review**

Use the `adversarial-reviewer` subagent to inspect the diff and evidence. It must not edit files. Address all CRITICAL and HIGH findings, then rerun the focused browser test and full validation suite.

- [ ] **Step 4: Commit evidence**

```bash
git add audit-shots/hero-compression
git commit -m "docs(hero): add liquid compression visual evidence"
```

## Final acceptance criteria

1. The Hero still uses the existing Mercury/Liquid material and remains the primary visual moment.
2. Hovering the Hero title compresses and folds the liquid toward the title without replacing the material.
3. Hovering a visible project card compresses the liquid around that card’s region without covering its text.
4. English and Arabic use the same Mercury material but have independently composed Hero layouts.
5. Arabic reads naturally in RTL and is not a translated English composition.
6. The WebGL canvas remains confined to `#hero`.
7. Reduced motion, coarse pointers, WebGL1 poster fallback, menu pausing, visibility pausing, and context-loss fallback remain functional.
8. No horizontal overflow appears at any requested viewport.
9. `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build` all exit 0.
10. Independent adversarial review reports no unresolved CRITICAL or HIGH findings.

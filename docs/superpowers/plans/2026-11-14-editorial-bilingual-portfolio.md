# Editorial Bilingual Portfolio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver an award-oriented editorial portfolio across every English and Arabic route, with native RTL composition, a retained Mercury/Liquid Hero with responsive compression, stronger project and editorial presentation, and verified responsive/accessibility behavior.

**Architecture:** Keep the current Next.js App Router route structure and localized content model. Introduce shared semantic UI primitives with locale-aware composition variants rather than one mirrored layout. Add a pure geometry module and uniform-driven shader compression to the existing Hero scene, then progressively rebuild each route as an editorial chapter while preserving all current text and project/blog data.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Three.js, GLSL, GSAP, Lenis, next-intl, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-11-14-editorial-bilingual-portfolio-design.md`

**Related focused plan:** `docs/superpowers/plans/2026-11-14-hero-liquid-compression.md`. Task 4 in this plan supersedes the focused plan’s implementation tasks; the focused plan remains useful as detailed shader notes but must not be executed independently.

## Global Constraints

- Preserve all existing project and blog copy, metadata, dates, stacks, and MDX content; this milestone changes presentation, not content.
- Preserve the palette: black `#0b0b0a`, ink `#171614`, bone `#f5f1e8`, forest `#2f4a3c`, lime `#c6f035`, warm `#8a7f72`.
- The Hero WebGL canvas remains inside `#hero` and keeps the existing Mercury/Liquid material.
- Hover on the Hero title or a visible project target produces Liquid Compression, not a new material or a page-wide canvas.
- English and Arabic share the content model, interaction semantics, palette, and motion vocabulary; their compositions, type scale, leading, measure, alignment, and reading order are independently designed.
- One type ratio per locale composition; maximum three font weights per locale.
- Interactive touch targets must be at least 44×44px.
- No horizontal overflow at 360, 390, 768, 1024, 1280, 1440, or 1920px.
- Reduced motion is first-class across every route.
- No new runtime dependency unless a task explicitly proves it necessary.
- The fixed mobile navigation trigger must never cover contact content or block a contact link.
- Social links must be real destinations or removed; `href="#"` may not ship.
- Do not edit the project/blog copy while implementing visual changes.
- Follow the repository’s Next.js 16 guidance in `node_modules/next/dist/docs/` before changing route APIs.

## Review Focus

- **RTL semantics and reading order:** Arabic keyboard order, visual alignment, and DOM order must agree; never use CSS `order` to hide a reversed reading sequence.
- **Fixed-control collisions:** the mobile menu trigger, drawer, floating elements, and contact content must not overlap or intercept each other.
- **Locale parity:** every route must exist in both locales with equivalent functionality, metadata, and content availability.
- **Motion degradation:** reduced motion, coarse pointers, WebGL1, and context loss must leave a complete, usable interface.
- **Long Arabic strings:** project titles, excerpts, stack labels, email, and phone must not clip, collide, or create sub-pixel overflow at 360px.
- **Editorial ordering:** the page must not visually resemble a generic template after the redesign; each chapter needs an intentional hierarchy and spatial rhythm.

---

## File structure

### New shared system files

- `src/features/ui/editorial.ts` — shared editorial tokens, type ratios, spacing values, and locale composition constants.
- `src/features/ui/editorial.test.ts` — deterministic locale/token tests.
- `src/features/ui/PageFrame.tsx` — semantic route frame with locale-aware shell and optional chapter metadata.
- `src/features/ui/ChapterLabel.tsx` — reusable section index/label with locale-aware typography.
- `src/features/ui/EditorialMedia.tsx` — project media presentation built from existing cover colors and metadata.
- `src/features/ui/ProjectIndex.tsx` — shared project-sequence data/view contract used by Home and Work.
- `src/features/ui/NextProject.tsx` — locale-aware next-project chapter link.
- `src/features/ui/PostIndex.tsx` — editorial post archive contract.
- `src/features/ui/Prose.tsx` — localized prose measure and heading rhythm wrapper.
- `src/features/ui/Field.tsx` — contact form field primitive with label, error, and description contract.
- `src/features/ui/StatusMessage.tsx` — accessible form status/error presentation.

### Hero scene files

- `src/features/hero-scene/compression.ts` — pure normalized compression geometry.
- `src/features/hero-scene/compression.test.ts` — geometry tests.
- `src/features/hero-scene/types.ts` — extended scene contract.
- `src/features/hero-scene/mercuryScene.ts` — compression state and uniforms.
- `src/features/hero-scene/glsl/composite.ts` — compression inside the existing Mercury shader.

### Route/component files to modify

- `src/app/globals.css` — design tokens, editorial utilities, Arabic compositions, responsive rules.
- `src/app/[locale]/layout.tsx` — locale-aware metadata and site shell.
- `src/app/[locale]/page.tsx` — Home composition.
- `src/app/[locale]/work/page.tsx` — Work index composition.
- `src/app/[locale]/work/[slug]/page.tsx` — project detail composition.
- `src/app/[locale]/blog/page.tsx` — blog archive composition.
- `src/app/[locale]/blog/[slug]/page.tsx` — post detail composition.
- `src/app/[locale]/about/page.tsx` — About manifesto composition.
- `src/app/[locale]/contact/page.tsx` — Contact conversion composition.
- `src/features/hero/Hero.tsx` — locale-aware Hero.
- `src/features/hero/HeroStage.tsx` — compression input and target measurement.
- `src/features/intro/IntroSection.tsx` — editorial introduction.
- `src/features/work/ProjectCard.tsx` — new project entry presentation.
- `src/features/work/SelectedWork.tsx` — Home project sequence.
- `src/features/contact-cta/ContactCta.tsx` — global contact chapter.
- `src/features/contact/ContactForm.tsx` — complete form states.
- `src/features/navigation/SiteHeader.tsx` — one navigation grammar.
- `src/features/navigation/MenuOverlay.tsx` — drawer composition and dismissal behavior.
- `src/features/footer/SiteFooter.tsx` — closing chapter and real social links.

### Test files

- `tests/editorial-routes.spec.ts` — route, locale, keyboard, overflow, and state coverage.
- `tests/hero-liquid-compression.spec.ts` — Hero shader/input/fallback coverage.
- `tests/contact-form.spec.ts` — validation, retention, and recovery coverage.

---

### Task 1: Lock the shared editorial system and locale composition rules

**Files:**
- Create: `src/features/ui/editorial.ts`
- Create: `src/features/ui/editorial.test.ts`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: existing CSS custom properties in `globals.css`.
- Produces:
  - `type Locale = "en" | "ar"`
  - `editorialType(locale: Locale): { ratio: number; displayMax: string; bodyMeasure: string; arabicLeading: number }`
  - `editorialSpace(steps: number): string`
  - `chapterNumber(index: number): string`
  - locale-scoped CSS custom properties consumed by all later tasks.

- [ ] **Step 1: Write failing token and locale tests**

Create `src/features/ui/editorial.test.ts` proving:

```ts
expect(editorialType("en")).toEqual({
  ratio: 1.25,
  displayMax: "8.5rem",
  bodyMeasure: "68ch",
  arabicLeading: 1.55,
});

expect(editorialType("ar")).toEqual({
  ratio: 1.25,
  displayMax: "9rem",
  bodyMeasure: "58ch",
  arabicLeading: 1.8,
});
```

Also prove:

- `chapterNumber(0)` returns `"01"` and `chapterNumber(9)` returns `"10"`;
- Arabic year/counter formatting uses Arabic-Indic digits;
- the space function returns only approved scale values and throws or returns a token for unsupported steps.

- [ ] **Step 2: Run the test and verify failure**

Run:

```bash
pnpm vitest run src/features/ui/editorial.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the editorial token module**

Create `src/features/ui/editorial.ts` with the exact interfaces above. Use the following scale:

- spacing: `0.5rem`, `0.75rem`, `1rem`, `1.5rem`, `2rem`, `3rem`, `4.5rem`, `7rem`, `10rem`;
- display ratio: `1.25`;
- motion durations: `200ms`, `300ms`, `450ms`, `850ms`, `1050ms`;
- easing: `cubic-bezier(0.7, 0, 0.2, 1)`.

- [ ] **Step 4: Replace raw CSS values with shared variables**

In `globals.css`, introduce named variables for:

- spacing steps;
- type steps;
- motion durations;
- edge insets;
- surface/line colors;
- focus treatment.

Do not remove existing Tailwind theme variables needed by unrelated components in this task.

- [ ] **Step 5: Run focused tests and typecheck**

Run:

```bash
pnpm vitest run src/features/ui/editorial.test.ts
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/ui/editorial.ts src/features/ui/editorial.test.ts src/app/globals.css
git commit -m "feat(ui): establish editorial design tokens"
```

---

### Task 2: Build locale-aware semantic page and chapter primitives

**Files:**
- Create: `src/features/ui/PageFrame.tsx`
- Create: `src/features/ui/ChapterLabel.tsx`
- Create: `src/features/ui/Prose.tsx`
- Modify: `src/features/ui/styles.ts`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `Locale` and editorial tokens from Task 1.
- Produces:
  - `PageFrame({ locale, children, className }: { locale: Locale; children: React.ReactNode; className?: string })`
  - `ChapterLabel({ locale, index, children }: { locale: Locale; index: number; children: React.ReactNode })`
  - `Prose({ locale, children, className }: { locale: Locale; children: React.ReactNode; className?: string })`

- [ ] **Step 1: Implement `PageFrame`**

Use one `<main>` and a locale data attribute. It must preserve `lang`/`dir` from the document and add `data-locale={locale}` for composition variants and tests.

- [ ] **Step 2: Implement `ChapterLabel`**

Render the label with an Arabic-Indic or Latin index according to locale. Use `aria-hidden` for the decorative index while keeping the visible label semantic.

- [ ] **Step 3: Implement `Prose`**

Provide a localized maximum measure, Arabic line-height, and heading rhythm. It must not alter the MDX content’s semantics.

- [ ] **Step 4: Add composition variants**

In `globals.css`, add locale-specific selectors for:

- English: editorial left-anchored opening and wide display measure;
- Arabic: right-anchored opening and narrower text measure.

Use logical properties so the implementation remains RTL-safe.

- [ ] **Step 5: Run validation**

Run:

```bash
pnpm typecheck
pnpm lint
```

Expected: both exit 0.

- [ ] **Step 6: Commit**

```bash
git add src/features/ui/PageFrame.tsx src/features/ui/ChapterLabel.tsx src/features/ui/Prose.tsx src/features/ui/styles.ts src/app/globals.css
git commit -m "feat(ui): add locale-aware editorial primitives"
```

---

### Task 3: Implement pure Hero compression geometry

**Files:**
- Create: `src/features/hero-scene/compression.ts`
- Create: `src/features/hero-scene/compression.test.ts`

**Interfaces:**
- Consumes: `clamp` from `src/features/hero-scene/math.ts`.
- Produces:
  - `type CompressionZone = { center: [number, number]; halfSize: [number, number]; direction: [number, number]; strength: number; }`
  - `type CompressionTarget = { rect: { left: number; top: number; width: number; height: number }; direction: "ltr" | "rtl"; }`
  - `compressionZone(target, viewport, strength): CompressionZone | null`
  - `activeCompressionZone(targets, pointer, viewport, strength): CompressionZone | null`

- [ ] **Step 1: Write failing geometry tests**

Prove exact normalization for a title rectangle, RTL direction, strength clamping, zero-sized viewport/target handling, pointer containment, nearest-center tie-breaking, and off-screen target rejection.

- [ ] **Step 2: Run the test and verify failure**

```bash
pnpm vitest run src/features/hero-scene/compression.test.ts
```

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement the pure module**

Normalize rectangles into viewport-relative center and half-size values. Use direction `[1, 0]` for LTR and `[-1, 0]` for RTL. Never read the DOM in this module.

- [ ] **Step 4: Run tests**

```bash
pnpm vitest run src/features/hero-scene
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/hero-scene/compression.ts src/features/hero-scene/compression.test.ts
git commit -m "feat(hero): add liquid compression geometry"
```

---

### Task 4: Add Liquid Compression to the existing Mercury Hero

**Files:**
- Modify: `src/features/hero-scene/types.ts`
- Modify: `src/features/hero-scene/mercuryScene.ts`
- Modify: `src/features/hero-scene/glsl/composite.ts`
- Modify only if needed: `src/features/hero-scene/glsl/mercury.ts`
- Modify: `src/features/hero/Hero.tsx`
- Modify: `src/features/hero/HeroStage.tsx`
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/features/work/ProjectCard.tsx`
- Modify: `src/features/work/SelectedWork.tsx`
- Test: `tests/hero-liquid-compression.spec.ts`

**Interfaces:**
- Consumes: `CompressionZone` from Task 3.
- Produces:
  - `HeroScene.setCompressionZone(zone: CompressionZone | null): void`
  - `HeroSceneOptions.direction?: "ltr" | "rtl"`
  - stable `[data-hero-wordmark]` and `[data-compression-target="project"]` attributes.

- [ ] **Step 1: Extend the scene interface and uniforms**

Add `setCompressionZone` to `HeroScene`. Add uniforms for center, half-size, direction, and strength. Copy the smoothed values into the uniforms once per frame.

- [ ] **Step 2: Smooth compression state with GSAP**

Use `quickTo` for strength (`350ms`) and `gsap.to` for positional values (`300ms`). On removal, fade strength to zero without jumping the center.

- [ ] **Step 3: Add the shader compression term**

Create a signed distance to the normalized target rectangle. Apply an anisotropic fold along the compression direction before the existing Mercury height calculation. Increase local sheen by no more than `0.18`. Preserve the existing environment, dispersion, accent, grain, vignette, and ripple behavior.

- [ ] **Step 4: Pass locale to the Hero and expose stable targets**

Pass `locale` from the page to `Hero`, then to `HeroStage` and scene options. Add `data-hero-wordmark` to the title and `data-compression-target="project"` plus `data-compression-direction` to project links.

- [ ] **Step 5: Drive compression from pointer and focus**

On fine-pointer devices, set the active zone when the pointer is over the title or a visible project card. Clear it on leave. Support keyboard focus for interactive project targets. Do not enable pointer compression under coarse pointers.

- [ ] **Step 6: Recalculate after resize**

Refresh target rectangles after viewport resize using the existing ResizeObserver/requestAnimationFrame pattern; do not use arbitrary sleeps.

- [ ] **Step 7: Write browser assertions**

Create `tests/hero-liquid-compression.spec.ts` proving:

- canvas remains inside `#hero`;
- title hover activates compression and leaving clears it;
- visible project hover activates compression;
- reduced motion does not activate pointer compression;
- coarse pointer does not activate pointer compression;
- opening the menu pauses the scene;
- no horizontal overflow appears at the required widths.

- [ ] **Step 8: Run focused and full validation**

```bash
pnpm playwright test tests/hero-liquid-compression.spec.ts --project=chromium
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Expected: all commands exit 0.

- [ ] **Step 9: Commit**

```bash
git add src/features/hero-scene src/features/hero src/features/work src/app/[locale]/page.tsx tests/hero-liquid-compression.spec.ts
git commit -m "feat(hero): compress mercury around active targets"
```

---

### Task 5: Rebuild the Home page as an editorial sequence

**Files:**
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/features/hero/Hero.tsx`
- Modify: `src/features/intro/IntroSection.tsx`
- Modify: `src/features/work/SelectedWork.tsx`
- Create: `src/features/ui/ProjectIndex.tsx`
- Create: `src/features/ui/EditorialMedia.tsx`
- Modify: `src/features/work/ProjectCard.tsx`

**Interfaces:**
- Consumes: Task 2 primitives and Task 4 compression targets.
- Produces: an editorial Home sequence with shared project-entry behavior and independent EN/AR composition.

- [ ] **Step 1: Define a shared project-entry contract**

Create `ProjectIndex` that accepts:

```ts
type ProjectIndexProps = {
  locale: Locale;
  projects: Project[];
  variant: "home" | "archive";
};
```

It renders project identity, role, year, tagline, and media without changing the underlying `Project` data.

- [ ] **Step 2: Build the richer media presentation**

Create `EditorialMedia` using the existing `cover` and `coverAlt` colors. It must create a distinct composition per project using deterministic project metadata, not random values. It may use CSS gradients and typography but must not imply unavailable real screenshots.

- [ ] **Step 3: Replace the uniform Home grid**

On Home, show an asymmetric sequence of project entries. Alternate scale and alignment using locale-specific variants rather than reflecting the same grid mechanically.

- [ ] **Step 4: Redesign the introduction**

Use one display statement, one supporting paragraph, and one metadata line. English and Arabic must use distinct measure/leading from the editorial tokens.

- [ ] **Step 5: Give the Hero an independent Arabic composition**

Set Arabic title alignment to the reading edge, use the Arabic type ceiling, and order metadata as location → availability → scroll. English retains the approved centered/editorial composition.

- [ ] **Step 6: Capture visual evidence**

Capture EN/AR Home at 390, 768, 1440, and 1920, including title-hover and card-hover states.

- [ ] **Step 7: Run validation**

```bash
pnpm typecheck
pnpm lint
pnpm build
```

Expected: all exit 0.

- [ ] **Step 8: Commit**

```bash
git add src/app/[locale]/page.tsx src/features/hero src/features/intro src/features/work src/features/ui/ProjectIndex.tsx src/features/ui/EditorialMedia.tsx
git commit -m "feat(home): build editorial bilingual sequence"
```

---

### Task 6: Redesign the Work index and project detail routes

**Files:**
- Modify: `src/app/[locale]/work/page.tsx`
- Modify: `src/app/[locale]/work/[slug]/page.tsx`
- Modify: `src/features/work/ProjectCard.tsx`
- Modify: `src/features/work/SelectedWork.tsx`
- Create: `src/features/ui/NextProject.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: `ProjectIndex`, `EditorialMedia`, and `PageFrame`.
- Produces: a project archive and cinematic project detail pages with localized metadata and next-project navigation.

- [ ] **Step 1: Redesign the Work archive**

Use the shared project-entry data but an archive-specific composition. Include project index, title, role/year, and tagline. Keep the existing order and localized copy.

- [ ] **Step 2: Redesign the project detail opening**

Render title, tagline, role, year, and stack as a project masthead. Preserve the existing section order and text.

- [ ] **Step 3: Compose the case-study sections**

Use large editorial headings and alternating content/media rhythm. Existing `Overview`, `Challenge`, and `Outcome` copy remains unchanged.

- [ ] **Step 4: Create `NextProject`**

Use the existing `getNextProject` logic. Present the next project as a full-width closing link with title, role/year, and direction-aware arrow. Verify the final project wraps to the first.

- [ ] **Step 5: Ensure Arabic detail pages are native RTL**

The masthead, stack list, section transitions, and next-project direction must follow RTL reading flow without visual reversals of geographic or directional icons.

- [ ] **Step 6: Capture evidence**

Capture both locales at 390 and 1440 for Work and at least one project detail page.

- [ ] **Step 7: Validate and commit**

```bash
pnpm typecheck
pnpm lint
pnpm build
git add src/app/[locale]/work src/features/work src/features/ui/NextProject.tsx src/app/globals.css
git commit -m "feat(work): redesign project archive and case studies"
```

---

### Task 7: Redesign Blog archive and post detail routes

**Files:**
- Modify: `src/app/[locale]/blog/page.tsx`
- Modify: `src/app/[locale]/blog/[slug]/page.tsx`
- Create: `src/features/ui/PostIndex.tsx`
- Modify: `src/features/blog/format.ts`
- Modify: `src/features/blog/format.test.ts`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: existing `BlogPost` data and `PageFrame`/`Prose`.
- Produces: an editorial archive and long-form reading layout in both locales.

- [ ] **Step 1: Extend date-format tests**

Add cases proving Arabic-Indic date formatting for Arabic and Latin formatting for English, while preserving the ISO `dateTime` attribute.

- [ ] **Step 2: Implement `PostIndex`**

Render date, title, and excerpt in an editorial sequence. Preserve the current post order and localized copy. Keep the explicit empty state.

- [ ] **Step 3: Redesign the post detail opening**

Render label, title, date, and excerpt before the MDX body. Preserve the existing MDX component unchanged.

- [ ] **Step 4: Apply localized prose rhythm**

Use `Prose` with a 60–70ch English measure and a narrower Arabic measure with increased leading. Style headings, links, lists, quotes, and code without changing MDX semantics.

- [ ] **Step 5: Capture evidence and validate**

Capture both locales at 390 and 1440 for the archive and one post detail page. Run the blog unit tests, typecheck, lint, and build.

- [ ] **Step 6: Commit**

```bash
git add src/app/[locale]/blog src/features/blog src/features/ui/PostIndex.tsx src/app/globals.css
git commit -m "feat(blog): redesign bilingual editorial reading"
```

---

### Task 8: Redesign the About route as a manifesto

**Files:**
- Modify: `src/app/[locale]/about/page.tsx`
- Create: `src/features/ui/SkillMatrix.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: existing localized About content and skills.
- Produces: a native EN/AR manifesto/capability composition.

- [ ] **Step 1: Inspect the existing About data contract**

Use the current page’s localized content and skill data without adding or rewriting copy.

- [ ] **Step 2: Implement `SkillMatrix`**

Render capability groups with locale-aware alignment. Use rows/rules rather than generic rounded cards. Maintain logical DOM order in both locales.

- [ ] **Step 3: Compose the About page**

Use a large manifesto statement, a narrative column, and the capability matrix. Break the grid deliberately once in English and independently in Arabic rather than mirroring the break position.

- [ ] **Step 4: Capture evidence and validate**

Capture both locales at 390 and 1440. Run typecheck, lint, and build.

- [ ] **Step 5: Commit**

```bash
git add src/app/[locale]/about/page.tsx src/features/ui/SkillMatrix.tsx src/app/globals.css
git commit -m "feat(about): compose bilingual manifesto"
```

---

### Task 9: Rebuild Contact and the global contact chapter

**Files:**
- Modify: `src/app/[locale]/contact/page.tsx`
- Modify: `src/features/contact/ContactForm.tsx`
- Modify: `src/features/contact-cta/ContactCta.tsx`
- Create: `src/features/ui/Field.tsx`
- Create: `src/features/ui/StatusMessage.tsx`
- Test: `tests/contact-form.spec.ts`

**Interfaces:**
- Consumes: existing contact copy, email, phone, and form fields.
- Produces: a complete conversion page with validated, recoverable form states and no fixed-control collisions.

- [ ] **Step 1: Write failing form-state tests**

Cover:

- required-field validation;
- valid email shape;
- values retained after invalid submission;
- field-level error association;
- submitting state;
- success state;
- generic failure message without stack traces or status codes.

- [ ] **Step 2: Run tests and verify failure**

```bash
pnpm playwright test tests/contact-form.spec.ts --project=chromium
```

Expected: FAIL because the new states/selectors do not exist.

- [ ] **Step 3: Implement field and status primitives**

`Field` must associate label, description, input, and error through stable IDs. `StatusMessage` must use `role="alert"` for errors and an appropriate polite/live status for success.

- [ ] **Step 4: Complete the form behavior**

Validate on blur and submit, not on every keystroke. Preserve all values on error. Keep button labels action-specific and disable only during actual submission.

- [ ] **Step 5: Redesign the Contact route**

Use a strong conversion headline, direct contact details, and a focused form. The mobile layout must reserve space for the fixed navigation trigger.

- [ ] **Step 6: Redesign the global Contact CTA**

Make it a coherent closing chapter rather than a separate floating pattern. Preserve email and phone.

- [ ] **Step 7: Verify no overlap**

At 360 and 390, assert that the email and phone links are not covered or intercepted by the fixed menu trigger in both locales.

- [ ] **Step 8: Run validation and commit**

```bash
pnpm playwright test tests/contact-form.spec.ts --project=chromium
pnpm test
pnpm typecheck
pnpm lint
pnpm build
git add src/app/[locale]/contact src/features/contact src/features/contact-cta src/features/ui/Field.tsx src/features/ui/StatusMessage.tsx tests/contact-form.spec.ts
git commit -m "feat(contact): complete bilingual conversion flow"
```

---

### Task 10: Unify navigation, mobile drawer, and footer

**Files:**
- Modify: `src/features/navigation/SiteHeader.tsx`
- Modify: `src/features/navigation/MenuOverlay.tsx`
- Modify: `src/features/footer/SiteFooter.tsx`
- Modify: `src/features/navigation/nav.ts`
- Modify: `src/app/globals.css`
- Test: `tests/editorial-routes.spec.ts`

**Interfaces:**
- Consumes: route labels and social link data.
- Produces: one coherent navigation grammar, a 44px-safe footer, and real social destinations or no social row.

- [ ] **Step 1: Write failing navigation assertions**

Prove:

- desktop nav links use localized routes;
- the language link switches locales;
- the mobile drawer opens and closes;
- Escape closes it after the close animation;
- focus remains inside the dialog while open;
- focus returns to the opener;
- background scrolling is locked;
- every visible footer/interactive link is at least 44px high;
- no link has `href="#"`;
- the fixed trigger does not overlap visible contact links.

- [ ] **Step 2: Run the assertions and verify failure**

```bash
pnpm playwright test tests/editorial-routes.spec.ts --project=chromium
```

Expected: FAIL on the current sub-44px targets/dead links and any overlap assertion.

- [ ] **Step 3: Redesign the desktop/scroll navigation state**

Use one recognizable navigation grammar. Avoid replacing a refined header with an unrelated heavy circle without a defined brand role.

- [ ] **Step 4: Refine the drawer composition**

Make the exposed strip deliberate, connect the close control visually to the panel, and preserve reliable Escape/backdrop/close behavior.

- [ ] **Step 5: Redesign the footer**

Use the existing labels and links, enlarge touch targets, and remove `href="#"` placeholders. If real social URLs are unavailable in the current project data, remove the social navigation until correct URLs exist.

- [ ] **Step 6: Run validation and commit**

```bash
pnpm playwright test tests/editorial-routes.spec.ts --project=chromium
pnpm typecheck
pnpm lint
pnpm build
git add src/features/navigation src/features/footer src/app/globals.css tests/editorial-routes.spec.ts
git commit -m "feat(nav): unify bilingual navigation and footer"
```

---

### Task 11: Establish route-wide locale parity and responsive QA

**Files:**
- Modify: `tests/editorial-routes.spec.ts`
- Modify: `src/app/[locale]/layout.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes: all previous route implementations.
- Produces: verified EN/AR route parity and responsive integrity across the full site.

- [ ] **Step 1: Add route-matrix assertions**

For each locale, visit:

- `/en`, `/ar`;
- `/en/work`, `/ar/work`;
- `/en/work/nimbus`, `/ar/work/nimbus`;
- `/en/blog`, `/ar/blog`;
- `/en/blog/two-directions`, `/ar/blog/two-directions`;
- `/en/about`, `/ar/about`;
- `/en/contact`, `/ar/contact`.

Assert:

- HTTP response is successful;
- exactly one `<h1>` exists;
- `<html lang>` and `dir` are correct;
- main/header/footer landmarks exist;
- no missing localized route or internal link;
- no horizontal overflow at 360, 390, 768, 1024, 1280, 1440, and 1920px.

- [ ] **Step 2: Add locale composition assertions**

Assert that Arabic and English are not identical mirror layouts by checking meaningful composition markers:

- Arabic `dir=rtl` and Arabic title alignment;
- distinct chapter spacing/measure values;
- correct logical reading order.

Avoid brittle pixel snapshot assertions; assert behavior and structure.

- [ ] **Step 3: Run the full route matrix**

```bash
pnpm playwright test tests/editorial-routes.spec.ts --project=chromium
```

Expected: PASS.

- [ ] **Step 4: Fix any route/layout failures at their owning task files**

Do not hide overflow with `overflow-x: hidden`; remove the source of overflow and add a regression assertion.

- [ ] **Step 5: Run complete validation**

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```

Expected: all commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add tests/editorial-routes.spec.ts src/app/[locale]/layout.tsx src/app/globals.css src/features
git commit -m "test(site): verify bilingual route parity"
```

---

### Task 12: Capture final visual evidence and independent review

**Files:**
- Create: `audit-shots/editorial/{en,ar}-{390,768,1440,1920}-*.png`
- Create: `audit-shots/editorial/reduced-motion-{en,ar}.png`
- Create: `audit-shots/editorial/hero-hover-{en,ar}.png`
- Create: `audit-shots/editorial/contact-states-{en,ar}.png`

**Interfaces:**
- Consumes: the completed implementation.
- Produces: reviewable evidence and a final independent quality verdict.

- [ ] **Step 1: Capture deterministic route evidence**

Use the existing `?t=` Hero freeze mechanism where useful. Capture idle and active states for both locales.

- [ ] **Step 2: Review against the spec**

Confirm:

- Hero is the signature moment;
- every chapter has a deliberate editorial hierarchy;
- Work no longer reads as a uniform template grid;
- project details feel like case studies;
- Blog reads as an editorial archive;
- About feels authored;
- Contact is clear and recoverable;
- Arabic reads natively at every width;
- mobile has no collisions or sub-44px primary targets.

- [ ] **Step 3: Run independent adversarial review**

Use the `adversarial-reviewer` subagent against the complete diff and evidence. It must not edit files.

- [ ] **Step 4: Resolve all critical and high findings**

Rerun the focused tests and full validation suite after each fix group.

- [ ] **Step 5: Commit final evidence**

```bash
git add audit-shots/editorial
git commit -m "docs(site): add bilingual editorial evidence"
```

## Final acceptance criteria

1. Every route exists and functions in English and Arabic.
2. The site uses one coherent editorial system with independently composed EN/AR variants.
3. The Hero keeps the Mercury/Liquid identity and adds verified Liquid Compression on title/card interaction.
4. The Home page no longer reads as a hero attached to a generic card-grid template.
5. Work, project detail, Blog, post detail, About, Contact, navigation, and footer have intentional editorial hierarchy and pacing.
6. Existing project/blog text and metadata remain unchanged.
7. The fixed mobile trigger no longer covers or intercepts contact content.
8. Every visible interactive target is at least 44px high on touch.
9. No horizontal overflow occurs at any required viewport.
10. Reduced motion and coarse-pointer fallbacks remain complete and usable.
11. `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build` exit 0.
12. Independent adversarial review reports no unresolved critical or high findings.

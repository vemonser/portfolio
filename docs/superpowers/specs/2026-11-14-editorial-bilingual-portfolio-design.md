# Editorial Bilingual Portfolio — Design Specification

**Date:** 2026-11-14  
**Status:** Approved direction  
**Scope:** All localized routes: `/en` and `/ar` for Home, Work, Project Detail, Blog, Post Detail, About, and Contact.

## 1. Purpose

Turn the current portfolio from a visually strong prototype into an editorial portfolio system that feels authored, premium, and complete. English and Arabic must share one recognizable brand while each locale reads as a native composition rather than a translated mirror.

The existing project and blog text/data remains the source of truth. Visual presentation, covers, layouts, media composition, and interaction design are free to change.

## 2. Audience and success

**Audience:** prospective clients, creative directors, and engineering collaborators evaluating the developer’s visual judgment and technical craft.

**Success:** a visitor can identify the person, understand the work, and take a meaningful next action within the first viewport and one scroll. The portfolio should feel materially authored rather than assembled from reusable templates.

## 3. Design direction

### Editorial Portfolio System

The site uses a shared content model and component vocabulary, but not a single mirrored layout.

- **Brand DNA:** black, bone, warm gray, forest green, acid lime; mercury/liquid imagery; typography with a strong editorial voice.
- **Shared behavior:** navigation model, card/link semantics, reveal timing, accessibility behavior, responsive breakpoints.
- **Independent composition:** each locale chooses alignment, grid asymmetry, reading order, measure, and spatial rhythm appropriate to its script and language.
- **Material:** the Hero’s Mercury/Liquid is the signature. The rest of the site uses restrained echoes: edge light, soft surface layers, grain, framed media, and subtle compression—not repeated full-screen effects.

## 4. Site chapters

### Hero

- Mercury/Liquid remains the signature visual.
- The title stays semantic HTML and the page `<h1>`.
- Pointer and keyboard focus compress the liquid toward the title or a visible project target.
- English and Arabic use independent title scale, alignment, metadata order, and motion timing.
- Reduced motion keeps a frozen frame; coarse pointers do not receive hover-only deformation.

### Introduction

- One large editorial statement, one supporting argument, one quiet metadata line.
- The paragraph occupies a deliberate middle typographic tier rather than being a tiny label or a display heading.
- Arabic uses independent line length and leading so the statement remains compact and balanced.

### Work index

- Not a uniform card grid. Project entries form an editorial sequence with varied scale, alternating rhythm, and deliberate negative space.
- The existing project names, taglines, roles, years, stacks, and section copy remain unchanged.
- The generated letter/gradient covers may be replaced by a richer presentation system built from the existing cover colors and project metadata.
- Hover reveals meaningful information rather than only crossfading a second gradient.

### Project detail

- A cinematic case-study sequence: project identity and metadata, Overview, Challenge, Outcome, then next-project navigation.
- The existing three sections and their copy remain unchanged.
- Presentation may use large editorial frames, asymmetrical image/media fields, and deliberate section pacing.
- Arabic composition is native RTL, not a reversed English page.

### Blog index

- The post list becomes an editorial archive with date, title, excerpt, and a clear reading rhythm.
- Existing localized post titles, excerpts, dates, and MDX content remain unchanged.
- Empty state remains explicit and localized.

### Post detail

- Strong editorial opening: title, date, excerpt, then MDX content.
- Measure, heading rhythm, code/prose distinction, and Arabic leading are independently tuned.

### About

- Position the developer through existing biography and skill/capability data.
- Avoid a generic “about page with a portrait and bullet list” structure.
- Use a manifesto/skill matrix composition with strong hierarchy and editorial pacing.

### Contact

- A strong conversion chapter rather than a generic form page.
- Keep direct email and phone access visible.
- Form states, validation, submission feedback, and error recovery must be fully designed.
- Contact content must not be covered by the fixed mobile navigation trigger.

### Navigation and footer

- One navigation grammar across desktop and mobile.
- The mobile drawer has a coherent panel composition, reliable backdrop/escape/close behavior, and focus return.
- Footer links have at least 44px touch targets.
- Social links must be real destinations or removed.

## 5. Locale architecture

Shared:

- content model and data shape;
- route structure;
- interaction and accessibility semantics;
- motion durations and easing families;
- palette and material vocabulary.

Independent:

- composition variants;
- type scale ceilings and leading;
- text measure;
- alignment and reading order;
- grid asymmetry and spatial rhythm;
- project/blog presentation details.

Arabic is not produced by applying `direction: rtl` to an English composition. The Arabic variant must be designed with RTL reading flow as its source.

## 6. System constraints

- Existing palette: black `#0b0b0a`, ink `#171614`, bone `#f5f1e8`, forest `#2f4a3c`, lime `#c6f035`, warm `#8a7f72`.
- Type system uses a maximum of three weights per locale and one type ratio per composition.
- One radius language: near-square editorial panels and circular utility controls are intentional exceptions, not random mixed radii.
- One spacing scale based on 8px with documented larger editorial steps.
- Motion: entrance 700–1050ms; interactions 200–450ms; exits faster than entrances; easing concentrated around `cubic-bezier(0.7, 0, 0.2, 1)`.
- All interactive targets are at least 44×44px on touch.
- No horizontal overflow at 360, 390, 768, 1024, 1280, 1440, or 1920px.
- Reduced motion is a first-class state.
- No new runtime dependency unless the implementation plan proves it necessary.
- No new project or blog copy in this milestone.

## 7. Hero Liquid Compression behavior

- The canvas remains inside the Hero.
- Hover compresses the existing liquid toward the active target; it does not replace the material.
- The compression is directional and anisotropic, not a circular dent.
- Specular response increases modestly near the compressed edge.
- The title remains legible throughout.
- The effect is unavailable under reduced motion and coarse pointers.

## 8. Responsive behavior

- Mobile: 360 and 390 are primary.
- Tablet: 768.
- Small desktop: 1024.
- Desktop: 1280, 1440, and 1920.
- Layouts may break the grid deliberately but must never produce accidental overflow or unreadable line lengths.
- Arabic typography gets its own optical-fit pass at every breakpoint.

## 9. Accessibility requirements

- Semantic landmarks, one `<h1>` per page, correct heading order.
- Visible `:focus-visible` states on every interactive element.
- Focus trapped inside the mobile dialog and returned to its opener.
- Text meets WCAG AA contrast in both locales.
- All icons have accessible names; decorative images use empty alt text.
- Form inputs retain values on error and expose actionable error messages.
- Motion preference is respected everywhere.

## 10. Performance requirements

- The Hero WebGL remains a single fullscreen pass and wave simulation.
- Compression uses uniforms only; no extra render passes.
- Images use explicit dimensions to avoid layout shift.
- Fonts use `display: swap` with metric-compatible fallbacks.
- No large asset or dependency is added without a measured benefit.

## 11. Validation contract

- Unit tests cover pure geometry and locale/composition decisions.
- Playwright covers locale parity, keyboard behavior, contact overlap, responsive overflow, and reduced motion.
- Visual evidence is captured for both locales at 390, 768, 1440, and 1920.
- `pnpm test`, `pnpm typecheck`, `pnpm lint`, and `pnpm build` must exit 0.
- Independent adversarial review must have no unresolved critical or high findings.

## 12. Out of scope

- Writing or replacing portfolio/project/blog copy.
- Adding real project imagery that the owner has not supplied.
- Adding new runtime dependencies without justification.
- Rewriting the MDX content.
- Redesigning server infrastructure or deployment.

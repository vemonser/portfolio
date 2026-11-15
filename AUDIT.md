# Portfolio audit — http://localhost:3000/

Auditor-only pass. No source files were edited. Screenshots: `./audit-shots/`.

**Assumptions (brief placeholders were blank, filled from `src/content/copy.ts` and `README.md`):**
- Site goal: personal portfolio for a software developer based in Cairo, for client and hiring leads.
- Audience: startup founders, agency buyers, hiring managers.
- Feel: editorial, calm, precise. Correct these if wrong; the scores depend on them.

**Method and limits:**
- Driven with Playwright (the repo's `@playwright/test`). `gsd-browser` was not used.
- Dev server (`next dev`), not a production build. Anything marked "verify" may be a dev artifact.
- Software GL (SwiftShader), so FPS and WebGL performance were not measured. CLS and axe were not run.
- Full-page captures on mobile are misleading: content is scroll-revealed, so the middle of the page renders empty. Use the viewport shots in `22-mobile-390-scroll-*.png`.

---

## 1. Verdict

The hero is the only part that feels designed: the liquid-chrome surface is distinctive, calm, and has a poster fallback and a real reduced-motion path. Everything below the hero is one flat dark template: a single sans, one lime accent, hairline rules, and no depth or pacing. The Work section (about 3,670px tall, half of each row empty) carries most of the page and is where attention drops. The hero wordmark is clipped at the fold on every width, and on mobile the fixed menu button sits on top of project copy. Fix the bugs first, then pacing, then depth. The hero is worth keeping as-is.

| Criterion | Score (1–10) | Evidence |
|---|---|---|
| Visual hierarchy & typography | 6 | Intro headline and mono chapter labels are strong (`02-scroll-1440-y900.png`). Hero wordmark clipped at fold (`02-hero-1440-settled.png`). |
| Spacing & layout rhythm | 4 | Same section inset everywhere. Work is 3,671px with alternating empty columns (`03-…y1800.png`, `04-…y2700.png`). |
| Color system & depth | 4 | Flat `#0b0b0a` below hero, one accent, no layering after the hero. Only the hero has depth. |
| Motion design | 5 | Hero surface is good. Below it, motion is just fade-in reveals. No scroll-linked moment. |
| Micro-interactions & hover | 4 | Nav = underline only. Card hover = flat grey veil (`30-hover-card1-1440.png`). Focus ring is a square box (`11-keyboard-focus-tab2-1440.png`). |
| Storytelling & content flow | 4 | Hero says "software developer"; project blurbs say "We build bold brands for disruptive companies" (`05-…y3600.png`). Positioning contradicts itself. |
| Distinctiveness | 5 | Hero is a point of view. The rest is a generic dark-editorial portfolio stack. |
| Responsive & accessibility | 6 | No horizontal overflow at 360–1920. Reduced motion works (`13-reduced-motion-1440.png`). Fixed menu covers copy and nav tap targets are 34–41px wide on mobile. |

**Overall: 5 / 10.**

---

## 1a. Acceptance criteria for this execution (AC-1 – AC-9)

These are the criteria Phases 1–2 were executed against. Each one is covered by
`tests/audit-fixes.spec.ts` unless noted, and the evidence run is recorded in
`.quality/runs/`.

| ID | Criterion |
|---|---|
| AC-1 | Given the home page, when it loads at 390/768/1440/1920, then the hero wordmark ink stops at least 6px above the fold instead of being clipped. |
| AC-2 | Given a visitor scrolling down past 30% of the viewport, when the page is being read, then the menu trigger is hidden, and it returns on scroll up. |
| AC-3 | Given the footer at 390px, when every link is measured, then each target is at least 44×44px. |
| AC-4 | Given a production first paint, when the hero poster is visible before the live scene, then no header is baked into the poster and the live header appears exactly once. |
| AC-5 | Given the home page at 1440, when the selected-work chapter is laid out, then the four projects occupy at most two rows and the chapter is under 2500px tall. |
| AC-6 | Given the contact disc, when it renders, then its label and arrow sit within 16px of each other and the block is centred within 4px of the disc centre. |
| AC-7 | Given the home page, when the work chapter opens, then it carries chapter number 02 instead of leaving a gap between 01 and 06. |
| AC-8 | Given the home page, when the work chapter ends, then the archive link carries an arrow so it reads as an action rather than body text. |
| AC-9 | Given the branch after the changes, when the quality gates run, then Vitest, TypeScript, ESLint and next build all exit 0 and the full Playwright suite passes. |

Execution status: AC-1 – AC-9 **PASS** (Evidence Gate run
`2026-11-15T02-35-34-625Z`).

---

## 2. Root causes of the "thin / unfinished" feeling (ranked)

1. **Only the hero is designed.** Everything after it is the same flat field with one sans, one lime, and hairlines. No second signature element, no layers, no texture. It reads as a template because nothing below the hero has a point of view.
2. **No pacing.** Intro, Work, and Contact use the same inset and the same rhythm. The Work section is 3,671px long and roughly half of each row is empty. There are no moments of scale change, so scrolling feels like a list rather than a sequence.
3. **Positioning contradicts itself.** The hero says "software developer"; the project blurbs read as a brand agency ("We build brand systems that think, move and evolve", "We build bold brands for disruptive companies"). A visitor does not know what the person does.
4. **Work images are boxes with nothing around them.** Cards have no caption hierarchy beyond a title, a mono tag, and a line of grey copy. The cover for project 01 is an unrelated-looking portrait with small grey overlay copy that is hard to read on the busy image.
5. **Motion stops at the hero.** Below it, the only motion is fade-in on reveal. No scroll-linked depth, no choreography, no hover system that carries the same easing across the page.
6. **Feedback is minimal.** Hover is an underline (nav) or a flat grey wash (cards). The focus ring is a sharp rectangle that does not match the circular and hairline language. The CTA circle is the only expressive control and its label is off-centre.

---

## 3. Issues list

**Status after execution:** P1-1, P1-2, P1-3, P1-4, P1-6, P2-1, P2-2 and
P2-8 are fixed on this branch — see
`docs/superpowers/evidence/2026-11-15-audit-phases-1-2.md`. P2-3 – P2-7 and
P2-9 remain open. Two findings were corrected while executing: P1-4's targets
are footer links, not header links, and P2-4 / P2-5 describe the client's own
captured content rather than our layer.

Severity: **P0** = broken for users, **P1** = visibly degrades the page or blocks a task, **P2** = polish.

### P0

_None confirmed._ The "doubled header" in the first ~300ms (below) is a P0 candidate until verified on a production build.

### P1

**P1-1 · Hero wordmark clipped at the fold, every width**
- Where: Hero, all widths (1440, 1920, 390, 768).
- Evidence: `02-hero-1440-settled.png`, `20-hero-1920.png`, `20-hero-390.png`. Measured h1 bottom at 907px in a 900px viewport at 1440.
- Problem: The bottom of "SOFTWARE DEVELOPER" is cut off by the viewport on every size. This is the name and role, the most important text on the page.
- Why it hurts: The first read is broken. A visitor sees "SOFTWARE DEVELOPE" in a hurry, and it looks unfinished rather than deliberately bled.
- Change: Keep the bleed only if it reads as deliberate. Pull the wordmark up so the full baseline and descenders sit above the fold, with the bottom crop controlled by one token (`--wordmark-drop`, already in `globals.css`), tuned per breakpoint.

**P1-2 · Fixed menu button covers project copy on mobile**
- Where: Work, 390px.
- Evidence: `22-mobile-390-scroll-03-y2400.png` (button over "Brand systems that think, move and…").
- Problem: The circular trigger is fixed top-right with no backdrop or clearance, so it sits on top of text as you scroll.
- Why it hurts: Text is unreadable under the button, and it is the only way to open the menu on mobile.
- Change: Give the trigger a surface that matches the header (solid bg or blur), or hide the trigger while the header is off-screen; add top padding to content so text never scrolls under it.

**P1-3 · Work section is 3,671px with large empty columns**
- Where: Work, 1440.
- Evidence: `03-scroll-1440-y1800.png`, `04-scroll-1440-y2700.png`. Section height from DOM: 3,671px.
- Problem: Cards alternate left and right with a wide gap, so each row is about half empty, and the section is long for six items.
- Why it hurts: Attention drops in the empty areas, and the section is the bulk of the page with no pacing.
- Change: Use a deliberate grid (for example 2 columns with a varied span for the feature project and consistent heights for the rest) so each row is filled. Cap the section height and let one project breathe at full width.

**P1-4 · Touch targets under 44px on mobile nav**
- Where: Header, 360 and 390 widths.
- Evidence: measured `Work` 41×44 and `Blog` 34×44 in the header nav (`20-hero-390.png`).
- Problem: Nav links are narrower than 44px. Horizontal touch target is 34px for "Blog".
- Why it hurts: Mis-taps on a primary nav.
- Change: Add horizontal padding to each link so the hit area is at least 44×44, without changing the visual spacing.

**P1-5 · Menu trigger not in tab order until the page scrolls (verify)**
- Where: Header, desktop and tablet.
- Evidence: At 768+ the trigger has `width: 0` at the top (measured). Tab order from top does not include it (tab sequence logged).
- Problem: The trigger is hidden until about 30% scroll. Keyboard users at the top cannot reach it. Header links cover navigation, so this is not a blocker, but it is inconsistent.
- Why it hurts: Keyboard users see a different control set depending on scroll position.
- Change: Keep the trigger hidden visually, but make the state consistent (for example, always present in the tab order and visible on focus), or accept and document it. Verify with a scrolled-tab test before fixing.

**P1-6 · Doubled header and stray "العربية" label for the first ~300ms (verify on production build)**
- Where: Header, first paint at 1440.
- Evidence: `01-hero-1440-first-frame.png`, `00-ghost-probe-0.png` (reproduced in dev).
- Problem: For about 300ms, the header shows two copies offset by roughly 11px, plus an "العربية" language label, which the site no longer supports. The label is not in the server HTML or in `src/`. It exists only in the stale `.next/dev` cache, so this is most likely a dev-server artifact.
- Why it hurts: If it reaches production, it is a visible flash of a removed feature on every load.
- Change: Run `pnpm build && pnpm start`, capture the first 500ms, and check. If the doubling is gone, delete `.next/dev` and note it as dev-only. If it persists, check for a second header render path.

### P2

**P2-1 · Contact CTA label is top-heavy in the circle**
- Where: Contact, 1440 and 390.
- Evidence: `05-scroll-1440-y3600.png`, `30-hover-cta-1440.png`, `22-mobile-390-scroll-06-y4800.png`.
- Problem: "GET IN TOUCH" sits in the upper third and the arrow sits about 60px below it, so the label block is not centred.
- Change: Use a single flex container centred on both axes, with the arrow inline or stacked directly under the label with a small gap.

**P2-2 · Section numbering collides**
- Where: Intro (01), Work (no number, cards 01–04), Contact (06).
- Evidence: `02-scroll-1440-y900.png`, `05-scroll-1440-y3600.png`.
- Problem: Chapter numbers skip 02–05, and project numbers 01–04 use the same style. The system is unclear.
- Change: Number chapters sequentially (01 Intro, 02 Work, 03 Contact) and keep project index labels separate in a different style.

**P2-3 · Focus ring is a sharp rectangle**
- Where: Header links, all focusable links.
- Evidence: `11-keyboard-focus-tab2-1440.png` (lime square box around "WORK").
- Problem: The focus ring is a hard square, which fights the hairline and circular language. It does work, so it is a polish issue.
- Change: Use a 1–2px hairline offset by 4px, in the same accent, with the same radius language as the CTA. Keep it visible in all states.

**P2-4 · Card hover is a flat grey wash**
- Where: Work cards, 1440.
- Evidence: `30-hover-card1-1440.png`.
- Problem: The hover dims the image with a flat grey veil and swaps to a second image. It reads as "disabled" rather than "selected".
- Change: Replace the veil with a slow scale or crop shift of the image plus a caption lift, both on the same easing token.

**P2-5 · Project 01 cover copy is hard to read**
- Where: Work card 01, 1440.
- Evidence: `03-scroll-1440-y1800.png` (overlay "We build brand systems that think, move and evolve" over the astronaut portrait).
- Problem: Small grey text over a busy photo has no scrim, and the image does not look like a client project.
- Change: Use a gradient scrim behind overlay copy, or move the copy below the image. Replace the cover with a real project still if the portrait is not the client's work.

**P2-6 · "SCROLL" hint is misaligned with the meta row**
- Where: Hero, 768 and 1440.
- Evidence: `02-hero-1440-settled.png`, `20-hero-768.png`.
- Problem: "SCROLL" sits about 22px above the meta row (`AVAILABLE FOR WORK`, `CAIRO, EGYPT`) and floats at an arbitrary x. "CAIRO, EGYPT" is low contrast over the bright liquid at 768 and 390.
- Change: Align "SCROLL" to the same baseline as the meta row, or place it on the grid column the wordmark uses. Add a text-shadow or small scrim to the meta row.

**P2-7 · Black band at the top of the viewport**
- Where: Mobile, top 44px (`22-mobile-390-scroll-01-y800.png`); top edge of the project 01 image at 1440 (`03-scroll-1440-y1800.png`).
- Problem: A flat black strip sits above content. It may be a header background or a letterbox from the image.
- Change: Verify whether it is the header background or the image letterbox. If it is unintended, match it to the page background.

**P2-8 · "See all projects" is a plain text link**
- Where: Work footer, 1440.
- Evidence: `04-scroll-1440-y2700.png`.
- Problem: It is the only exit from the work list and looks like body text, not an action.
- Change: Give it an arrow and a hairline underline in the link-line pattern used in the header, so it reads as a control.

**P2-9 · Dev-only "N" badge in bottom-left**
- Where: All dev-server screenshots.
- Evidence: the bottom-left circle in `02-hero-1440-settled.png`.
- Problem: This is the Next.js dev indicator. It is not a product bug, but it overlaps the footer and hero in screenshots.
- Change: None for production. Confirm it is absent in the production build before reviewing visuals.

---

## 4. What to KEEP

- **Liquid-chrome hero surface** (`02-hero-1440-settled.png`). Distinctive, calm, real WebGL with a poster fallback. Protect the tuning.
- **Reduced motion** (`13-reduced-motion-1440.png`). Frozen hero frame instead of motion. Keep it as a model for the rest of the site.
- **Intro typography** (`02-scroll-1440-y900.png`). Large grotesk with a mono chapter label and a hairline rule. This is the best editorial moment on the page; use it as the type reference for everything else.
- **Mono micro-labels** ("INTRODUCTION", "CAIRO, EGYPT", "AVAILABLE FOR WORK"). They carry the editorial voice cheaply.
- **Single lime accent** used on the status dot, the project tags, and the CTA. Keep it scarce.
- **Real client imagery** on the project cards. These are real sites, which is stronger than mockups.
- **No horizontal overflow** at 360, 390, 768, 1024, 1280, 1440, 1920 (measured).
- **Contrast on main text** (about 17:1 for links, 5:1 for secondary labels). Passes AA for body.
- **Native `<dialog>` menu** with Escape and focus handling (`12-menu-open-1440.png`).

## 5. What to REMOVE or simplify

- **The cover-with-overlay-copy pattern** on Work. Move the description below the image so the card reads as image + caption, not image + text sandwich.
- **The alternating left/right stagger** with empty columns. Replace with a fixed grid.
- **The flat grey hover veil.** Replace with an image crop shift.
- **The double numbering** (chapter numbers and project numbers in the same cards). Keep one system.
- **Brand-agency copy in project blurbs** ("We build bold brands for disruptive companies"). Rewrite to match "software developer" positioning, for example what was built and what it does.
- **The floating "SCROLL" hint** at an arbitrary x. Align it to the grid or remove it.

---

## 6. Reference points

These are the three sites you named. Screenshots are in `audit-shots/refs/`.

1. **gabrielvaldivia.com** (`refs/ref-gabriel-1440-hero.png`)
   - Learn: the hero is a large, light-weight display headline over a real photograph in a rounded card, and the next card peeks off the right edge. That peek is the scroll affordance. Our Work section has no equivalent, so visitors do not know there is more.
   - Apply: use a horizontal peek strip for the six projects instead of a 3,600px stagger.

2. **dennissnellenberg.com** (`refs/ref-dennis-1440-hero.png`, `refs/ref-dennis-1440-y1400.png`)
   - Learn: the name is a huge sans wordmark that crosses the subject photo, so type and image layer in depth. The small pill ("Located in the Netherlands") is a detail that gives the page a personal voice.
   - Apply: give the portfolio a second layer. The name or a large project word can cross a hero still or a feature card, and add one pill-style micro-detail with real info (Cairo, availability) as a cross-section anchor.

3. **crz.studio** (`refs/ref-crz-1440-hero.png`, `refs/ref-crz-1440-y1400.png`)
   - Learn: one typographic gesture carries the whole page. Numerals count and change, with a chromatic offset on the shadow. The page is almost entirely negative space, so the one gesture reads as a point of view.
   - Apply: use one signature motion for the Work or Contact chapter (for example, a counter or type offset) and resist adding more. Restraint is what makes the hero feel designed.

---

## 7. Suggested fix order (phases)

Each phase is small enough for one session.

**Phase 1: Bugs and clipping (one session)**
- P1-1 hero wordmark clipped at fold
- P1-2 menu trigger over copy on mobile
- P1-4 touch targets on mobile nav
- P1-6 verify header double flash on production build (decide: fix or dev-only)
- Done when: no clipped text at 1440, 390, 1920; trigger has a backdrop; nav hit areas ≥ 44px; the production-build check is recorded.

**Phase 2: Pacing and grid (one session)**
- P1-3 Work section grid and height
- P2-1 CTA label centring
- P2-2 chapter numbering
- P2-8 "See all projects" as a control
- Done when: the Work section is under ~2,200px at 1440, no row is more than about 30% empty, and chapter numbers run 01 → 03.

**Phase 3: Positioning and copy (one session)**
- Rewrite project blurbs to match "software developer" positioning.
- Replace or retitle the project 01 cover if it is not the client's work.
- Done when: the hero and the project blurbs describe the same person.

**Phase 4: Depth and a second signature (one session)**
- Choose one layering device (type crossing a feature image, or a large project word behind the cards). Apply it once, at one chapter boundary.
- P2-5 cover copy scrim or relocation
- P2-6 hero meta alignment and contrast
- Done when: the page has one layered moment after the hero, and the overlay copy on covers passes a visual legibility check.

**Phase 5: Interaction and motion system (one session)**
- Single easing token and duration for all hover and reveal motion.
- P2-3 focus ring as hairline
- P2-4 card hover as image crop shift plus caption lift
- Done when: every hover and focus state uses the same token set, and the reduced-motion path still shows the full layout.

**Phase 6: Verification (short session, optional)**
- Axe scan, scrolled keyboard test for the menu trigger (P1-5), FPS and CLS on the production build, and a final visual pass at 360, 390, 768, 1440, 1920.

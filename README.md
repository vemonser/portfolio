# Portfolio

A bilingual (Arabic / English) portfolio. The hero is a full-bleed liquid-chrome
WebGL surface; the navigation is a header that hands over to a circular trigger
past 30% of the viewport and opens a modal panel from the inline-end edge —
right in English, left in Arabic. The sections below the hero are still absent:
`/work`, `/about` and `/contact` are honest stubs so the menu never dead-ends.

## Stack

| | |
|---|---|
| Framework | Next.js 16.4 (App Router, Turbopack, fully static) |
| Language | TypeScript, strict |
| Styling | Tailwind CSS 4 (`@theme` tokens, no JS config) |
| i18n | next-intl 4 — `/[locale]`, Arabic default, no middleware |
| 3D | three.js 0.187, imperative, no react-three-fiber |
| Motion | GSAP 3.15 (core only — no ScrollTrigger) |

## Running

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm build        # static build
pnpm typecheck
pnpm test
pnpm lint
pnpm poster       # regenerate the fallback images (needs dev or start running)
```

`/` redirects to `/ar`. The redirect is declared in `next.config.ts`, so it is
served without a proxy/middleware hop.

## How the hero is put together

```
src/app/[locale]/page.tsx               server: builds the real HTML
src/features/hero/Hero.tsx              server: the section + the h1 wordmark
src/features/hero/HeroStage.tsx         client: decides whether WebGL may exist
src/features/hero-scene/scene.ts        three.js, no React
src/features/hero-scene/mercuryScene.ts the renderer: waves + composite
src/features/hero-scene/glsl/*.ts       mercury, ripple and composite shaders
src/features/hero-scene/math.ts         pure helpers (tested)
```

`scene.ts` never imports React. React mounts it, feeds it pointer and scroll
values, and disposes it. The scene returns `sessionStorage`-free state only —
it has no idea the page exists. That boundary is why the renderer can be
replaced — or driven from ScrollTrigger later — without touching the page.

### The scene

A fullscreen mercury surface with a live wave simulation, and the wordmark
refracted through it. There is no mesh, no light rig and no environment map:
every pixel of metal is a function, so the frame is as sharp as the display and
nothing has to download before it can render.

- **One quad.** Two fullscreen triangles. The wave state lives in a ping-pong
  pair of half-float render targets and propagates a damped wave equation;
  the cursor injects a capsule of force along the path it travelled, so fast
  strokes leave one continuous wake.
- **Procedural studio.** The metal reflects a sky gradient, two long light
  strips and one tight sun — not an HDRI. Metal is only what it reflects, so
  every highlight in the frame is one of those four sources.
- **Dispersion is in the shading.** Each RGB channel reflects a slightly
  different normal, which is where the red/blue fringing on the crests comes
  from.
- **The wordmark is real HTML**, layered over the canvas: the h1 for search
  engines and screen readers, the LCP text, and nothing else. No effect is
  applied to it — hover belongs to the surface. Pointer moves travel through
  the text, so dragging anywhere on the hero (the word included) disturbs the
  liquid shape itself.
- **Calm by design.** The drift speeds and the wave energy are deliberately
  low: the surface reads as slow liquid, not a storm.

### Whether the engine runs at all

`HeroStage` owns that decision. The scene module is imported lazily, inside an
effect, after the checks below.

| Condition | Rendered | three.js fetched |
|---|---|---|
| Any width, WebGL 2, motion allowed | live canvas over the poster | yes |
| `prefers-reduced-motion: reduce` | one frozen frame of the real scene | yes |
| No WebGL 2 | poster | no |
| Hero scrolled out of view | paused | already loaded |

There is **no viewport gate**: the surface is shading, not tessellation, so a
phone runs the same shader as a desktop. WebGL 2 is required because the wave
state lives in half-float render targets.

`?t=<seconds>` freezes the drift at a fixed moment for QA and for the poster
pipeline.

### Poster

`public/poster/*` is captured from the live scene, never mocked up, so the
still always matches the material. `scripts/poster.mjs` screenshots the canvas
element with the HTML wordmark hidden; the poster is the liquid alone and the
text stays live on top. Fixing `t` makes the output reproducible across runs.

Regenerate after any change to the material or the type tokens in
`globals.css`.

## How the navigation is put together

```
src/features/navigation/nav.ts              destinations + locale-prefixed hrefs
src/features/navigation/locale-href.ts      locale switch and path normalising (tested)
src/features/navigation/menu-store.ts       pause signal shared with the hero scene
src/features/navigation/SiteHeader.tsx      client: header, 30% threshold, trigger
src/features/navigation/MenuOverlay.tsx     client: native <dialog>, focus, locale
src/app/[locale]/layout.tsx                 server: resolves strings, passes props
src/app/globals.css                         panel, lip, stagger, RTL
```

- The panel is a native `<dialog>` opened with `showModal()`: focus trap, Esc and
  inertness come from the platform. A Tab-wrap handler keeps cycling in-document.
- The rounded leading edge is **not** `clip-path`: a `6vw` lip holds a `775%`-wide
  ellipse that collapses to zero, so the edge curves into a straight line.
- The panel is **bone with ink text**, not ink. The reference's dark panel reads
  because its page is light; against the near-black hero a dark panel and its
  curve disappear. Inverting the surface is what makes the shape legible.
- `html[dir]` alone decides the side — the panel enters from the right on `/en`
  and from the left on `/ar`, with no JS branch.
- The hero scene stops while the menu is open (`menu-store`), including when a
  tab switch or an IntersectionObserver callback would otherwise resume it.
- Strings stay server-rendered; the client header receives values, not the
  message catalog, so no `NextIntlClientProvider` is shipped.
- `/work`, `/about` and `/contact` exist in both locales as stubs. The header is
  absolute and scrolls away; the trigger is fixed and appears past 30% of the
  viewport.

Browser QA: `node scripts/nav-qa.mjs --case <case> --out artifacts` (cases:
`en-top`, `en-reveal`, `en-open`, `en-close`, `locale`, `ar-open`, `mobile`,
`reduced`, `stub`, `pause`). Evidence for each criterion lives in
`.quality/runs/nav/`.

## Measured

Measured on this machine, production build (`gzip -9`), 1440×900. The JS figures
predate the navigation layer.

| | |
|---|---|
| Initial route JS (`/en`) | ~176 KB gz |
| Scene chunk (three + GSAP + scene) | 158 KB gz |
| Poster, desktop AVIF / WebP | 9 KB / 18 KB |
| Poster, mobile AVIF / WebP | 6 KB / 13 KB |

The scene chunk is still lazy — first paint is the poster. On mobile it is now
fetched too (the scene runs there), so the old "0 requests" line no longer
applies.

## Changing things

- **The name** lives in `src/messages/ar.json` and `src/messages/en.json` under
  `hero.name`.
- **Navigation labels** live under `nav` in the same files. The panel side and
  direction are driven by `html[dir]`, not by JS.
- **The wordmark typography** is `.hero-wordmark` in `src/app/globals.css`.
  Arabic must keep `letter-spacing: 0` — any tracking tears a joined script
  apart. The bottom crop is `--wordmark-drop` (a negative margin). Nothing
  else is applied to the text — no filter, no transform, no hover state.
- **The surface** dials — wave force, amplitude, dispersion, sheen, warp — are
  the constants at the top of `mercuryScene.ts`; the drift speeds are inside
  `glsl/mercury.ts`.

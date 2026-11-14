# Portfolio

An editorial English portfolio. The hero is a full-bleed liquid-chrome WebGL
surface; the navigation is a header that hands over to a circular trigger past
30% of the viewport and opens a modal panel from the inline-end edge. Every
route — `/`, `/work`, `/blog`, `/about`, `/contact` and their detail pages — is
built.

## Stack

| | |
|---|---|
| Framework | Next.js 16.4 (App Router, Turbopack, fully static) |
| Language | TypeScript, strict |
| Styling | Tailwind CSS 4 (`@theme` tokens, no JS config) |
| 3D | three.js 0.187, imperative, no react-three-fiber |
| Motion | GSAP 3.15 (core + ScrollTrigger, driving Lenis) |

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

The site used to be bilingual. Old `/en/*` and `/ar/*` URLs permanently redirect
to the un-prefixed paths, declared in `next.config.ts` — no proxy or middleware
hop.

## How the hero is put together

```
src/app/page.tsx                        server: builds the real HTML
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
src/features/navigation/nav.ts              destinations and labels
src/features/navigation/menu-store.ts       pause signal shared with the hero scene
src/features/navigation/SiteHeader.tsx      client: header, 30% threshold, trigger
src/features/navigation/MenuOverlay.tsx     client: native <dialog>, focus, Escape
src/app/layout.tsx                          server: shell, copy, header/footer
src/content/copy.ts                         the site's copy, typed
src/app/globals.css                         panel, lip, stagger
```

- The panel is a native `<dialog>` opened with `showModal()`: focus trap, Esc and
  inertness come from the platform. A Tab-wrap handler keeps cycling in-document.
- The rounded leading edge is **not** `clip-path`: a `6vw` lip holds a `775%`-wide
  ellipse that collapses to zero, so the edge curves into a straight line.
- The panel is **bone with ink text**, not ink. The reference's dark panel reads
  because its page is light; against the near-black hero a dark panel and its
  curve disappear. Inverting the surface is what makes the shape legible.
- The panel enters from the right, the reading edge of the page.
- The hero scene stops while the menu is open (`menu-store`), including when a
  tab switch or an IntersectionObserver callback would otherwise resume it.
- Strings stay server-rendered; the client header receives values, not the copy
  module, so the page ships no translation runtime.
- The header is absolute and scrolls away; the trigger is fixed and appears past
  30% of the viewport (and is always visible below 768px).

Browser QA lives in `tests/` and runs against the dev server:

```bash
pnpm playwright test --project=chromium
```

`tests/editorial-routes.spec.ts` covers routing, navigation, the drawer, footer
targets, overflow and the legacy redirects; `tests/contact-form.spec.ts` covers
the form states; `tests/hero-liquid-compression.spec.ts` covers the scene.

## Measured

Measured on this machine, production build (`gzip -9`), 1440×900. The JS figures
predate the navigation layer.

| | |
|---|---|
| Initial route JS (`/`) | ~176 KB gz |
| Scene chunk (three + GSAP + scene) | 158 KB gz |
| Poster, desktop AVIF / WebP | 9 KB / 18 KB |
| Poster, mobile AVIF / WebP | 6 KB / 13 KB |

The scene chunk is still lazy — first paint is the poster. On mobile it is now
fetched too (the scene runs there), so the old "0 requests" line no longer
applies.

## Changing things

- **All copy** lives in `src/content/copy.ts` — the name under `hero.name`,
  navigation labels under `nav`, and so on. No translation runtime is involved.
- **The wordmark typography** is `.hero-wordmark` in `src/app/globals.css`. The
  bottom crop is `--wordmark-drop` (a negative margin). Nothing else is applied
  to the text — no filter, no transform, no hover state.
- **The surface** dials — wave force, amplitude, dispersion, sheen, warp — are
  the constants at the top of `mercuryScene.ts`; the drift speeds are inside
  `glsl/mercury.ts`.

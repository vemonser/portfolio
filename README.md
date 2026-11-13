# Portfolio — hero

A bilingual (Arabic / English) hero with a full-bleed liquid-chrome WebGL surface.
This repository contains **only the hero**. Navigation, copy, and the sections
below the fold are deliberately absent.

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
src/app/[locale]/page.tsx          server: builds the real HTML
src/features/hero/Hero.tsx         server: layers + the <h1> wordmark
src/features/hero/HeroStage.tsx    client: decides whether WebGL may exist
src/features/hero-scene/scene.ts   three.js, no React
src/features/hero-scene/studio.ts  the procedural environment
src/features/hero-scene/noise.ts   GLSL simplex noise
src/features/hero-scene/math.ts    pure helpers (tested)
```

`scene.ts` never imports React. React mounts it, feeds it pointer and scroll
values, and disposes it. That boundary is why the renderer can be replaced — or
driven from ScrollTrigger later — without touching the page.

### The scene

A molten chrome surface that fills the frame, so the hero has no silhouette
at all — the surface *is* the page. It is a densely tessellated plane sitting
just in front of the camera, displaced along its normal by animated 3D noise,
shaded by a mirror.

- **No lights.** `metalness: 1` with roughness near zero means the environment
  map is the entire lighting rig.
- **The environment is code.** `studio.ts` builds a near-black dome with two
  broad soft sources and one small hot spot, baked into a PMREM. No HDR file,
  no CDN, no network request. Broad sources give the gradients that read as
  liquid; the small one gives the single crisp glint that reads as polished.
- **The field is anisotropic.** Squashed on one axis and stretched on the
  other, so forms elongate and flow instead of sitting there as round hills.
  This is most of "liquid" for free.
- **The normal is analytic.** Two extra samples per vertex give the gradient,
  so shading stays smooth instead of showing the tessellation.
- **Amplitude is deliberately under the fold threshold.** Push it further and
  the surface folds over itself, which shows up as a stray dark line — the
  exact artefact that made earlier versions look wrong.
- **No ring lights.** A ring reflects off a near-flat surface as a closed loop
  that appears from nowhere and reads as an artefact, not as metal.

### Whether the engine runs at all

`HeroStage` owns that decision. The scene module is imported lazily, inside an
effect, after the checks below — so a phone never downloads three.js.

| Condition | Rendered | three.js fetched |
|---|---|---|
| Desktop, WebGL, motion allowed | live canvas over the poster | yes |
| `prefers-reduced-motion: reduce` | poster | no |
| No WebGL | poster | no |
| ≤ 768px | poster | no |
| Hero scrolled out of view | paused | already loaded |

`?scene=1` forces the engine on regardless of viewport, and `?t=<seconds>`
freezes the flow at a fixed moment. Both exist for QA and for the poster
pipeline.

### Poster

`public/poster/*` is captured from the live scene, never mocked up, so the
still always matches the material. `scripts/poster.mjs` screenshots the canvas
element only — the headline stays real HTML. Fixing `t` makes the output
reproducible across runs.

Regenerate after any change to the material, the camera, or the environment.

## Measured

Measured on this machine, production build (`gzip -9`), 1440×900.

| | |
|---|---|
| Initial route JS (`/en`) | 176 KB gz |
| Scene chunk (three + GSAP + scene) | 161 KB gz / 135 KB br |
| Poster, desktop AVIF | regenerated per run |
| Frame time, p95 | 7 ms |
| Mobile (390px) requests for the scene chunk | 0 |

The brief's 260 KB budget is **not met** — the route totals 337 KB gz. Next's
own framework baseline is 176 KB before any 3D, and a three.js renderer is
~137 KB of that remainder. Levers if the number matters: drop GSAP from the
hero (≈24 KB), or accept it and raise the budget.

## Changing things

- **The name** lives in `src/messages/ar.json` and `src/messages/en.json` under
  `hero.name`.
- **The Arabic display face** is `--font-display` for `html[lang="ar"]` in
  `src/app/globals.css`. Arabic must keep `letter-spacing: 0` — any tracking
  tears a joined script apart.
- **The wordmark crop** is `--wordmark-drop`, per locale. The comment in
  `globals.css` explains the identity: `clip ≈ descender-overflow − drop`.

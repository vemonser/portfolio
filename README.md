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

One dark chrome mass. The reference is a molten form with a readable
silhouette — a *thing*, not a surface filling the frame. An earlier version
used a displaced plane and it read as a curtain, so this is a dense sphere:
low-frequency noise gives it lobes, the silhouette stays visible, and the
environment does all the shading.

- **No lights.** `metalness: 1` plus low roughness means the environment map is
  the entire lighting rig. Adding a light would flatten exactly what makes it
  read as metal.
- **The environment is code.** `studio.ts` builds a gradient dome, a few hard
  emissive strips, and large near-black panels, then bakes it into a PMREM.
  No HDR file, no CDN, no network request. The black panels are not decoration:
  chrome only reads as chrome when half of it is reflecting nothing.
- **The normal comes from the displaced surface.** Two extra samples per vertex
  give the real gradient, so shading follows the lobes instead of the base
  sphere and the tessellation never shows.
- **Roughness is not zero on purpose.** A near-mirror aliases the hard edges of
  the environment into visible blocks; `0.16` removes that and keeps the
  soft-focus look of the reference.
- **The noise is low frequency.** Two octaves with a weak second one, and a
  restrained domain warp. More detail reads as crumpled foil; the reference is
  one dark mass with a soft sheen.

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
| Poster, desktop AVIF | 3.3 KB |
| Poster, mobile AVIF | 3.0 KB |
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

# Showcase assets

Real captures of live portfolio sites, turned into short, stepped scroll
videos and a three-phone still. One config entry per project drives capture,
compositions and render.

Everything here is separate from the Next.js site. The only root changes are
the `capture` / `render` / `studio` / `discover` scripts.

## Commands

Run from the repo root:

```sh
npm run discover                 # print likely routes from sitemap + nav
npm run capture -- anom-creative # capture one project (or `all`)
npm run render  -- anom-creative # render one project into video/out/<slug>
npm run studio                   # Remotion Studio
```

From `video/` you can also use `npm run capture`, `npm run render`,
`npm run discover`, `npm run studio`.

Captures are prerequisites. `render` refuses to run until both desktop and
mobile captures exist, plus the real-scroll clip for every `liveScroll` route.
Capturing is idempotent: it replaces that project's files and manifest entry.

## Adding a project

Add one entry to `src/showcase/projects.ts`:

```ts
{
  slug: "studio-name",
  name: "Studio Name",
  url: "https://studio.example",
  accent: "#b4472a",
  routes: [
    { path: "/", key: "home", label: "Home", liveScroll: true },
    { path: "/work/", key: "work", label: "Work" },
  ],
  mobile: { route: "home" },
  // Optional:
  // stops: [0, 900, 2400, 5200],   // raw CSS offsets, replaces detection
  // stills: { offsets: [0, 2400, 6800] },
  // motion: { holdFrames: 24, moveFrames: 18, returnFrames: 16 },
}
```

Then `npm run capture -- studio-name` and `npm run render -- studio-name`.
No component changes.

## What the capture does

- Desktop: 1440×900 CSS, DPR 2. Mobile: 390×844 CSS, DPR 3, iPhone UA.
- Waits out full-viewport preloaders, network idle and webfonts.
- Dismisses common cookie banners and hides known CMP containers.
- Scrolls through the page until the document height stops growing, so lazy
  images and scroll-triggered reveals actually run.
- Freezes each `<video>` to an `<img>` of its current frame. Chromium does not
  paint offscreen video in a `fullPage` screenshot; without this, sections
  with background video come out blank.
- Hides fixed chrome (nav, custom cursor) and converts sticky elements to
  `position: relative`, so content is captured at its inline position instead
  of being deleted or stuck.
- Takes the full-page shot while parked at the bottom, where the footer has
  been revealed. It then compares the bottom slice against the live viewport.
  If they differ (Chromium clipped or padded the tall image), it stitches
  viewport-sized chunks instead and says `[STITCHED]`.
- Writes the canonical full-res PNG, a JPEG derivative for Remotion, a
  `.sections.json`, and an entry in `src/showcase/captures.generated.json`.

JPEG for the derivative is deliberate: WebP stops at 16383 px per side and a
tall page at 1800 px wide can exceed that. The canonical asset stays PNG.

## Desktop modes

Two desktop renderers share the same config:

- **Live scroll** (`liveScroll: true`) — records the real page with Chromium's
  screencast. It eases between section tops and dwells for a beat at each one
  (1.5s on the hero, 0.8s on sections, 1.2s at the bottom): a hand scroll that
  stops to look, not a slider. The page is never frozen — its own on-view
  animations (counters, reveals, pinned sections, marquee) keep running during
  the holds. The clip sits in a flush Mac window at 1600×1000: 52px toolbar,
  948px of page, no backdrop, no outer frame.
- **Stepped camera** — the tall-image path below. It is still the fallback for
  routes without `liveScroll`, and it drives the mobile video and stills.

Live recording details:

- Viewport is 1600×948 so it fits exactly under the 52px toolbar.
- The page grows while scrolling (7,791 → 10,650px on Anom), so the final
  height is measured in a throwaway context first, then the recording aims at
  the real bottom.
- Screencast frames are JPEG q92 with timestamps; ffmpeg assembles them at
  30fps, CRF 12, no audio. The loader never enters the clip because the
  screencast starts after it.
- The site's 12px custom cursor is hidden; the site nav is kept.

## Motion (stepped fallback)

`timeline.ts` is pure and unit-tested. For each stop it emits a hold, then one
eased move to the next stop, then another hold. The last move returns to 0, so
the final frame matches the first.

- Ease: `Easing.bezier(0.76, 0, 0.24, 1)` — velocity zero at both ends.
- Defaults: 24 hold, 18 move, 16 return at 30 fps, overridable per project.
- A gap longer than 1.2 viewports keeps one ease but multiplies its duration by
  the number of ~0.8-viewport steps it spans. Content is traversed, not
  skipped, without re-easing at every screen (which would stutter).
- Every offset is clamped to `imageHeight - viewportHeight`.
- Duration comes from `calculateMetadata`; nothing is hardcoded.

## Render

`npm run render -- <slug>`:

1. Remotion renders a CRF 12 intermediate (H.264, muted, yuv420p).
2. ffmpeg encodes H.264 `yuv420p`, `-movflags +faststart`, no audio, 30 fps.
3. If the file is over its budget, it retries at the next CRF: 23 → 26 → 29 →
   32 → 35. The budget is 3 MB, or 3.6 MB for live-scroll routes so they can
   stay at CRF 32 instead of degrading to 35. The intermediate is reused, so
   no generation loss.
4. Posters are the first frame of the final video.
5. The still composition renders at 2400×1500, then becomes WebP q85.
6. Prints a table with resolution, duration, size, CRF, audio streams and
   faststart. Exits non-zero if any file still has audio or is not faststart.

Output:

```
video/out/<slug>/
  desktop-home.mp4
  desktop-home.poster.jpg
  desktop-about.mp4
  desktop-about.poster.jpg
  mobile.mp4
  mobile.poster.jpg
  mobile-stills.webp
```

Open `video/embed-demo.html` through any static server rooted at `video/`
(for example `python3 -m http.server 8099`) to see the embedding pattern.

## Known limitations

- A page whose main content is a fixed full-screen canvas and whose body does
  not scroll cannot be captured as a scroll video. Anom's `/portfolio/` is one;
  `/about/` is used instead.
- Sticky/pinned sections are unstuck for the capture, so the screenshot shows
  their inline state, not the pinned animation.
- Horizontal marquees become a single frozen frame in the tall image.
- Very tall stitched pages can show a seam where a marquee or parallax element
  was at a different position in adjacent chunks. The capture reports
  `[STITCHED]` so the result can be reviewed.

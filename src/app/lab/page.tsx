import { readFileSync } from "node:fs";
import path from "node:path";

import PageFrame from "@/features/ui/PageFrame";

/*
 * Phase 0 review surface. This page is the one place where the owner can see
 * all four prototypes together with the numbers that decide them. It is
 * unlinked from the site nav and noindexed by the lab layout.
 */

type VideoA = {
  video: {
    bytes: number;
    duration: number;
    width: number;
    height: number;
    codec: string;
    fps: string;
  };
  poster: { bytes: number };
};

type VideoB = {
  renders: Record<
    "mp4" | "webm",
    {
      bytes: number;
      duration: number;
      width: number;
      height: number;
      codec: string;
      fps: string;
    }
  >;
};

type Stills = {
  frames: Record<
    "cover" | "sectionA" | "sectionB" | "detail" | "mobile",
    { bytes: number; width: number; height: number }
  >;
};

const readJson = <T,>(relative: string): T =>
  JSON.parse(
    readFileSync(path.join(process.cwd(), "public", relative), "utf8"),
  ) as T;

const videoA = readJson<VideoA>("lab/video/anom-creative.json");
const videoB = readJson<VideoB>("lab/video/b-anom-showreel.json");
const stills = readJson<Stills>("lab/stills/anom-creative/stills.json");

const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`;
const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const stillLabels: Array<[keyof Stills["frames"], string]> = [
  ["cover", "Cover — scroll 0"],
  ["sectionA", "Section A — the statement"],
  ["sectionB", "Section B — the archive"],
  ["detail", "Detail — two cards, 16:10"],
  ["mobile", "Mobile trio"],
];

const stillFiles: Record<keyof Stills["frames"], string> = {
  cover: "cover.webp",
  sectionA: "sectionA.webp",
  sectionB: "sectionB.webp",
  detail: "detail.webp",
  mobile: "mobile-trio.webp",
};

export default function LabIndexPage() {
  return (
    <PageFrame>
      <section className="px-[var(--inset-edge)] pb-[var(--space-7)] pt-[var(--space-8)]">
        <p className="ui-label m-0">Phase 0 / Review build</p>
        <h1 className="mt-[var(--space-3)] text-display-1 uppercase">
          Four prototypes
          <br />
          and the numbers.
        </h1>
        <p className="mt-[var(--space-4)] max-w-[var(--measure-body)] text-lede text-fg-muted">
          Hero C, the replacement cursor, the directed-scroll clip and the
          Remotion showreel. Nothing here is wired into the live site. The
          production hero and media are untouched.
        </p>
      </section>

      <section className="grid gap-[var(--space-5)] border-t border-[var(--line-hairline)] px-[var(--inset-edge)] py-[var(--space-7)] md:grid-cols-2">
        <article>
          <p className="ui-label m-0">01 / Hero C</p>
          <h2 className="mt-2 text-display-2 uppercase">The Sheet</h2>
          <p className="mt-3 max-w-[46ch] text-body text-fg-muted">
            Two mercury layers composited by a 512×320 Navier–Stokes field. The
            pointer tears the membrane; the ambient band keeps the name
            readable; the DOM h1 is mirrored into a canvas texture.
          </p>

          <div className="mt-[var(--space-4)] grid grid-cols-2 gap-3">
            <a href="/lab/hero-c" className="group block no-underline">
              <img
                src="/lab/hero-c/rest-1440.webp"
                alt="Hero C at rest"
                width={1440}
                height={900}
                className="block aspect-[16/10] w-full object-cover"
              />
              <span className="mt-2 block font-label text-t-12 uppercase tracking-[var(--track)] text-warm group-hover:text-lime">
                Open live scene →
              </span>
            </a>
            <img
              src="/lab/hero-c/stir-1440.webp"
              alt="Hero C after a pointer stir"
              width={1440}
              height={900}
              className="block aspect-[16/10] w-full object-cover"
            />
          </div>

          <dl className="mt-[var(--space-4)] grid grid-cols-2 gap-x-6 gap-y-2 font-label text-t-12 uppercase tracking-[var(--track)]">
            <dt className="text-warm">Desktop</dt>
            <dd className="m-0 text-bone">76 fps · 1440×900 · DPR 1.5</dd>
            <dt className="text-warm">Mobile</dt>
            <dd className="m-0 text-bone">114 fps · 390×844 · DPR 2</dd>
            <dt className="text-warm">Simulation</dt>
            <dd className="m-0 text-bone">512×320 · 10 / 16 pressure</dd>
            <dt className="text-warm">LCP</dt>
            <dd className="m-0 text-bone">728 ms · h1 · throttled</dd>
          </dl>
        </article>

        <article>
          <p className="ui-label m-0">02 / Cursor</p>
          <h2 className="mt-2 text-display-2 uppercase">Replace</h2>
          <p className="mt-3 max-w-[46ch] text-body text-fg-muted">
            A 6 px lime dot and a 34 px bone ring, with view, play, link,
            disabled and text roles. The OS I-beam returns on text fields; the
            native cursor is removed only after mount.
          </p>

          <div className="mt-[var(--space-4)] grid grid-cols-3 gap-3">
            {[
              ["view-dark.webp", "View"],
              ["play.webp", "Play"],
              ["text.webp", "Text"],
            ].map(([file, label]) => (
              <a key={file} href="/lab/cursor" className="group block no-underline">
                <img
                  src={`/lab/cursor/${file}`}
                  alt={`Cursor ${label} state`}
                  width={1440}
                  height={900}
                  className="block aspect-[16/10] w-full object-cover"
                />
                <span className="mt-2 block font-label text-t-12 uppercase tracking-[var(--track)] text-warm group-hover:text-lime">
                  {label}
                </span>
              </a>
            ))}
          </div>

          <dl className="mt-[var(--space-4)] grid grid-cols-2 gap-x-6 gap-y-2 font-label text-t-12 uppercase tracking-[var(--track)]">
            <dt className="text-warm">Gates</dt>
            <dd className="m-0 text-bone">
              fine pointer only · no-JS native · touch none
            </dd>
            <dt className="text-warm">Reduced motion</dt>
            <dd className="m-0 text-bone">snap, no lerp</dd>
            <dt className="text-warm">Escape hatch</dt>
            <dd className="m-0 text-bone">system cursor toggle in the demo</dd>
          </dl>
        </article>
      </section>

      <section className="border-t border-[var(--line-hairline)] px-[var(--inset-edge)] py-[var(--space-7)]">
        <p className="ui-label m-0">03 / Video A</p>
        <h2 className="mt-2 text-display-2 uppercase">Directed scroll</h2>
        <p className="mt-3 max-w-[60ch] text-body text-fg-muted">
          Five eased hops with holds, captured at 1440×900 and encoded to
          1280×800 VP9. The intro is trimmed; the poster is an archive frame,
          not the hero still.
        </p>

        <video
          className="mt-[var(--space-4)] block w-full max-w-[1100px] bg-black"
          controls
          playsInline
          preload="metadata"
          poster="/lab/video/anom-creative-poster.webp"
        >
          <source src="/lab/video/anom-creative-directed.webm" type="video/webm" />
        </video>

        <p className="mt-3 font-label text-t-12 uppercase tracking-[var(--track)] text-warm">
          {videoA.video.duration.toFixed(2)} s · {videoA.video.width}×
          {videoA.video.height} · {videoA.video.codec} ·{" "}
          {mb(videoA.video.bytes)} · poster {kb(videoA.poster.bytes)}
        </p>
      </section>

      <section className="border-t border-[var(--line-hairline)] px-[var(--inset-edge)] py-[var(--space-7)]">
        <p className="ui-label m-0">04 / Video B</p>
        <h2 className="mt-2 text-display-2 uppercase">Remotion showreel</h2>
        <p className="mt-3 max-w-[60ch] text-body text-fg-muted">
          A 1.5 s title card, the directed-scroll clip in a 16:10 window with a
          2% push-in, a lime cut, and a 2 s end card. 1920×1080, 30 fps.
        </p>

        <video
          className="mt-[var(--space-4)] block w-full max-w-[1100px] bg-black"
          controls
          playsInline
          preload="metadata"
          poster="/lab/video/b-anom-showreel-poster.webp"
        >
          <source src="/lab/video/b-anom-showreel.mp4" type="video/mp4" />
          <source src="/lab/video/b-anom-showreel.webm" type="video/webm" />
        </video>

        <p className="mt-3 font-label text-t-12 uppercase tracking-[var(--track)] text-warm">
          {videoB.renders.mp4.duration.toFixed(0)} s ·{" "}
          {videoB.renders.mp4.width}×{videoB.renders.mp4.height} · 30 fps · MP4{" "}
          {mb(videoB.renders.mp4.bytes)} / WebM {mb(videoB.renders.webm.bytes)}
        </p>
      </section>

      <section className="border-t border-[var(--line-hairline)] px-[var(--inset-edge)] py-[var(--space-7)]">
        <p className="ui-label m-0">05 / Stills</p>
        <h2 className="mt-2 text-display-2 uppercase">Anom, five frames</h2>
        <p className="mt-3 max-w-[60ch] text-body text-fg-muted">
          Reduced motion, fonts and images settled, banners, chat, scrollbar and
          cursor hidden, 2× DPR, 16:10. The detail is a 16:10 crop of the
          archive grid; the mobile trio is composed on a 1600×1000 sheet.
        </p>

        <div className="mt-[var(--space-4)] grid gap-[var(--space-4)] md:grid-cols-2">
          {stillLabels.map(([key, label]) => (
            <figure key={key} className="m-0">
              <img
                src={`/lab/stills/anom-creative/${stillFiles[key]}`}
                alt={`Anom Creative — ${label}`}
                width={stills.frames[key].width}
                height={stills.frames[key].height}
                loading="lazy"
                className="block w-full bg-ink object-cover"
              />
              <figcaption className="mt-2 flex justify-between gap-4 font-label text-t-12 uppercase tracking-[var(--track)] text-warm">
                <span>{label}</span>
                <span>
                  {stills.frames[key].width}×{stills.frames[key].height} ·{" "}
                  {kb(stills.frames[key].bytes)}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--line-hairline)] px-[var(--inset-edge)] py-[var(--space-7)]">
        <p className="ui-label m-0">06 / Method</p>
        <h2 className="mt-2 text-display-2 uppercase">Numbers</h2>

        <div className="mt-[var(--space-4)] max-w-[70ch] font-label text-t-14 uppercase tracking-[var(--track)]">
          <p className="text-warm">
            FPS: Chromium + ANGLE on the AMD Radeon integrated GPU, live scene,
            pointer stirring. LCP: production build, 1440×900, 4× CPU / 1.6
            Mbps, three-run median; the lab is 728 ms with the h1 as the LCP
            element; <code>/</code> is 888 ms warm and 1968 ms cold.
          </p>
          <p className="text-warm">
            Video A is 10.44 s, {mb(videoA.video.bytes)}, VP9 CRF 30, 25 fps
            source. Video B is 10 s, {mb(videoB.renders.mp4.bytes)} MP4 /{" "}
            {mb(videoB.renders.webm.bytes)} WebM. The in-page block stays on the
            WebM; the showreel is a separate asset.
          </p>
        </div>
      </section>

      <section className="border-t border-[var(--line-hairline)] px-[var(--inset-edge)] py-[var(--space-7)]">
        <p className="ui-label m-0">07 / Decisions to make</p>
        <h2 className="mt-2 text-display-2 uppercase">Open questions</h2>

        <ol className="mt-[var(--space-4)] grid max-w-[70ch] gap-4 text-body text-fg-muted">
          <li>
            <strong className="text-bone">Layer B:</strong> chrome (default) or
            a lime-lit room?
          </li>
          <li>
            <strong className="text-bone">Reduced motion:</strong> cursor snaps
            (default) or returns to native?
          </li>
          <li>
            <strong className="text-bone">Page transition:</strong> ship the
            wipe, or skip it?
          </li>
          <li>
            <strong className="text-bone">Video:</strong> A for the in-page case
            study, B for the showreel — or swap?
          </li>
          <li>
            <strong className="text-bone">Escape hatch:</strong> keep the
            system-cursor toggle in the footer?
          </li>
        </ol>
      </section>
    </PageFrame>
  );
}

import {
  AbsoluteFill,
  Easing,
  Img,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { useEffect, useState } from "react";

/*
 * Project film — a cinematic case study cut entirely in Remotion.
 *
 * It opens on a loading screen for the site, then moves through the captured
 * sections (hero → statement → archive → devices) with slow camera moves,
 * vertical slides and a persistent scroll rail. No screen recording: the
 * composition owns every frame, so the pacing is art-directed.
 */

const BLACK = "#0b0b0a";
const BONE = "#f5f1e8";
const LIME = "#c6f035";
const WARM = "#8a7f72";
const HAIRLINE = "rgba(245, 241, 232, 0.16)";

const EASE = Easing.bezier(0.7, 0, 0.2, 1);
const FADE = 12;

const mono: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
  fontSize: 18,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: WARM,
  margin: 0,
};

const sans: React.CSSProperties = {
  fontFamily: '"Inter", sans-serif',
  fontWeight: 600,
  letterSpacing: "-0.045em",
  lineHeight: 0.9,
  color: BONE,
  margin: 0,
};

const PROJECT = {
  name: "Anom Creative",
  url: "anomcreative.com",
  statement: "Brand systems that think, move and evolve.",
  close: "Brand systems that move.",
  chapters: [
    {
      label: "Hero",
      image: "projects/anom/cover.webp",
      scaleFrom: 1.0,
      scaleTo: 1.045,
      shiftFrom: 10,
      shiftTo: -10,
    },
    {
      label: "The anomaly",
      image: "projects/anom/section-a.webp",
      scaleFrom: 1.015,
      scaleTo: 1.055,
      shiftFrom: 12,
      shiftTo: -12,
    },
    {
      label: "Archive / detail",
      image: "projects/anom/detail.webp",
      scaleFrom: 1.015,
      scaleTo: 1.055,
      shiftFrom: 12,
      shiftTo: -12,
    },
    {
      label: "Across devices",
      image: "projects/anom/mobile.webp",
      scaleFrom: 1.01,
      scaleTo: 1.05,
      shiftFrom: 10,
      shiftTo: -8,
    },
  ],
} as const;

/** Chapter windows overlap so the cut is a vertical crossfade, not a hard cut. */
const CHAPTERS = [
  { start: 48, end: 138 },
  { start: 126, end: 222 },
  { start: 210, end: 306 },
  { start: 294, end: 366 },
] as const;

const CLOSE_START = 354;
const TOTAL = 420;

function useFonts() {
  const [handle] = useState(() => delayRender("Loading the site fonts"));

  useEffect(() => {
    Promise.all([
      document.fonts.load('600 240px "Inter"'),
      document.fonts.load('400 44px "Inter"'),
      document.fonts.load('400 18px "JetBrains Mono"'),
    ])
      .then(() => document.fonts.ready)
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);
}

const FontFaces = () => (
  <style>{`
    @font-face {
      font-family: "Inter";
      src: url(${staticFile("fonts/inter.woff2")}) format("woff2");
      font-weight: 100 900;
      font-style: normal;
      font-display: block;
    }
    @font-face {
      font-family: "JetBrains Mono";
      src: url(${staticFile("fonts/jetbrains.woff2")}) format("woff2");
      font-weight: 400;
      font-style: normal;
      font-display: block;
    }
  `}</style>
);

const Vignette = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      background:
        "radial-gradient(120% 90% at 50% 45%, transparent 58%, rgba(0,0,0,0.55) 100%)",
    }}
  />
);

function LoadingScreen() {
  const frame = useCurrentFrame();
  if (frame > 56) return null;

  const progress = interpolate(frame, [0, 42], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fade = interpolate(frame, [44, 56], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lift = interpolate(frame, [0, 42], [18, 0], {
    easing: EASE,
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: BLACK, opacity: fade }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "72px 96px 64px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <p style={mono}>Anom Creative / Case study</p>
          <p style={mono}>2026</p>
        </div>

        <div style={{ transform: `translateY(${lift}px)` }}>
          <h1 style={{ ...sans, fontSize: 236, letterSpacing: "-0.055em" }}>
            anom
            <span
              style={{
                fontSize: "0.2em",
                verticalAlign: "super",
                letterSpacing: 0,
                marginLeft: "0.06em",
              }}
            >
              ®
            </span>
          </h1>
          <p
            style={{
              margin: "30px 0 0",
              maxWidth: 820,
              fontFamily: '"Inter", sans-serif',
              fontSize: 42,
              lineHeight: 1.25,
              letterSpacing: "-0.02em",
              color: "rgba(245, 241, 232, 0.72)",
            }}
          >
            {PROJECT.statement}
          </p>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <p style={{ ...mono, color: BONE }}>Loading the case study</p>
            <p style={{ ...mono, color: BONE }}>
              {Math.round(progress * 100)}%
            </p>
          </div>
          <div style={{ height: 4, background: "rgba(245,241,232,0.12)" }}>
            <div
              style={{
                height: "100%",
                width: `${progress * 100}%`,
                background: LIME,
                boxShadow: "0 0 24px rgba(198,240,53,0.35)",
              }}
            />
          </div>
        </div>
      </div>
      <Vignette />
    </AbsoluteFill>
  );
}

type ChapterProps = {
  image: string;
  start: number;
  end: number;
  scaleFrom: number;
  scaleTo: number;
  shiftFrom: number;
  shiftTo: number;
};

function Chapter({
  image,
  start,
  end,
  scaleFrom,
  scaleTo,
  shiftFrom,
  shiftTo,
}: ChapterProps) {
  const frame = useCurrentFrame();
  if (frame < start || frame > end) return null;

  const enter = interpolate(frame, [start, start + FADE], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exit = interpolate(frame, [end - FADE, end], [1, 0], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(enter, exit);

  const t = interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = scaleFrom + (scaleTo - scaleFrom) * t;
  const shift = shiftFrom + (shiftTo - shiftFrom) * t;
  const enterShift = (1 - enter) * 44;
  const exitShift = (1 - exit) * -44;

  return (
    <AbsoluteFill style={{ background: BLACK, opacity }}>
      <div
        style={{
          position: "absolute",
          left: 160,
          top: 40,
          width: 1600,
          height: 1000,
          overflow: "hidden",
          outline: "1px solid rgba(245, 241, 232, 0.12)",
          outlineOffset: -1,
        }}
      >
        <Img
          src={staticFile(image)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale}) translateY(${shift + enterShift + exitShift}px)`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
}

/**
 * One label set for the whole film. During the image crossfade the incoming
 * chapter owns the label, so two chapters can never print "01" and "02" on top
 * of each other.
 */
function FilmLabels() {
  const frame = useCurrentFrame();
  if (frame < 48 || frame > 366) return null;

  let activeIndex = 0;
  for (let i = 0; i < CHAPTERS.length; i += 1) {
    if (frame >= CHAPTERS[i].start) activeIndex = i;
  }
  const active = CHAPTERS[activeIndex];
  const chapter = PROJECT.chapters[activeIndex];

  const enter = interpolate(frame, [active.start, active.start + 10], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outro = interpolate(frame, [354, 366], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = Math.min(enter, outro);

  return (
    <div style={{ position: "absolute", inset: 0, opacity }}>
      <div
        style={{
          position: "absolute",
          left: 160,
          right: 160,
          top: 10,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <p style={{ ...mono, color: BONE }}>
          {String(activeIndex + 1).padStart(2, "0")} / {chapter.label}
        </p>
        <p style={{ ...mono, color: BONE }}>{PROJECT.url}</p>
      </div>

      <div
        style={{
          position: "absolute",
          left: 160,
          right: 160,
          bottom: 10,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <p style={{ ...mono }}>{PROJECT.name} — case study</p>
        <p style={{ ...mono }}>
          {String(activeIndex + 1).padStart(2, "0")} / 04
        </p>
      </div>
    </div>
  );
}

function ScrollRail() {
  const frame = useCurrentFrame();
  if (frame < 48 || frame > 366) return null;

  const progress = interpolate(frame, [48, 366], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        right: 80,
        top: 170,
        width: 1,
        height: 720,
        background: "rgba(245,241,232,0.16)",
      }}
    >
      <div
        style={{
          width: 3,
          marginLeft: -1,
          height: 720 * progress,
          background: LIME,
          boxShadow: "0 0 18px rgba(198,240,53,0.35)",
        }}
      />
    </div>
  );
}

function CloseCard() {
  const frame = useCurrentFrame();
  if (frame < CLOSE_START) return null;

  const enter = interpolate(frame, [CLOSE_START, CLOSE_START + FADE], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rule = interpolate(
    frame,
    [CLOSE_START + 8, CLOSE_START + 30],
    [0, 1],
    {
      easing: EASE,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );

  return (
    <AbsoluteFill style={{ background: BLACK, opacity: enter }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "72px 96px 64px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <p style={mono}>Anom Creative</p>
          <p style={mono}>2026</p>
        </div>

        <div>
          <p style={{ ...mono, color: BONE, marginBottom: 26 }}>
            Case study — end
          </p>
          <h2 style={{ ...sans, fontSize: 168 }}>{PROJECT.close}</h2>
          <div
            style={{
              height: 5,
              width: rule * 320,
              background: LIME,
              marginTop: 44,
            }}
          />
        </div>

        <div>
          <div style={{ height: 1, background: HAIRLINE, marginBottom: 24 }} />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <p style={{ ...mono, color: BONE }}>{PROJECT.url}</p>
            <p style={{ ...mono }}>Brand systems / Film / Digital</p>
          </div>
        </div>
      </div>
      <Vignette />
    </AbsoluteFill>
  );
}

export const ProjectFilm = () => {
  useFonts();

  return (
    <AbsoluteFill
      style={{
        background: BLACK,
        color: BONE,
        fontFamily: '"Inter", sans-serif',
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <FontFaces />

      {PROJECT.chapters.map((chapter, index) => (
        <Chapter
          key={chapter.label}
          image={chapter.image}
          start={CHAPTERS[index].start}
          end={CHAPTERS[index].end}
          scaleFrom={chapter.scaleFrom}
          scaleTo={chapter.scaleTo}
          shiftFrom={chapter.shiftFrom}
          shiftTo={chapter.shiftTo}
        />
      ))}

      <ScrollRail />
      <FilmLabels />
      <CloseCard />
      <LoadingScreen />
      <Vignette />
    </AbsoluteFill>
  );
};

export const PROJECT_FILM_DURATION = TOTAL;

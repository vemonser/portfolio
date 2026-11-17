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
 * It opens on the site's first screen (no loading card, no progress bar) and
 * then moves by one continuous animated scroll through the captured sections:
 * hero → statement → archive detail → devices → close. The panels are stacked
 * vertically inside the 16:10 window; the camera is a single scroll offset
 * with holds at each section and a short motion blur between them. No fades.
 */

const BLACK = "#0b0b0a";
const BONE = "#f5f1e8";
const LIME = "#c6f035";
const WARM = "#8a7f72";
const HAIRLINE = "rgba(245, 241, 232, 0.16)";

const EASE = Easing.bezier(0.65, 0, 0.2, 1);
const PANEL = 1000;

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
  close: "Brand systems that move.",
  panels: [
    { label: "Hero", image: "projects/anom/cover.webp" },
    { label: "The anomaly", image: "projects/anom/section-a.webp" },
    { label: "Archive / detail", image: "projects/anom/detail.webp" },
    { label: "Across devices", image: "projects/anom/mobile.webp" },
  ],
} as const;

/**
 * Camera keyframes. Each hold is a segment with from === to; each scroll is a
 * 24-frame eased move to the next panel. The film ends on the close panel.
 */
const CAMERA = [
  { start: 0, end: 78, from: 0, to: 0 },
  { start: 78, end: 102, from: 0, to: PANEL },
  { start: 102, end: 168, from: PANEL, to: PANEL },
  { start: 168, end: 192, from: PANEL, to: PANEL * 2 },
  { start: 192, end: 258, from: PANEL * 2, to: PANEL * 2 },
  { start: 258, end: 282, from: PANEL * 2, to: PANEL * 3 },
  { start: 282, end: 354, from: PANEL * 3, to: PANEL * 3 },
  { start: 354, end: 378, from: PANEL * 3, to: PANEL * 4 },
  { start: 378, end: 444, from: PANEL * 4, to: PANEL * 4 },
] as const;

const TOTAL = 444;
const LABELS_END = 354;

const cameraAt = (frame: number) => {
  for (const segment of CAMERA) {
    if (frame <= segment.end) {
      return interpolate(frame, [segment.start, segment.end], [segment.from, segment.to], {
        easing: EASE,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
    }
  }
  return PANEL * 4;
};

const blurAt = (frame: number) => {
  for (const segment of CAMERA) {
    if (frame <= segment.end) {
      if (segment.from === segment.to) return 0;
      const t = interpolate(frame, [segment.start, segment.end], [0, 1], {
        easing: EASE,
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return Math.sin(t * Math.PI) * 2.2;
    }
  }
  return 0;
};

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

function Panel({
  image,
  hideSiteHeader = false,
}: {
  image: string;
  hideSiteHeader?: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: 1600,
        height: PANEL,
        overflow: "hidden",
      }}
    >
      <Img
        src={staticFile(image)}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
      {hideSiteHeader ? (
        <div
          style={{
            position: "absolute",
            inset: "0 0 auto 0",
            height: 66,
            background:
              "linear-gradient(180deg, #0b0b0a 0%, #0b0b0a 52px, rgba(11,11,10,0) 66px)",
          }}
        />
      ) : null}
    </div>
  );
}

function ClosePanel() {
  const frame = useCurrentFrame();
  const rule = interpolate(frame, [386, 410], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        width: 1600,
        height: PANEL,
        background: BLACK,
        padding: "80px 96px 64px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <p style={mono}>{PROJECT.name}</p>
        <p style={mono}>2026</p>
      </div>

      <div>
        <p style={{ ...mono, color: BONE, marginBottom: 26 }}>
          Case study — end
        </p>
        <h2 style={{ ...sans, fontSize: 156 }}>{PROJECT.close}</h2>
        <div
          style={{
            height: 5,
            width: rule * 320,
            background: LIME,
            marginTop: 42,
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
  );
}

function FilmLabels({ camera }: { camera: number }) {
  const frame = useCurrentFrame();
  if (frame > LABELS_END) return null;

  const active = Math.min(
    PROJECT.panels.length - 1,
    Math.round(camera / PANEL),
  );
  const chapter = PROJECT.panels[active];

  const enter = interpolate(frame, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outro = interpolate(frame, [344, LABELS_END], [1, 0], {
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
          {String(active + 1).padStart(2, "0")} / {chapter.label}
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
        <p style={{ ...mono }}>2026</p>
      </div>
    </div>
  );
}

export const ProjectFilm = () => {
  useFonts();
  const frame = useCurrentFrame();
  const camera = cameraAt(frame);
  const blur = blurAt(frame);

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

      <div
        style={{
          position: "absolute",
          left: 160,
          top: 40,
          width: 1600,
          height: PANEL,
          overflow: "hidden",
          outline: "1px solid rgba(245, 241, 232, 0.12)",
          outlineOffset: -1,
        }}
      >
        <div
          style={{
            transform: `translateY(${-camera}px)`,
            filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
          }}
        >
          {PROJECT.panels.map((panel, index) => (
            <Panel
              key={panel.image}
              image={panel.image}
              hideSiteHeader={index === 1}
            />
          ))}
          <ClosePanel />
        </div>
      </div>

      <FilmLabels camera={camera} />
      <Vignette />
    </AbsoluteFill>
  );
};

export const PROJECT_FILM_DURATION = TOTAL;

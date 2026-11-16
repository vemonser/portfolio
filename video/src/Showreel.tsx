import {
  AbsoluteFill,
  Easing,
  OffthreadVideo,
  Sequence,
  continueRender,
  delayRender,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { useEffect, useState } from "react";

const BLACK = "#0b0b0a";
const BONE = "#f5f1e8";
const LIME = "#c6f035";
const WARM = "#8a7f72";
const HAIRLINE = "rgba(245, 241, 232, 0.16)";

const EASE = Easing.bezier(0.7, 0, 0.2, 1);

const mono: React.CSSProperties = {
  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
  fontSize: 18,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: WARM,
  margin: 0,
};

function useFonts() {
  const [handle] = useState(() => delayRender("Loading the site fonts"));

  useEffect(() => {
    Promise.all([
      document.fonts.load('600 260px "Inter"'),
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
        "radial-gradient(120% 90% at 50% 45%, transparent 55%, rgba(0,0,0,0.5) 100%)",
    }}
  />
);

/**
 * 1.5 s title card. The wordmark is the site's, the statement is the site's
 * sentence, and the only moving parts are a slow lift and a lime rule.
 */
function TitleCard() {
  const frame = useCurrentFrame();

  const enter = interpolate(frame, [0, 18], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const lift = interpolate(frame, [0, 18], [30, 0], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const rule = interpolate(frame, [8, 32], [0, 1], {
    easing: EASE,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const exit = interpolate(frame, [33, 44], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: BLACK, opacity: exit }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "72px 96px 64px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          opacity: enter,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <p style={mono}>Anom Creative / Design &amp; Development</p>
          <p style={mono}>2026</p>
        </div>

        <div style={{ transform: `translateY(${lift}px)` }}>
          <h1
            style={{
              margin: 0,
              fontFamily: '"Inter", sans-serif',
              fontSize: 268,
              lineHeight: 0.82,
              letterSpacing: "-0.055em",
              fontWeight: 600,
              color: BONE,
            }}
          >
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

          <div
            style={{
              height: 1,
              background: HAIRLINE,
              margin: "44px 0 28px",
              transform: `scaleX(${rule})`,
              transformOrigin: "left center",
            }}
          />

          <p
            style={{
              margin: 0,
              maxWidth: 900,
              fontFamily: '"Inter", sans-serif',
              fontSize: 44,
              lineHeight: 1.25,
              letterSpacing: "-0.02em",
              color: "rgba(245, 241, 232, 0.78)",
            }}
          >
            Brand systems that think, move and evolve.
          </p>
        </div>

        <div>
          <div
            style={{
              height: 5,
              width: `${rule * 100}%`,
              background: LIME,
            }}
          />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 22,
            }}
          >
            <p style={{ ...mono, color: "rgba(245,241,232,0.55)" }}>
              Cairo / Worldwide
            </p>
            <p style={{ ...mono, color: "rgba(245,241,232,0.55)" }}>
              Case study — 01
            </p>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

/**
 * 6.5 s of the directed-scroll capture in a 16:10 window on a 16:9 stage,
 * with a 2% push-in and a lime line at each cut.
 */
const CLIP_DURATION = 195;

function ClipScene() {
  const frame = useCurrentFrame();

  const scale = interpolate(frame, [0, CLIP_DURATION - 1], [1, 1.02], {
    extrapolateRight: "clamp",
  });
  const fade = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });
  const lineIn = interpolate(frame, [0, 16], [0, 1], {
    easing: EASE,
    extrapolateRight: "clamp",
  });
  const lineOut = interpolate(frame, [178, 194], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: BLACK }}>
      <div
        style={{
          position: "absolute",
          left: 96,
          top: 0,
          width: 1728,
          height: 1080,
          overflow: "hidden",
          opacity: fade,
          outline: `1px solid ${HAIRLINE}`,
          outlineOffset: -1,
        }}
      >
        <OffthreadVideo
          src={staticFile("anom-directed.webm")}
          startFrom={12}
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale})`,
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(11,11,10,0.62) 0%, transparent 18%, transparent 82%, rgba(11,11,10,0.55) 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            top: 36,
            left: 40,
            right: 40,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <p style={{ ...mono, color: BONE }}>01 / Directed scroll</p>
          <p style={{ ...mono, color: BONE }}>anomcreative.com</p>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 34,
            left: 40,
            right: 40,
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <p style={{ ...mono, color: BONE }}>Anom Creative — case study</p>
          <p style={{ ...mono, color: BONE }}>2026</p>
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 96,
          top: 0,
          width: 1728 * lineIn * lineOut,
          height: 4,
          background: LIME,
          boxShadow: "0 0 24px rgba(198, 240, 53, 0.45)",
        }}
      />
    </AbsoluteFill>
  );
}

/** 2 s end card. */
function EndCard() {
  const frame = useCurrentFrame();

  const enter = interpolate(frame, [0, 16], [0, 1], {
    easing: EASE,
    extrapolateRight: "clamp",
  });
  const lift = interpolate(frame, [0, 16], [26, 0], {
    easing: EASE,
    extrapolateRight: "clamp",
  });
  const rule = interpolate(frame, [8, 30], [0, 1], {
    easing: EASE,
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: BLACK }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(60% 60% at 82% 78%, rgba(198,240,53,0.10), transparent 70%)",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          padding: "72px 96px 64px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          opacity: enter,
          transform: `translateY(${lift}px)`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <p style={mono}>Anom Creative</p>
          <p style={mono}>2026</p>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 64 }}>
          <h2
            style={{
              margin: 0,
              fontFamily: '"Inter", sans-serif',
              fontWeight: 600,
              fontSize: 156,
              lineHeight: 0.9,
              letterSpacing: "-0.05em",
              color: BONE,
            }}
          >
            Let&rsquo;s make it
            <br />
            move.
          </h2>

          <div
            style={{
              width: 132,
              height: 132,
              borderRadius: 999,
              background: LIME,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: '"Inter", sans-serif',
              fontSize: 54,
              color: BLACK,
              marginBottom: 12,
            }}
          >
            →
          </div>
        </div>

        <div>
          <div
            style={{
              height: 1,
              background: HAIRLINE,
              marginBottom: 24,
              transform: `scaleX(${rule})`,
              transformOrigin: "left center",
            }}
          />
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <p style={{ ...mono, color: BONE }}>anomcreative.com</p>
            <p style={{ ...mono, color: "rgba(245,241,232,0.55)" }}>
              Brand systems / Film / Digital
            </p>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export const Showreel = () => {
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
      <Sequence from={0} durationInFrames={45}>
        <TitleCard />
      </Sequence>
      <Sequence from={45} durationInFrames={195}>
        <ClipScene />
      </Sequence>
      <Sequence from={240} durationInFrames={60}>
        <EndCard />
      </Sequence>
      <Vignette />
    </AbsoluteFill>
  );
};

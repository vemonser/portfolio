import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import type { CalculateMetadataFunction } from "remotion";

import { Backdrop } from "./components/Backdrop";
import { BrowserFrame } from "./components/BrowserFrame";
import { ErrorCard } from "./components/ErrorCard";
import { MONO, SANS, ShowcaseFonts } from "./components/Fonts";
import { PhoneFrame } from "./components/PhoneFrame";
import { ScreenCrop, SteppedScroll, useSteppedScroll } from "./components/SteppedScroll";
import {
  DESKTOP,
  FIRST_PROJECT,
  FIRST_ROUTE,
  MOBILE,
  desktopTimeline,
  getCapture,
} from "./data";
import { routeKey } from "./projects";
import { describeTimeline } from "./timeline";

const SLUG = FIRST_PROJECT?.slug ?? "anom-creative";
const KEY = FIRST_ROUTE ? routeKey(FIRST_ROUTE) : "home";

function Label({ children }: { children: string }) {
  return (
    <div
      style={{
        fontFamily: MONO,
        fontSize: 13,
        letterSpacing: "0.24em",
        textTransform: "uppercase",
        color: "rgba(245,241,232,0.45)",
      }}
    >
      {children}
    </div>
  );
}

export function PreviewBackdrop() {
  const accent = FIRST_PROJECT?.accent ?? "#b4472a";
  return (
    <AbsoluteFill>
      <Backdrop accent={accent} />
      <ShowcaseFonts />
      <AbsoluteFill
        style={{ alignItems: "center", justifyContent: "center", gap: 26 }}
      >
        <Label>Backdrop</Label>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontFamily: SANS,
            fontSize: 54,
            fontWeight: 500,
            letterSpacing: "-0.04em",
            color: "#f5f1e8",
          }}
        >
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: 999,
              backgroundColor: accent,
            }}
          />
          {accent}
        </div>
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 10,
          }}
        >
          {[1, 0.35, 0.18, 0.08].map((alpha) => (
            <span
              key={alpha}
              style={{
                width: 92,
                height: 44,
                borderRadius: 8,
                backgroundColor: `${accent}${Math.round(alpha * 255)
                  .toString(16)
                  .padStart(2, "0")}`,
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            />
          ))}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export function PreviewBrowserFrame() {
  const project = FIRST_PROJECT;
  const capture = getCapture(SLUG, KEY, "desktop");
  if (!project || !capture) {
    return <ErrorCard title="Desktop capture missing" detail={`Run: npm run capture -- ${SLUG}`} />;
  }

  return (
    <AbsoluteFill>
      <Backdrop accent={project.accent} />
      <ShowcaseFonts />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 22 }}>
        <Label>BrowserFrame</Label>
        <BrowserFrame
          address="anomcreative.com"
          width={DESKTOP.frameWidth}
          contentHeight={DESKTOP.contentHeight}
        >
          <ScreenCrop
            image={capture.image}
            cssWidth={capture.cssWidth}
            cssHeight={capture.cssHeight}
            viewportWidth={DESKTOP.frameWidth}
            viewportHeight={DESKTOP.contentHeight}
            offsetCss={0}
          />
        </BrowserFrame>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export function PreviewPhoneFrame() {
  const project = FIRST_PROJECT;
  const key = project?.mobile?.route ?? KEY;
  const capture = getCapture(SLUG, key, "mobile");
  if (!project || !capture) {
    return <ErrorCard title="Mobile capture missing" detail={`Run: npm run capture -- ${SLUG}`} />;
  }

  return (
    <AbsoluteFill>
      <Backdrop accent={project.accent} />
      <ShowcaseFonts />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 22 }}>
        <Label>PhoneFrame</Label>
        <PhoneFrame
          screenWidth={MOBILE.screenWidth}
          screenHeight={MOBILE.screenHeight}
        >
          <ScreenCrop
            image={capture.image}
            cssWidth={capture.cssWidth}
            cssHeight={capture.cssHeight}
            viewportWidth={MOBILE.screenWidth}
            viewportHeight={MOBILE.screenHeight}
            offsetCss={0}
          />
        </PhoneFrame>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

export const previewSteppedMetadata: CalculateMetadataFunction<
  Record<string, unknown>
> = () => {
  const timeline = desktopTimeline(SLUG, KEY);
  return { durationInFrames: timeline?.totalFrames ?? 90 };
};

export function PreviewSteppedScroll() {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const project = FIRST_PROJECT;
  const capture = getCapture(SLUG, KEY, "desktop");

  // The hook runs unconditionally: the capture can be missing while the
  // showcase is being recorded, and React requires a stable hook order.
  const props = {
    image: capture?.image ?? "",
    cssWidth: capture?.cssWidth || 1,
    cssHeight: capture?.cssHeight || 1,
    viewportWidth: DESKTOP.frameWidth,
    viewportHeight: DESKTOP.contentHeight,
    stops: capture?.stops ?? [],
    holdFrames: project?.motion?.holdFrames,
    moveFrames: project?.motion?.moveFrames,
    returnFrames: project?.motion?.returnFrames,
  };
  const { timeline } = useSteppedScroll(props);

  if (!project || !capture) {
    return <ErrorCard title="Desktop capture missing" detail={`Run: npm run capture -- ${SLUG}`} />;
  }
  const rows = describeTimeline(timeline);
  const active = rows.find(
    (row) => frame >= row.startFrame && frame <= row.endFrame,
  );
  const seconds = (durationInFrames / 30).toFixed(1);

  return (
    <AbsoluteFill>
      <Backdrop accent={project.accent} />
      <ShowcaseFonts />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 18 }}>
        <Label>SteppedScroll · hold → move → hold</Label>
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 6,
            overflow: "hidden",
          }}
        >
          <SteppedScroll {...props} />
        </div>

        <div style={{ width: DESKTOP.frameWidth }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontFamily: MONO,
              fontSize: 13,
              color: "rgba(245,241,232,0.62)",
              marginBottom: 10,
              letterSpacing: "0.06em",
            }}
          >
            <span>
              FRAME {String(frame).padStart(3, "0")} / {durationInFrames - 1} ·{" "}
              {active?.kind.toUpperCase() ?? "END"}
              {active ? ` · y ${Math.round(active.from)}` : ""}
            </span>
            <span>
              {timeline.stops.length} STOPS · {seconds}s
            </span>
          </div>
          <div style={{ position: "relative", height: 6 }}>
            <div style={{ display: "flex", height: 6, gap: 2 }}>
              {rows.map((row, index) => (
                <div
                  key={`${row.startFrame}-${index}`}
                  style={{
                    flexGrow: row.frames,
                    borderRadius: 2,
                    backgroundColor:
                      row.kind === "hold"
                        ? "rgba(245,241,232,0.22)"
                        : row.kind === "return"
                          ? "rgba(245,241,232,0.45)"
                          : project.accent,
                  }}
                />
              ))}
            </div>
            <div
              style={{
                position: "absolute",
                top: -3,
                left: `calc(${(frame / Math.max(1, durationInFrames - 1)) * 100}% - 1px)`,
                width: 2,
                height: 12,
                backgroundColor: "#f5f1e8",
              }}
            />
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

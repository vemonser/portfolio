import {
  Easing,
  Img,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { useMemo } from "react";

import { buildTimeline, offsetAtFrame, scaleStops } from "../timeline";

export const STEP_EASE = Easing.bezier(0.76, 0, 0.24, 1);

export type SteppedScrollProps = {
  /** Path under public/, e.g. captures/anom-creative/home.desktop.jpg */
  image: string;
  /** Capture width in CSS px. */
  cssWidth: number;
  /** Capture height in CSS px (the whole page). */
  cssHeight: number;
  /** Visible window width in composition px. */
  viewportWidth: number;
  /** Visible window height in composition px. */
  viewportHeight: number;
  /** Stop offsets in CSS px, as the capture measured them. */
  stops: number[];
  holdFrames?: number;
  moveFrames?: number;
  returnFrames?: number;
};

export function useSteppedScroll({
  cssWidth,
  cssHeight,
  viewportWidth,
  viewportHeight,
  stops,
  holdFrames,
  moveFrames,
  returnFrames,
}: SteppedScrollProps) {
  const { fps } = useVideoConfig();
  const scale = viewportWidth / cssWidth;
  const displayHeight = cssHeight * scale;

  const timeline = useMemo(
    () =>
      buildTimeline(scaleStops(stops, scale), {
        viewportHeight,
        imageHeight: displayHeight,
        holdFrames,
        moveFrames,
        returnFrames,
      }),
    [
      stops,
      scale,
      viewportHeight,
      displayHeight,
      holdFrames,
      moveFrames,
      returnFrames,
    ],
  );

  return { timeline, scale, displayHeight, fps };
}

/**
 * The camera. It holds still, then eases to the next stop, then holds again.
 * The last move returns to 0 so the final frame matches the first.
 */
export function SteppedScroll(props: SteppedScrollProps) {
  const frame = useCurrentFrame();
  const { timeline, displayHeight } = useSteppedScroll(props);
  const offset = offsetAtFrame(timeline, frame, STEP_EASE);

  return (
    <div
      style={{
        width: props.viewportWidth,
        height: props.viewportHeight,
        overflow: "hidden",
        position: "relative",
        backgroundColor: "#0b0b0a",
      }}
    >
      <Img
        src={staticFile(props.image)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: props.viewportWidth,
          height: displayHeight,
          maxWidth: "none",
          transform: `translateY(${-offset}px)`,
        }}
      />
    </div>
  );
}

type CropProps = {
  image: string;
  cssWidth: number;
  cssHeight: number;
  viewportWidth: number;
  viewportHeight: number;
  offsetCss: number;
};

/** One still frame of the same camera, used by the three-phone composition. */
export function ScreenCrop({
  image,
  cssWidth,
  cssHeight,
  viewportWidth,
  viewportHeight,
  offsetCss,
}: CropProps) {
  const scale = viewportWidth / cssWidth;
  const displayHeight = cssHeight * scale;
  const maxCss = Math.max(0, cssHeight - viewportHeight / scale);
  const offset = Math.min(maxCss, Math.max(0, offsetCss));

  return (
    <div
      style={{
        width: viewportWidth,
        height: viewportHeight,
        overflow: "hidden",
        position: "relative",
        backgroundColor: "#0b0b0a",
      }}
    >
      <Img
        src={staticFile(image)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: viewportWidth,
          height: displayHeight,
          maxWidth: "none",
          transform: `translateY(${-offset * scale}px)`,
        }}
      />
    </div>
  );
}

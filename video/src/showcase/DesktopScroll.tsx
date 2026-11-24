import { AbsoluteFill, useVideoConfig } from "remotion";
import type { CalculateMetadataFunction } from "remotion";

import { Backdrop } from "./components/Backdrop";
import { BrowserFrame } from "./components/BrowserFrame";
import { ErrorCard } from "./components/ErrorCard";
import { FrameStage } from "./components/FrameStage";
import { ShowcaseFonts } from "./components/Fonts";
import { SteppedScroll } from "./components/SteppedScroll";
import {
  DESKTOP,
  desktopTimeline,
  getCapture,
  getDisplayUrl,
  getProject,
} from "./data";

export type DesktopProps = {
  slug: string;
  routeKey: string;
};

export const desktopMetadata: CalculateMetadataFunction<DesktopProps> = ({
  props,
}) => {
  const timeline = desktopTimeline(props.slug, props.routeKey);
  return { durationInFrames: timeline?.totalFrames ?? 90 };
};

export function DesktopScroll({ slug, routeKey }: DesktopProps) {
  const { durationInFrames } = useVideoConfig();
  const project = getProject(slug);
  const capture = getCapture(slug, routeKey, "desktop");
  const address = getDisplayUrl(slug, routeKey);

  if (!project || !capture) {
    return (
      <ErrorCard
        title="Desktop capture missing"
        detail={`Run: npm run capture -- ${slug}`}
      />
    );
  }

  return (
    <AbsoluteFill>
      <Backdrop accent={project.accent} />
      <ShowcaseFonts />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <FrameStage durationInFrames={durationInFrames}>
          <BrowserFrame
            address={address}
            width={DESKTOP.frameWidth}
            contentHeight={DESKTOP.contentHeight}
          >
            <SteppedScroll
              image={capture.image}
              cssWidth={capture.cssWidth}
              cssHeight={capture.cssHeight}
              viewportWidth={DESKTOP.frameWidth}
              viewportHeight={DESKTOP.contentHeight}
              stops={capture.stops}
              holdFrames={project.motion?.holdFrames}
              moveFrames={project.motion?.moveFrames}
              returnFrames={project.motion?.returnFrames}
            />
          </BrowserFrame>
        </FrameStage>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

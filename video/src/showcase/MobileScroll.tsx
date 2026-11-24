import { AbsoluteFill, useVideoConfig } from "remotion";
import type { CalculateMetadataFunction } from "remotion";

import { Backdrop } from "./components/Backdrop";
import { ErrorCard } from "./components/ErrorCard";
import { FrameStage } from "./components/FrameStage";
import { ShowcaseFonts } from "./components/Fonts";
import { PhoneFrame } from "./components/PhoneFrame";
import { SteppedScroll } from "./components/SteppedScroll";
import {
  MOBILE,
  getProject,
  mobileCaptureForProject,
  mobileTimeline,
} from "./data";

export type MobileProps = {
  slug: string;
};

export const mobileMetadata: CalculateMetadataFunction<MobileProps> = ({
  props,
}) => {
  const timeline = mobileTimeline(props.slug);
  return { durationInFrames: timeline?.totalFrames ?? 90 };
};

export function MobileScroll({ slug }: MobileProps) {
  const { durationInFrames } = useVideoConfig();
  const project = getProject(slug);
  const data = project ? mobileCaptureForProject(project) : null;

  if (!project || !data) {
    return (
      <ErrorCard
        title="Mobile capture missing"
        detail={`Run: npm run capture -- ${slug}`}
      />
    );
  }

  const { capture } = data;
  const motion = project.motion;

  return (
    <AbsoluteFill>
      <Backdrop accent={project.accent} />
      <ShowcaseFonts />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <FrameStage durationInFrames={durationInFrames}>
          <PhoneFrame
            screenWidth={MOBILE.screenWidth}
            screenHeight={MOBILE.screenHeight}
          >
            <SteppedScroll
              image={capture.image}
              cssWidth={capture.cssWidth}
              cssHeight={capture.cssHeight}
              viewportWidth={MOBILE.screenWidth}
              viewportHeight={MOBILE.screenHeight}
              stops={capture.stops}
              holdFrames={motion?.holdFrames}
              moveFrames={motion?.moveFrames}
              returnFrames={motion?.returnFrames}
            />
          </PhoneFrame>
        </FrameStage>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

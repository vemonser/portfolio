import { AbsoluteFill } from "remotion";

import { Backdrop } from "./components/Backdrop";
import { ErrorCard } from "./components/ErrorCard";
import { PhoneFrame } from "./components/PhoneFrame";
import { ScreenCrop } from "./components/SteppedScroll";
import {
  STILLS,
  getProject,
  mobileCaptureForProject,
  stillsOffsets,
} from "./data";

export type StillsProps = {
  slug: string;
};

/**
 * Three phones in a row: hero, a selected-work section, the footer. The two
 * side phones sit lower so the middle one reads as the focal point.
 */
export function MobileStills({ slug }: StillsProps) {
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
  const offsets = stillsOffsets(project, capture);

  return (
    <AbsoluteFill>
      <Backdrop accent={project.accent} />
      <AbsoluteFill
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: STILLS.gap,
        }}
      >
        {offsets.map((offset, index) => (
          <div
            key={`${offset}-${index}`}
            style={{
              transform: `translateY(${index === 1 ? 0 : STILLS.sideDrop}px)`,
            }}
          >
            <PhoneFrame
              screenWidth={STILLS.screenWidth}
              screenHeight={STILLS.screenHeight}
            >
              <ScreenCrop
                image={capture.image}
                cssWidth={capture.cssWidth}
                cssHeight={capture.cssHeight}
                viewportWidth={STILLS.screenWidth}
                viewportHeight={STILLS.screenHeight}
                offsetCss={offset}
              />
            </PhoneFrame>
          </div>
        ))}
      </AbsoluteFill>
    </AbsoluteFill>
  );
}

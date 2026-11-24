import { Easing, interpolate, useCurrentFrame } from "remotion";
import type { ReactNode } from "react";

type Props = {
  durationInFrames: number;
  children: ReactNode;
};

/**
 * A breath on the frame itself: 1 → 1.006 → 1 across the whole clip. It
 * returns to where it started, so the loop stays seamless. No transforms on
 * the screenshot's content.
 */
export function FrameStage({ durationInFrames, children }: Props) {
  const frame = useCurrentFrame();
  const progress =
    durationInFrames > 1 ? frame / (durationInFrames - 1) : 0;
  const scale = interpolate(progress, [0, 0.5, 1], [1, 1.006, 1], {
    easing: Easing.inOut(Easing.quad),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "50% 50%",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}

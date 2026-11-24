"use client";

import { useEffect } from "react";

import { useLottie } from "@/features/motion/use-lottie";

import mark from "./not-found-mark.json";
import "./not-found.css";

/** The last frame holds the settled ring with the lime dot at the top. */
const FINAL_FRAME = 43;

/**
 * The 404's one Lottie moment: a hairline ring draws, a lime comet travels one
 * lap and settles into a dot. Decorative, once, and static for a visitor who
 * asked for less motion.
 */
export default function NotFoundMark() {
  const { hostRef, animationRef, ready } = useLottie(mark);

  useEffect(() => {
    if (!ready) return;

    const animation = animationRef.current;
    if (!animation) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      animation.goToAndStop(FINAL_FRAME, true);
      return;
    }

    animation.play();
  }, [ready, animationRef]);

  return (
    <span
      ref={hostRef}
      className="not-found__mark"
      data-lottie-ready={ready ? "true" : "false"}
      aria-hidden="true"
    />
  );
}

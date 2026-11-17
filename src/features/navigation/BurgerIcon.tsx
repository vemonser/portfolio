"use client";

import { useEffect, type ReactNode } from "react";

import { useLottie } from "@/features/motion/use-lottie";

import {
  BURGER_OPEN_FRAME,
  BURGER_REST_FRAME,
  type BurgerMotion,
} from "./burger-frames";
import burgerMenu from "./burger-menu.json";

type Props = {
  motion: BurgerMotion;
  /**
   * Drawn by CSS until the player paints. It keeps the trigger usable on a
   * slow connection and keeps a menu icon for no-JS visitors.
   */
  fallback: ReactNode;
};

export default function BurgerIcon({ motion, fallback }: Props) {
  const { hostRef, animationRef, ready } = useLottie(burgerMenu);

  useEffect(() => {
    const animation = animationRef.current;
    if (!animation || !ready) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (motion === "rest") {
      animation.goToAndStop(BURGER_REST_FRAME, true);
      return;
    }

    if (reduced) {
      animation.goToAndStop(
        motion === "open" ? BURGER_OPEN_FRAME : BURGER_REST_FRAME,
        true,
      );
      return;
    }

    // Lottie infers the playback direction from the segment order, so the
    // close is the authored morph played backwards: no second animation.
    animation.playSegments(
      motion === "open"
        ? [BURGER_REST_FRAME, BURGER_OPEN_FRAME]
        : [BURGER_OPEN_FRAME, BURGER_REST_FRAME],
      true,
    );
  }, [motion, ready, animationRef]);

  return (
    <span
      className="lottie-mark"
      data-motion={motion}
      data-lottie-ready={ready ? "true" : "false"}
      aria-hidden="true"
    >
      {ready ? null : (
        <span className="lottie-mark__fallback">{fallback}</span>
      )}
      <span ref={hostRef} className="lottie-mark__stage" />
    </span>
  );
}

"use client";

import { useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Props = {
  children: ReactNode;
  className?: string;
  /** Overscan that covers the travel without exposing a frame edge. */
  scale?: number | string;
  /** Total one-way travel as a percentage of the media height. */
  travel?: number;
};

/**
 * A quiet vertical drift for media held inside a fixed crop.
 *
 * Scale and travel live on separate elements on purpose: GSAP writes the
 * individual `scale` property when it animates `yPercent`, so putting both on
 * one node would erase the overscan and expose the frame edge. The outer node
 * owns the static scale; the inner node owns the scroll transform.
 *
 * Reduced motion opts out entirely and keeps the static crop.
 */
export default function Parallax({
  children,
  className,
  scale = 1.04,
  travel = 2,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const motionRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = rootRef.current;
      const motion = motionRef.current;
      if (!root || !motion) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        // Set the resting crop in JS too, so a stale stylesheet or a late
        // reduced-motion change can never leave the oversized frame behind.
        root.style.scale = "1";
        return;
      }

      gsap.fromTo(
        motion,
        { yPercent: -travel },
        {
          yPercent: travel,
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        },
      );
    },
    { scope: rootRef, dependencies: [travel] },
  );

  return (
    <div
      ref={rootRef}
      data-parallax
      className={className}
      style={{ scale }}
    >
      <div
        ref={motionRef}
        data-parallax-motion
        className="relative h-full w-full"
      >
        {children}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  children: ReactNode;
  className?: string;
};

/**
 * A quiet vertical drift for media held inside a fixed crop. The constant
 * 1.04 scale covers the ±2% travel exactly, so the frame never shows an edge
 * and the capture's own page margins stay inside the crop. Reduced motion
 * opts out entirely and keeps the static crop.
 */
export default function Parallax({ children, className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const context = gsap.context(() => {
      gsap.fromTo(
        el,
        { yPercent: -2 },
        {
          yPercent: 2,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.6,
          },
        },
      );
    }, el);

    return () => context.revert();
  }, []);

  return (
    <div ref={ref} data-parallax className={className} style={{ scale: 1.04 }}>
      {children}
    </div>
  );
}

"use client";

import { useEffect, useRef, type ReactNode } from "react";

import gsap from "gsap";

import { whenRevealGateOpen } from "@/features/motion/reveal-gate";

type Props = {
  children: ReactNode;
  className?: string;
  frameClassName?: string;
  /** How far the media is pushed in before it settles. */
  scaleFrom?: number;
};

const REVEAL_EASE = "cubic-bezier(0.23, 1, 0.32, 1)";
const REVEAL_DURATION = 1.1;

/**
 * A cover plate the colour of the page, over the frame. When the frame reaches
 * the viewport the plate collapses downward (`scaleY: 1 -> 0`, origin bottom),
 * so the image is uncovered from the top edge down while the media settles from
 * a slight push-in. Both properties are compositor-only: no clip-path, no
 * repaint, no layout.
 *
 * The overlay is in the server markup and hidden by CSS unless JS is running,
 * so a no-JS visitor sees the image and a JS visitor never sees a full-size
 * frame flash before the cover is armed.
 */
export default function ImageReveal({
  children,
  className,
  frameClassName,
  scaleFrom = 1.16,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const frame = root.querySelector<HTMLElement>("[data-frame]");
    const media = root.querySelector<HTMLElement>("[data-media]");
    const overlay = root.querySelector<HTMLElement>("[data-overlay]");
    if (!frame || !media || !overlay) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const settle = () => {
      gsap.set(overlay, { scaleY: 0, transformOrigin: "bottom center" });
      gsap.set(media, { scale: 1 });
      frame.dataset.armed = "true";
      frame.dataset.revealed = "true";
    };

    if (reduced) {
      settle();
      return;
    }

    gsap.set(overlay, { scaleY: 1, transformOrigin: "bottom center" });
    gsap.set(media, { scale: scaleFrom });
    frame.dataset.armed = "true";

    let played = false;
    let timeline: gsap.core.Timeline | null = null;
    let observer: IntersectionObserver | null = null;

    const reveal = () => {
      if (played) return;
      played = true;
      observer?.disconnect();
      observer = null;

      whenRevealGateOpen().then(() => {
        if (!root.isConnected) return;

        overlay.style.willChange = "transform";
        media.style.willChange = "transform";

        const tl = gsap.timeline({
          onComplete: () => {
            overlay.style.willChange = "";
            media.style.willChange = "";
            frame.dataset.revealed = "true";
          },
        });
        timeline = tl;
        tl.to(
          overlay,
          { scaleY: 0, duration: REVEAL_DURATION, ease: REVEAL_EASE },
          0,
        );
        tl.to(
          media,
          { scale: 1, duration: REVEAL_DURATION, ease: REVEAL_EASE },
          0,
        );
      });
    };

    if (!("IntersectionObserver" in window)) {
      reveal();
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (!entries.some((entry) => entry.isIntersecting)) return;
          reveal();
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
      );
      observer.observe(root);
    }

    return () => {
      observer?.disconnect();
      timeline?.kill();
      gsap.killTweensOf([overlay, media]);
      overlay.style.willChange = "";
      media.style.willChange = "";
    };
  }, [scaleFrom]);

  return (
    <div ref={rootRef} className={className}>
      <div
        data-frame
        className={`relative overflow-hidden ${frameClassName ?? ""}`}
      >
        <div data-media className="absolute inset-0">
          {children}
        </div>
        <div
          data-overlay
          aria-hidden="true"
          className="image-reveal__overlay pointer-events-none absolute inset-0"
        />
      </div>
    </div>
  );
}

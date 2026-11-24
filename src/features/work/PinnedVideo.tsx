"use client";

import { useEffect, useRef } from "react";

import BrowserFrame from "./BrowserFrame";
import ProjectVideo from "./ProjectVideo";

type Props = {
  src: string;
  poster: string;
  address: string;
  label: string;
  width: number;
  height: number;
  caption?: string;
  className?: string;
};

/** Must match the 120vh in `.pinned-video` (globals.css). */
const PIN_RATIO = 1.2;
/** Grow for the first 85% of the pin, then hold at full size. */
const GROW_PORTION = 0.85;
/** The small state is 60vw; the base frame is 90vw (or height-capped). */
const START_VW = 0.6;

/**
 * The case-study recording starts small, pins when it reaches the top, and
 * grows with the scroll until it fills 90vw. The whole browser frame scales,
 * chrome included — the video is the object, not a window around it.
 * Mobile keeps the normal inline video (CSS never pins below 768px).
 */
export default function PinnedVideo({
  src,
  poster,
  address,
  label,
  width,
  height,
  caption,
  className,
}: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const frame = frameRef.current;
    if (!wrap || !frame) return;

    const desktop = window.matchMedia("(min-width: 768px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf = 0;

    const update = () => {
      raf = 0;

      if (!desktop.matches || reduced.matches) {
        frame.style.transform = "";
        return;
      }

      const rect = wrap.getBoundingClientRect();
      const pin = window.innerHeight * PIN_RATIO;
      const progress = Math.min(1, Math.max(0, -rect.top / pin));
      const grow = Math.min(1, progress / GROW_PORTION);
      const eased = grow * grow * (3 - 2 * grow);

      const base = frame.offsetWidth || 1;
      const start = Math.min(1, (window.innerWidth * START_VW) / base);
      const scale = start + (1 - start) * eased;
      frame.style.transform = `scale(${scale})`;
    };

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    desktop.addEventListener("change", onScroll);
    reduced.addEventListener("change", onScroll);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      desktop.removeEventListener("change", onScroll);
      reduced.removeEventListener("change", onScroll);
    };
  }, []);

  return (
    <figure className={`m-0 ${className ?? ""}`}>
      <div ref={wrapRef} className="pinned-video">
        <div className="pinned-video__stage">
          <div ref={frameRef} className="pinned-video__frame">
            <BrowserFrame address={address}>
              <ProjectVideo
                src={src}
                poster={poster}
                label={label}
                width={width}
                height={height}
                style={{ aspectRatio: `${width} / ${height}` }}
                className="block w-full"
              />
            </BrowserFrame>
          </div>
        </div>
      </div>
      {caption ? (
        <figcaption className="mt-[var(--space-1)] max-w-[58ch] text-t-14 leading-[1.6] text-warm">
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}

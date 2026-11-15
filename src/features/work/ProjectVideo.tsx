"use client";

import { useEffect, useRef } from "react";

type Props = {
  src: string;
  poster: string;
  label: string;
  className?: string;
};

/**
 * A scroll-through recording. There is no `autoplay` attribute: the observer
 * drives playback so a reduced-motion visitor gets the poster and nothing
 * moves, and an off-screen video does not burn battery.
 */
export default function ProjectVideo({ src, poster, label, className }: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={(el) => {
        // React sets `muted` as a property, not reliably as an attribute; the
        // element needs it before the first play() for autoplay policy.
        ref.current = el;
        if (el) el.muted = true;
      }}
      loop
      playsInline
      muted
      preload="metadata"
      poster={poster}
      aria-label={label}
      className={className}
    >
      <source src={src} type="video/webm" />
    </video>
  );
}

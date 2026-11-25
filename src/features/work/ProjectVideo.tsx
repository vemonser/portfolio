"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { CSSProperties } from "react";

type Props = {
  src: string;
  poster: string;
  label: string;
  className?: string;
  width?: number;
  height?: number;
  style?: CSSProperties;
};

/**
 * A scroll-through recording. There is no `autoplay` attribute: the observer
 * drives playback so a reduced-motion visitor gets the poster and nothing
 * moves, and an off-screen video does not burn battery. A keyboard-accessible
 * toggle lets visitors stop a looping recording that runs longer than five
 * seconds.
 */
export default function ProjectVideo({
  src,
  poster,
  label,
  className,
  width,
  height,
  style,
}: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const videoId = useId();

  useEffect(() => {
    const video = ref.current;
    if (!video) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            video.play().then(() => setPlaying(true)).catch(() => {});
          } else {
            video.pause();
            setPlaying(false);
          }
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    const video = ref.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="relative h-full w-full">
      <video
        ref={(el) => {
          // React sets `muted` as a property, not reliably as an attribute;
          // the element needs it before the first play() for autoplay policy.
          ref.current = el;
          if (el) el.muted = true;
        }}
        id={videoId}
        loop
        playsInline
        muted
        preload="none"
        poster={poster}
        aria-label={label}
        width={width}
        height={height}
        style={style}
        className={className}
      >
        <source
          src={src}
          type={src.endsWith(".mp4") ? "video/mp4" : "video/webm"}
        />
      </video>
      <button
        type="button"
        onClick={toggle}
        aria-controls={videoId}
        className="absolute bottom-3 right-3 z-10 inline-flex min-h-11 items-center border border-bone/30 bg-black/70 px-3 py-2 font-label text-t-12 uppercase tracking-[var(--track)] text-bone backdrop-blur-sm transition-colors duration-200 hover:border-lime hover:text-lime"
      >
        {playing ? "Pause recording" : "Play recording"}
      </button>
    </div>
  );
}

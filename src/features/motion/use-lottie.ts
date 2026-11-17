"use client";

import { useEffect, useRef, useState } from "react";
import type { AnimationItem } from "lottie-web";

/**
 * Mounts a lottie-web SVG player inside a host element and reports when it has
 * painted. The player is imported lazily: the menu icon must not put a ~47KB
 * renderer on the critical path, and the intro can paint its ink cover first.
 *
 * Both callers own playback; this hook only owns the library lifecycle.
 */
export function useLottie(animationData: object) {
  const hostRef = useRef<HTMLSpanElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    setReady(false);

    void import("lottie-web/build/player/lottie_light")
      .then(({ default: lottie }) => {
        if (disposed || !hostRef.current) return;

        const animation = lottie.loadAnimation({
          container: hostRef.current,
          renderer: "svg",
          loop: false,
          autoplay: false,
          animationData,
          rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
        });

        animationRef.current = animation;

        const markReady = () => {
          if (!disposed) setReady(true);
        };

        animation.addEventListener("DOMLoaded", markReady);
        // animationData can settle inside loadAnimation; the event is not
        // guaranteed to fire after a listener is attached.
        if (animation.isLoaded) markReady();
      })
      .catch(() => {
        // The caller keeps its static fallback. A failed chunk must never
        // leave the menu without an icon.
      });

    return () => {
      disposed = true;
      animationRef.current?.destroy();
      animationRef.current = null;
    };
  }, [animationData]);

  return { hostRef, animationRef, ready };
}

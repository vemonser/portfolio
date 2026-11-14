"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { subscribeHeroReady } from "./hero-ready";

/**
 * Gates the hero's entrance. The wordmark and the meta row stay in their
 * starting positions until the scene announces a first frame; a short timer
 * covers a missing announcement (old browser, lost context), and reduced
 * motion skips the choreography entirely.
 *
 * The flag is written straight to the node as a data attribute: this is a
 * one-way DOM signal, not React state, so it costs no re-render.
 */
export default function HeroOverlay({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reveal = () => {
      node.dataset.in = "true";
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      reveal();
      return;
    }

    const failsafe = window.setTimeout(reveal, 1600);
    const unsubscribe = subscribeHeroReady((isReady) => {
      if (!isReady) return;
      window.clearTimeout(failsafe);
      reveal();
    });

    return () => {
      unsubscribe();
      window.clearTimeout(failsafe);
    };
  }, []);

  return (
    <div ref={ref} className="hero-overlay" data-in="false">
      {children}
    </div>
  );
}

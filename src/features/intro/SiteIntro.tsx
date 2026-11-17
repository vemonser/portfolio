"use client";

import { useEffect, useRef, useState } from "react";

import { useLottie } from "@/features/motion/use-lottie";

import introMark from "./intro-mark.json";
import { markIntroSeen, shouldShowIntro } from "./intro-session";
import "./intro.css";

type Phase = "pending" | "playing" | "leaving" | "done";

/** The mark finishes at 0.6s; the hold leaves time to read it. */
const HOLD_MS = 850;
const EXIT_MS = 550;

type Props = {
  brand: string;
};

/**
 * A once-per-session opening title. The pre-paint gate in the layout decides
 * whether the ink cover is armed; this component only plays, holds and leaves.
 * It is decorative: no focus, no pointer capture, no scroll lock. The first
 * real interaction dismisses it and still belongs to the page underneath.
 */
export default function SiteIntro({ brand }: Props) {
  const [phase, setPhase] = useState<Phase>("pending");
  const skipped = useRef(false);
  const { hostRef, animationRef, ready } = useLottie(introMark);

  useEffect(() => {
    const root = document.documentElement;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const armed =
      root.dataset.intro === "run" &&
      shouldShowIntro(window.sessionStorage, reduced);

    if (!armed) {
      root.dataset.intro = "done";
    }

    // The decision reads the DOM the pre-paint gate just wrote; deferring it
    // by a tick keeps the first client render identical to the server one.
    // StrictMode mounts the effect twice: marking the key here instead of in
    // the timeout would make the second mount treat the intro as already seen.
    const decision = window.setTimeout(() => {
      if (skipped.current) return;

      if (!armed) {
        setPhase("done");
        return;
      }

      markIntroSeen(window.sessionStorage);
      setPhase("playing");
    }, 0);

    return () => window.clearTimeout(decision);
  }, []);

  useEffect(() => {
    if (phase !== "playing" || !ready) return;

    const animation = animationRef.current;
    if (!animation) return;

    animation.play();
  }, [phase, ready, animationRef]);

  useEffect(() => {
    if (phase !== "pending" && phase !== "playing") return;
    if (document.documentElement.dataset.intro !== "run") return;

    const skip = () => {
      skipped.current = true;
      // A pending skip still counts as seen: a reload must not replay it.
      markIntroSeen(window.sessionStorage);
      setPhase("leaving");
    };
    const hold =
      phase === "playing" ? window.setTimeout(skip, HOLD_MS) : 0;

    window.addEventListener("pointerdown", skip, { once: true, passive: true });
    window.addEventListener("keydown", skip, { once: true });
    window.addEventListener("wheel", skip, { once: true, passive: true });
    window.addEventListener("touchstart", skip, { once: true, passive: true });

    return () => {
      if (hold) window.clearTimeout(hold);
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchstart", skip);
    };
  }, [phase]);

  /*
   * The exit is timed rather than transitionend: a decorative cover must not
   * be able to strand the page if the browser never fires the event.
   */
  useEffect(() => {
    if (phase !== "leaving") return;

    const exit = window.setTimeout(() => {
      document.documentElement.dataset.intro = "done";
      setPhase("done");
    }, EXIT_MS);

    return () => window.clearTimeout(exit);
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div className="site-intro" data-state={phase} aria-hidden="true">
      <div className="site-intro__inner">
        <span
          ref={hostRef}
          className="site-intro__mark"
          data-lottie-ready={ready ? "true" : "false"}
        />
        <p className="site-intro__name">{brand}</p>
      </div>
    </div>
  );
}

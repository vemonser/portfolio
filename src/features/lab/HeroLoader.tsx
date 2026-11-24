"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import {
  GATE_SCRIPT,
  LOADER_SEEN_KEY,
  gateMode,
  onSceneReady,
  setPhase,
} from "./heroPhase";

/** No count can finish faster than this, however warm the cache is. */
const MIN_MS = 1150;
/** Fonts are what make the name readable; the first scene frame is the rest. */
const FONTS_WEIGHT = 0.55;

function letters(text: string) {
  return [...text].map((char, index) => (
    <span key={`${char}-${index}`} className="ld__char">
      {char}
    </span>
  ));
}

/**
 * The opening plate.
 *
 * The name is not a centred line: it is split at the space and pinned to both
 * page edges at the hero's own size, so the plate already speaks the title's
 * type. The count is real — fonts plus the first painted frame of the scene —
 * and at 100 the two halves squash toward their outer letter, leaving `A S .`,
 * which grows and fades as the field arrives over the plate.
 */
export default function HeroLoader() {
  const [count, setCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [dead, setDead] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const countRef = useRef<HTMLParagraphElement>(null);
  const leaving = useRef(false);

  useEffect(() => {
    // A returning visitor is already handled: the gate hides the plate in CSS
    // before this module even runs, so there is nothing to animate or unmount.
    if (gateMode() === "skip") return;

    const state = { fonts: 0, scene: 0, shown: 0 };
    const started = performance.now();
    let frame = 0;
    let exitTimer = 0;
    let finishTimer = 0;
    let unlockTimer = 0;
    let context: gsap.Context | null = null;

    const stopSceneWatch = onSceneReady(() => {
      state.scene = 1;
    });

    document.fonts?.ready
      .then(() => {
        state.fonts = 1;
        setReady(true);
      })
      .catch(() => {
        state.fonts = 1;
        setReady(true);
      });

    const leave = () => {
      if (leaving.current) return;
      leaving.current = true;
      try {
        window.sessionStorage.setItem(LOADER_SEEN_KEY, "1");
      } catch {
        /* private mode: the gate simply replays next time */
      }
      setCount(100);

      context = gsap.context(() => {
        const timeline = gsap.timeline({
          onComplete: () => {
            setPhase("done");
            setDead(true);
          },
        });
        timeline
          .to(".ld__run--start", { scaleX: 0.02, duration: 0.67, ease: "expo.in" }, 0)
          .to(".ld__run--end", { scaleX: 0.02, duration: 0.67, ease: "expo.in" }, 0)
          .to(countRef.current, { yPercent: -115, duration: 1, ease: "expo.out" }, 0.35)
          .to(".ld__half", { scale: 1.4, duration: 0.5, ease: "expo.inOut" }, 0.84)
          .to(".ld__half", { autoAlpha: 0, duration: 0.1, ease: "expo.in" }, 0.96)
          .to(rootRef.current, { autoAlpha: 0, duration: 0.01 }, 1.06)
          /* The plate is gone; the hero may now arm its reveal. The hero
             itself only promotes `ready` -> `reveal` once it is on screen,
             so nothing animates underneath the plate. */
          .call(() => setPhase("ready"), undefined, 1.06)
          // Hold the phase open until the field has landed, the title has
          // finished rolling and the note has arrived; flipping to `done`
          // earlier would snap them to their settled state.
          .to({ pad: 0 }, { pad: 1, duration: 4.2 }, 0.8);
      }, rootRef);

      unlockTimer = window.setTimeout(() => {
        document.documentElement.style.overflow = "";
      }, 1500);
      finishTimer = window.setTimeout(() => {
        document.documentElement.style.overflow = "";
      }, 4400);
    };

    const tick = (now: number) => {
      const elapsed = Math.max(0, now - started);
      const assets = state.fonts * FONTS_WEIGHT + state.scene * (1 - FONTS_WEIGHT);
      const floor = Math.min(1, elapsed / MIN_MS);
      const target = Math.min(assets, floor);
      state.shown += (target - state.shown) * 0.16;

      const value = target >= 1 && state.shown > 0.985 ? 100 : Math.min(99, Math.floor(state.shown * 100));
      setCount(value);

      if (value >= 100 && exitTimer === 0) {
        exitTimer = window.setTimeout(leave, 260);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(exitTimer);
      window.clearTimeout(finishTimer);
      window.clearTimeout(unlockTimer);
      stopSceneWatch();
      context?.revert();
      document.documentElement.style.overflow = "";
    };
  }, []);

  if (dead) return null;

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: GATE_SCRIPT }} />
      <div
        ref={rootRef}
        className="ld"
        data-ready={ready ? "true" : "false"}
        aria-hidden="true"
      >
        <div className="ld__name">
          <span className="ld__half ld__half--start">
            <span className="ld__hold">A</span>
            <span className="ld__run ld__run--start">{letters("BDELRHMAN")}</span>
          </span>
          <span className="ld__half ld__half--end">
            <span className="ld__hold">S</span>
            <span className="ld__run ld__run--end">{letters("AMY")}</span>
            <span className="ld__hold ld__hold--tail">.</span>
          </span>
        </div>

        <p ref={countRef} className="ld__count">
          {String(count).padStart(3, "0")}
          <span>%</span>
        </p>
      </div>
      <noscript>
        <style>{`.ld{display:none}`}</style>
      </noscript>
    </>
  );
}

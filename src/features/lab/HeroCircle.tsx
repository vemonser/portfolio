"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

import { getPhase, onPhase } from "./heroPhase";

/**
 * Two rings of the same size, drawn on canvas.
 *
 * At rest they sit exactly on top of each other and read as one line. Inside
 * 1.25 diameters the button leans toward the pointer: the frame travels 0.3 of
 * the offset, the inner ring 1.5 of it and the arrow 0.8 — so the rings
 * separate and the arrow lands on their intersection. It is a magnetic pull,
 * not a hover fill, and it releases on its own 150ms after the pointer leaves.
 */
export default function HeroCircle({ label }: { label: string }) {
  const rootRef = useRef<HTMLButtonElement>(null);
  const shiftRef = useRef<HTMLSpanElement>(null);
  const outerRef = useRef<HTMLCanvasElement>(null);
  const innerRef = useRef<HTMLCanvasElement>(null);
  const arrowRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const shift = shiftRef.current;
    const outer = outerRef.current;
    const inner = innerRef.current;
    const arrow = arrowRef.current;
    if (!root || !shift || !outer || !inner || !arrow) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const state = { sweep: getPhase() === "done" ? 1 : 0 };
    /* The arrow rises into the ring and fades in, a beat after the sweep
       starts. The ring transform is written every frame by the loop below. */
    const enter = { p: getPhase() === "done" ? 1 : 0 };
    const mag = { x: 0, y: 0, tx: 0, ty: 0 };
    let color = "#c6f035";
    let releaseTimer = 0;
    let focused = false;
    let frame = 0;
    let disposed = false;
    let stopPhase = () => {};

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (const canvas of [outer, inner]) {
        const px = canvasPx.get(canvas) ?? 0;
        if (!px) continue;
        const context = canvas.getContext("2d");
        if (!context) continue;
        context.clearRect(0, 0, px, px);
        if (state.sweep <= 0) continue;
        const line = 1.15 * dpr;
        const radius = px / 2 - line / 2 - 0.5;
        const start = -Math.PI / 2;
        context.beginPath();
        context.arc(px / 2, px / 2, radius, start, start + Math.PI * 2 * state.sweep);
        context.lineWidth = line;
        context.strokeStyle = color;
        context.stroke();
      }
    };

    const readColor = () => {
      const value = getComputedStyle(root).getPropertyValue("--color-lime").trim();
      if (value) color = value;
    };

    /*
     * Layout reads are cached and refreshed only on resize, never per frame.
     * The previous version called getBoundingClientRect() and offsetHeight
     * every animation frame — a forced synchronous layout 60×/s that ran
     * during the loader too and showed up as a ~1.4s long task on slow
     * devices (the HeroCircle "tick" hot path in the profile). Transforms
     * alone are compositor-only; the reads are what made it expensive.
     */
    let cachedWidth = 1;
    let cachedArrowH = 0;
    // Canvas backing sizes, cached so draw() never reads layout (clientWidth).
    const canvasPx = new Map<HTMLCanvasElement, number>();
    const measure = () => {
      cachedWidth = root.getBoundingClientRect().width || 1;
      cachedArrowH = arrow.offsetHeight || 0;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      for (const canvas of [outer, inner]) {
        const size = canvas.clientWidth;
        if (!size) continue;
        const px = Math.round(size * dpr);
        if (canvas.width !== px || canvas.height !== px) {
          canvas.width = px;
          canvas.height = px;
        }
        canvasPx.set(canvas, px);
      }
    };

    const tick = () => {
      if (disposed) return;

      if (focused && !reduced.matches) {
        mag.tx = cachedWidth * 0.24;
        mag.ty = 0;
      }

      mag.x += (mag.tx - mag.x) * 0.1;
      mag.y += (mag.ty - mag.y) * 0.1;

      shift.style.transform = `translate3d(${mag.x.toFixed(3)}px, ${mag.y.toFixed(3)}px, 0)`;
      inner.style.transform = `translate3d(${(mag.x * 1.5).toFixed(3)}px, ${(mag.y * 1.5).toFixed(3)}px, 0)`;
      const rise = (1 - enter.p) * 1.25 * cachedArrowH;
      arrow.style.transform = `translate3d(${(mag.x * 0.8).toFixed(3)}px, ${(mag.y * 0.8 - rise).toFixed(3)}px, 0)`;
      frame = requestAnimationFrame(tick);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (reduced.matches) return;
      const rect = root.getBoundingClientRect();
      const width = rect.width || 1;
      const cx = rect.left + width / 2;
      const cy = rect.top + rect.height / 2;
      const distance = Math.hypot(event.clientX - cx, event.clientY - cy);

      if (distance < width * 1.25) {
        window.clearTimeout(releaseTimer);
        releaseTimer = 0;
        mag.tx = 0.3 * (event.clientX - cx);
        mag.ty = 0.3 * (event.clientY - cy);
      } else if (releaseTimer === 0) {
        releaseTimer = window.setTimeout(() => {
          releaseTimer = 0;
          mag.tx *= 0.2;
          mag.ty *= 0.2;
        }, 150);
      }
    };

    const onFocus = () => {
      focused = root.matches(":focus-visible");
    };
    const onBlur = () => {
      focused = false;
    };

    const onResize = () => {
      measure();
      readColor();
      draw();
    };

    measure();
    readColor();
    draw();
    // Fonts can change the arrow's box after first paint; re-measure once ready.
    document.fonts?.ready.then(measure, measure);
    frame = requestAnimationFrame(tick);

    const sweep = () => {
      if (reduced.matches) {
        state.sweep = 1;
        enter.p = 1;
        arrow.style.opacity = "1";
        draw();
        return;
      }
      gsap.to(state, {
        sweep: 1,
        duration: 1.1,
        delay: 0.2,
        ease: "power2.out",
        onUpdate: draw,
      });
      gsap.to(enter, {
        p: 1,
        duration: 1.5,
        delay: 1.2,
        ease: "power3.out",
      });
      gsap.fromTo(
        arrow,
        { opacity: 0 },
        { opacity: 1, duration: 1.5, delay: 1.2, ease: "power2.out" },
      );
    };

    const phaseAtMount = getPhase();
    if (phaseAtMount === "done") {
      state.sweep = 1;
      enter.p = 1;
      arrow.style.opacity = "1";
      draw();
    }

    // Subscribe for later transitions (reveal -> sweep, done -> settle).
    const unsubscribe = onPhase((phase) => {
      if (phase === "reveal") sweep();
      if (phase === "done") {
        gsap.killTweensOf(state);
        gsap.killTweensOf(enter);
        state.sweep = 1;
        enter.p = 1;
        arrow.style.opacity = "1";
        draw();
      }
    });
    stopPhase = unsubscribe;

    // Client-nav return to home: the phase is already "reveal" (stale from the
    // first visit), so no transition will fire. Sweep in now so the button is
    // never left invisible waiting for a "reveal" that already happened.
    if (phaseAtMount === "reveal") sweep();

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", onResize);
    root.addEventListener("focus", onFocus);
    root.addEventListener("blur", onBlur);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(releaseTimer);
      gsap.killTweensOf(state);
      gsap.killTweensOf(enter);
      gsap.killTweensOf(arrow);
      stopPhase();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      root.removeEventListener("focus", onFocus);
      root.removeEventListener("blur", onBlur);
    };
  }, []);

  return (
    <button
      ref={rootRef}
      type="button"
      className="hero-circle"
      aria-label={label}
      onClick={() => {
        document
          .getElementById("intro")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    >
      <span ref={shiftRef} className="hero-circle__shift">
        <canvas ref={outerRef} className="hero-circle__ring" aria-hidden="true" />
        <canvas
          ref={innerRef}
          className="hero-circle__ring hero-circle__ring--inner"
          aria-hidden="true"
        />
        <span ref={arrowRef} className="hero-circle__arrow" aria-hidden="true">
          <svg viewBox="0 0 26 27" width="100%" height="100%" fill="none">
            <path
              d="M23.23 12.28 14.75 20.8V.24h-3.4v20.52L2.87 12.28.59 14.56 13.07 27l12.44-12.44-2.28-2.28Z"
              fill="currentColor"
            />
          </svg>
        </span>
      </span>
    </button>
  );
}

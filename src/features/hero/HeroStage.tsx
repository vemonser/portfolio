"use client";

import { useEffect, useRef, useState } from "react";

import { isMenuOpen, subscribeMenu } from "@/features/navigation/menu-store";
import { heroScrollProgress } from "@/features/hero-scene/math";
import { FROZEN_TIME } from "@/features/hero-scene/mercuryScene";
import type { HeroScene } from "@/features/hero-scene/scene";

import { setHeroReady } from "./hero-ready";

const REDUCED = "(prefers-reduced-motion: reduce)";

/**
 * The wave simulator keeps its state in half-float render targets, which is a
 * core WebGL 2 feature. WebGL 1 visitors get the poster instead of a slower,
 * shifted copy of the scene.
 */
function hasWebGL2(): boolean {
  try {
    const probe = document.createElement("canvas");
    return Boolean(window.WebGL2RenderingContext && probe.getContext("webgl2"));
  } catch {
    return false;
  }
}

/**
 * The scene layer. Everything about *whether* the scene should exist lives
 * here, and the module is imported lazily — the poster carries the page until
 * the first frame lands, and it is the whole page for a browser without
 * WebGL 2.
 *
 * There is no viewport gate: the surface is pure shading, so a phone runs the
 * same shader as a desktop. Reduced motion still gets the real thing — one
 * frozen frame at the same drift the posters use — because the alternative is
 * a static image that can never match it.
 */
export default function HeroStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas?.closest("section");
    if (!canvas || !section) return;

    const reduced = window.matchMedia(REDUCED);

    let scene: HeroScene | null = null;
    let loading = false;
    let disposed = false;
    let visible = true;
    let scrollFrame = 0;
    let lastProgress = -1;
    const cleanups: Array<() => void> = [];

    // The menu covers the hero but does not remove it from the viewport, so
    // IntersectionObserver would happily keep the shader running underneath.
    const unsubscribeMenu = subscribeMenu((menuOpen) => {
      if (menuOpen) scene?.stop();
      else if (visible) scene?.start();
    });

    // `?t=` freezes the drift at a chosen second so the poster can be captured
    // from the real material (scripts/poster.mjs) and the scene can be
    // inspected as a still.
    const params = new URLSearchParams(window.location.search);
    const initialTime = Number(params.get("t") ?? 0) || 0;
    const frozenTime = () => (reduced.matches ? FROZEN_TIME : 0);

    const detach = () => {
      loading = false;
      while (cleanups.length) cleanups.pop()?.();
      scene?.dispose();
      scene = null;
      setReady(false);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = section.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      scene?.setPointer(x, y);
    };

    const onPointerEnter = () => scene?.setHover(1);
    const onPointerLeave = () => scene?.setHover(0);
    const onPointerDown = () => scene?.pulse();

    const onScroll = () => {
      if (scrollFrame !== 0) return;
      scrollFrame = requestAnimationFrame(() => {
        scrollFrame = 0;
        const rect = section.getBoundingClientRect();
        const progress = heroScrollProgress(
          rect.top,
          rect.height,
          window.innerHeight,
        );
        scene?.setScroll(progress);

        // The wordmark lags a little behind the section as it leaves, which is
        // what makes the hand-off to the intro feel deliberate. Only write when
        // the value actually moved: this runs on every scroll event.
        if (Math.abs(progress - lastProgress) > 0.001) {
          lastProgress = progress;
          section.style.setProperty("--hero-scroll", progress.toFixed(3));
        }
      });
    };

    const observeVisibility = () => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting && !document.hidden;
          if (visible && !isMenuOpen()) scene?.start();
          else scene?.stop();
        },
        { threshold: 0 },
      );
      observer.observe(section);
      cleanups.push(() => observer.disconnect());

      const onVisibilityChange = () => {
        visible = !document.hidden;
        if (visible && !isMenuOpen()) scene?.start();
        else scene?.stop();
      };
      document.addEventListener("visibilitychange", onVisibilityChange);
      cleanups.push(() =>
        document.removeEventListener("visibilitychange", onVisibilityChange),
      );
    };

    const attach = (instance: HeroScene) => {
      section.addEventListener("pointermove", onPointerMove, { passive: true });
      section.addEventListener("pointerenter", onPointerEnter);
      section.addEventListener("pointerleave", onPointerLeave);
      section.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("scroll", onScroll, { passive: true });

      cleanups.push(() => {
        section.removeEventListener("pointermove", onPointerMove);
        section.removeEventListener("pointerenter", onPointerEnter);
        section.removeEventListener("pointerleave", onPointerLeave);
        section.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("scroll", onScroll);
        if (scrollFrame !== 0) cancelAnimationFrame(scrollFrame);
      });

      observeVisibility();
      onScroll();
      if (!visible || isMenuOpen()) instance.stop();
    };

    const mount = async () => {
      if (scene || loading || disposed) return;

      // No WebGL 2: the poster is the whole scene, and the entrance still runs
      // — a static image should not hold the wordmark hostage.
      if (!hasWebGL2()) {
        setHeroReady(true);
        return;
      }

      loading = true;
      try {
        const { createHeroScene } = await import("@/features/hero-scene/scene");
        if (disposed) return;

        scene = createHeroScene({
          canvas,
          initialTime: initialTime || frozenTime(),
          onFirstFrame: () => {
            if (!disposed) setReady(true);
            setHeroReady(true);
          },
          onContextLost: () => {
            if (disposed) return;
            setReady(false);
            scene?.dispose();
            scene = null;
          },
        });

        attach(scene);
      } catch {
        // A refused context (GPU process gone, too many live contexts) must
        // degrade to the poster, not surface an unhandled error. The entrance
        // still runs so the title is never held hostage.
        setHeroReady(true);
      } finally {
        loading = false;
      }
    };

    void mount();

    // Toggling reduced motion swaps between the live loop and the frozen
    // frame, so the scene is rebuilt rather than reconfigured.
    const onReducedChange = () => {
      detach();
      void mount();
    };

    reduced.addEventListener("change", onReducedChange);

    return () => {
      disposed = true;
      unsubscribeMenu();
      reduced.removeEventListener("change", onReducedChange);
      detach();
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      data-ready={ready ? "true" : "false"}
      className="group absolute inset-0 z-0 overflow-hidden"
    >
      <picture className="absolute inset-0 block opacity-100 transition-opacity duration-700 group-data-[ready=true]:opacity-0">
        <source
          srcSet="/poster/hero-780.avif"
          media="(max-width: 768px)"
          type="image/avif"
        />
        <source srcSet="/poster/hero-1440.avif" type="image/avif" />
        <img
          src="/poster/hero-1440.webp"
          alt=""
          width={1440}
          height={900}
          decoding="async"
          fetchPriority="high"
          className="h-full w-full object-cover object-top"
        />
      </picture>

      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full touch-pan-y opacity-0 transition-opacity duration-700 group-data-[ready=true]:opacity-100"
      />
    </div>
  );
}

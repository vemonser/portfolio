"use client";

import { useEffect, useRef, useState } from "react";

import { heroScrollProgress } from "@/features/hero-scene/math";
import type { HeroScene } from "@/features/hero-scene/scene";

const DESKTOP = "(min-width: 769px)";
const REDUCED = "(prefers-reduced-motion: reduce)";

function hasWebGL(): boolean {
  try {
    const probe = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (probe.getContext("webgl2") ?? probe.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

/**
 * The scene layer. Everything about *whether* three.js should exist lives
 * here, and the module is imported lazily — so a phone, a reduced-motion
 * visitor, or a browser without WebGL never downloads the engine at all.
 * The poster underneath carries the page for all three.
 */
export default function HeroStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = canvas?.closest("section");
    if (!canvas || !section) return;

    const desktop = window.matchMedia(DESKTOP);
    const reduced = window.matchMedia(REDUCED);

    let scene: HeroScene | null = null;
    let loading = false;
    let disposed = false;
    let visible = true;
    const cleanups: Array<() => void> = [];

    // `?scene=1` forces the engine on regardless of viewport. It exists so the
    // poster can be regenerated from the real thing (scripts/poster.mjs) and so
    // the scene can be inspected at phone widths during QA.
    const params = new URLSearchParams(window.location.search);
    const forced = params.has("scene");
    const initialTime = Number(params.get("t") ?? 0) || 0;

    const canRun = () => (desktop.matches || forced) && !reduced.matches;

    const detach = () => {
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
      const rect = section.getBoundingClientRect();
      scene?.setScroll(heroScrollProgress(rect.top, rect.height, window.innerHeight));
    };

    const observeVisibility = () => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting && !document.hidden;
          if (visible) scene?.start();
          else scene?.stop();
        },
        { threshold: 0 },
      );
      observer.observe(section);
      cleanups.push(() => observer.disconnect());

      const onVisibilityChange = () => {
        visible = !document.hidden;
        if (visible) scene?.start();
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
      });

      observeVisibility();
      onScroll();
      if (!visible) instance.stop();
    };

    const mount = async () => {
      if (scene || loading || disposed || !canRun()) return;
      if (!hasWebGL()) return;

      loading = true;
      try {
        const { createHeroScene } = await import("@/features/hero-scene/scene");
        if (disposed || !canRun()) return;

        scene = createHeroScene({
          canvas,
          initialTime,
          onFirstFrame: () => setReady(true),
          onContextLost: () => {
            setReady(false);
            scene?.dispose();
            scene = null;
          },
        });

        attach(scene);
      } finally {
        loading = false;
      }
    };

    void mount();

    const onMediaChange = () => {
      if (canRun()) void mount();
      else detach();
    };

    desktop.addEventListener("change", onMediaChange);
    reduced.addEventListener("change", onMediaChange);

    return () => {
      disposed = true;
      desktop.removeEventListener("change", onMediaChange);
      reduced.removeEventListener("change", onMediaChange);
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
        className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-700 group-data-[ready=true]:opacity-100"
      />
    </div>
  );
}

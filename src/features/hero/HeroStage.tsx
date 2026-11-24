"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

import { POSTER_VERSION } from "@/content/poster-version";
import { isMenuOpen, subscribeMenu } from "@/features/navigation/menu-store";
import { heroScrollProgress } from "@/features/hero-scene/math";
import { FROZEN_TIME } from "@/features/hero-scene/mercuryScene";
import type { HeroScene } from "@/features/hero-scene/scene";
import {
  activeCompressionZone,
  compressionZone,
  type CompressionTarget,
} from "@/features/hero-scene/compression";

const REDUCED = "(prefers-reduced-motion: reduce)";

type CompressionKind = "title" | "project";

/** Poster paths are stable; the version keeps a regenerated frame from being
 * served out of a warm browser cache under the same URL. */
const poster = (file: string) => `/poster/${file}?v=${POSTER_VERSION}`;

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
 * The poster is a frame of the real scene. A visitor who opted out of motion or
 * asked to save data gets that still without starting the renderer: no loop, no
 * GPU context, no battery burn. The chunk is still part of Next's client graph,
 * so this saves execution rather than bytes.
 */
function skipScene(reduced: MediaQueryList): boolean {
  if (reduced.matches) return true;

  const connection = (
    navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }
  ).connection;

  if (connection?.saveData) return true;

  return /(^|-)2g$/.test(connection?.effectiveType ?? "");
}

/**
 * The scene layer. Everything about *whether* the scene should exist lives
 * here, and the module is imported lazily — the poster carries the page until
 * the first frame lands, and it is the whole page for a browser without
 * WebGL 2.
 *
 * It also owns the input side of Liquid Compression: it measures the wordmark
 * and visible project cards, decides which one the pointer or keyboard is on,
 * and hands the scene one normalized zone. The scene owns the easing; this
 * file owns the hit testing.
 */
export default function HeroStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const section = canvas?.closest("section");
    if (!canvas || !section || !stage) return;

    const reduced = window.matchMedia(REDUCED);

    let scene: HeroScene | null = null;
    let loading = false;
    let disposed = false;
    let visible = true;
    let scrollCall: gsap.core.Tween | null = null;
    let lastProgress = -1;
    let pointerCall: gsap.core.Tween | null = null;
    let lastPointer: [number, number] | null = null;
    const cleanups: Array<() => void> = [];

    const setSceneState = (value: "idle" | "running" | "paused" | "off") => {
      stage.dataset.sceneState = value;
    };

    const viewport = () => ({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    /*
     * Hover-only deformation belongs to devices that actually hover. Touch and
     * reduced-motion visitors keep the ambient surface, which is the whole
     * interaction for them.
     */
    const compressionAllowed = () =>
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !reduced.matches;

    const toTarget = (node: HTMLElement): CompressionTarget | null => {
      const rect = node.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return null;
      // A target the viewport cannot see must never drive the shader.
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) return null;

      return {
        rect: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
        },
      };
    };

    const collectTargets = (): CompressionTarget[] => {
      const targets: CompressionTarget[] = [];

      const title = section.querySelector<HTMLElement>("[data-hero-wordmark]");
      if (title) {
        const target = toTarget(title);
        if (target) targets.push(target);
      }

      const cards = document.querySelectorAll<HTMLElement>(
        '[data-compression-target="project"]',
      );
      for (const card of cards) {
        const target = toTarget(card);
        if (target) targets.push(target);
      }

      return targets;
    };

    const contains = (node: HTMLElement, x: number, y: number) => {
      const rect = node.getBoundingClientRect();
      return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
    };

    const kindAt = (x: number, y: number): CompressionKind | null => {
      const title = section.querySelector<HTMLElement>("[data-hero-wordmark]");
      if (title && contains(title, x, y)) return "title";

      const cards = document.querySelectorAll<HTMLElement>(
        '[data-compression-target="project"]',
      );
      for (const card of cards) {
        if (contains(card, x, y)) return "project";
      }

      return null;
    };

    /*
     * Diagnostics, not behaviour: the browser tests need to know that the
     * input layer decided a zone is active, which is otherwise only visible in
     * GPU state. The shader reads the uniform, never this attribute.
     */
    const applyZone = (
      zone: ReturnType<typeof activeCompressionZone>,
      kind: CompressionKind | null,
    ) => {
      scene?.setCompressionZone(zone);
      section.dataset.compressionActive = zone ? "true" : "false";
      if (zone && kind) section.dataset.compressionKind = kind;
      else delete section.dataset.compressionKind;
    };

    const clearZone = () => applyZone(null, null);

    const updatePointerZone = () => {
      pointerCall = null;

      if (!lastPointer || !compressionAllowed() || isMenuOpen()) {
        clearZone();
        return;
      }

      const [x, y] = lastPointer;
      const zone = activeCompressionZone(
        collectTargets(),
        lastPointer,
        viewport(),
        1,
      );
      const kind = zone ? kindAt(x, y) : null;

      applyZone(
        zone && kind === "project"
          ? { ...zone, strength: zone.strength * 0.9 }
          : zone,
        kind,
      );
    };

    const schedulePointerZone = () => {
      if (pointerCall !== null) return;
      pointerCall = gsap.delayedCall(0, updatePointerZone);
    };

    // The menu covers the hero but does not remove it from the viewport, so
    // IntersectionObserver would happily keep the shader running underneath.
    const unsubscribeMenu = subscribeMenu((menuOpen) => {
      if (menuOpen) {
        clearZone();
        scene?.stop();
        setSceneState("paused");
      } else if (visible) {
        scene?.start();
        setSceneState(scene ? "running" : "idle");
        schedulePointerZone();
      }
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
      clearZone();
      setSceneState("idle");
      setReady(false);
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = section.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      scene?.setPointer(x, y);

      if (event.pointerType === "touch") return;
      lastPointer = [event.clientX, event.clientY];
      schedulePointerZone();
    };

    const onPointerEnter = () => scene?.setHover(1);
    const onPointerLeave = () => scene?.setHover(0);
    const onPointerDown = () => scene?.pulse();

    // Cards live below the hero, outside the section: the pointer can be over
    // a compression target without the section ever seeing the event.
    const onDocumentPointerMove = (event: PointerEvent) => {
      if (event.pointerType === "touch") return;
      lastPointer = [event.clientX, event.clientY];
      schedulePointerZone();
    };

    const onDocumentPointerLeave = () => {
      lastPointer = null;
      pointerCall?.kill();
      pointerCall = null;
      clearZone();
    };

    const onFocusIn = (event: FocusEvent) => {
      if (reduced.matches) return;

      const node = (event.target as Element | null)?.closest?.(
        '[data-compression-target="project"]',
      );

      if (!(node instanceof HTMLElement)) {
        clearZone();
        return;
      }

      const target = toTarget(node);
      applyZone(
        target ? compressionZone(target, viewport(), 0.9) : null,
        target ? "project" : null,
      );
    };

    const onFocusOut = () => {
      // Focus may be moving into the pointer's target; the next frame decides
      // from the real state rather than guessing here.
      schedulePointerZone();
    };

    const onResize = () => schedulePointerZone();

    const onScroll = () => {
      if (scrollCall !== null) return;
      scrollCall = gsap.delayedCall(0, () => {
        scrollCall = null;
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

        // The wordmark and cards move with the scroll; a stationary pointer can
        // be over a new target without a pointermove.
        schedulePointerZone();
      });
    };

    const observeVisibility = () => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting && !document.hidden;
          if (visible && !isMenuOpen()) {
            scene?.start();
            setSceneState(scene ? "running" : "idle");
          } else {
            scene?.stop();
            setSceneState("paused");
          }
        },
        { threshold: 0 },
      );
      observer.observe(section);
      cleanups.push(() => observer.disconnect());

      const onVisibilityChange = () => {
        visible = !document.hidden;
        if (visible && !isMenuOpen()) {
          scene?.start();
          setSceneState(scene ? "running" : "idle");
        } else {
          scene?.stop();
          setSceneState("paused");
        }
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
      window.addEventListener("resize", onResize);

      document.addEventListener("pointermove", onDocumentPointerMove, {
        passive: true,
      });
      document.addEventListener("pointerleave", onDocumentPointerLeave);
      document.addEventListener("focusin", onFocusIn);
      document.addEventListener("focusout", onFocusOut);

      cleanups.push(() => {
        section.removeEventListener("pointermove", onPointerMove);
        section.removeEventListener("pointerenter", onPointerEnter);
        section.removeEventListener("pointerleave", onPointerLeave);
        section.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("scroll", onScroll);
        window.removeEventListener("resize", onResize);
        document.removeEventListener("pointermove", onDocumentPointerMove);
        document.removeEventListener("pointerleave", onDocumentPointerLeave);
        document.removeEventListener("focusin", onFocusIn);
        document.removeEventListener("focusout", onFocusOut);
        scrollCall?.kill();
        pointerCall?.kill();
      });

      observeVisibility();
      onScroll();
      if (!visible || isMenuOpen()) {
        instance.stop();
        setSceneState("paused");
      } else {
        setSceneState("running");
      }
    };

    const mount = async () => {
      if (scene || loading || disposed) return;

      // No WebGL 2, reduced motion, or Save-Data: the poster is the whole
      // scene. Nothing else has to know.
      if (!hasWebGL2() || skipScene(reduced)) {
        setSceneState("off");
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
          },
          onContextLost: () => {
            if (disposed) return;
            setReady(false);
            scene?.dispose();
            scene = null;
            clearZone();
            setSceneState("off");
          },
        });

        attach(scene);
      } catch {
        // A refused context (GPU process gone, too many live contexts) must
        // degrade to the poster, not surface an unhandled error.
        setSceneState("off");
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
      ref={stageRef}
      aria-hidden="true"
      data-ready={ready ? "true" : "false"}
      data-scene-state="idle"
      className="group absolute inset-0 z-0 overflow-hidden"
    >
      <picture className="absolute inset-0 block opacity-100 transition-opacity duration-700 group-data-[ready=true]:opacity-0">
        <source
          srcSet={poster("hero-780.avif")}
          media="(max-width: 768px)"
          type="image/avif"
        />
        <source srcSet={poster("hero-1440.avif")} type="image/avif" />
        <img
          src={poster("hero-1440.webp")}
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

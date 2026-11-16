"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { copy } from "@/content/copy";
import Cursor from "@/features/cursor/Cursor";
import type {
  HeroCScene,
  HeroCMetrics,
} from "@/features/hero-scene/heroC/scene";

/*
 * Class names are plain strings, not a CSS module: the project's Turbopack rule
 * pipes every stylesheet through Tailwind, and a `*.module.css` import comes
 * back undefined. The lab stylesheet is global with a `lab-` prefix.
 */
const styles = {
  stage: "lab-stage",
  poster: "lab-poster",
  canvas: "lab-canvas",
  wordmarkWrap: "lab-wordmark-wrap",
  wordmark: "lab-wordmark",
  badge: "lab-badge",
  metrics: "lab-metrics",
  panel: "lab-panel",
  panelHead: "lab-panel-head",
  row: "lab-row",
  buttons: "lab-buttons",
  button: "lab-button",
  hint: "lab-hint",
} as const;

const REDUCED = "(prefers-reduced-motion: reduce)";

function hasWebGL2(): boolean {
  try {
    const probe = document.createElement("canvas");
    return Boolean(window.WebGL2RenderingContext && probe.getContext("webgl2"));
  } catch {
    return false;
  }
}

type Mode = "live" | "poster" | "off";

/**
 * Phase 0 playground for Hero C. Everything the production hero would need is
 * here: the two layers, the fluid mask, the DOM-text texture, the load sweep,
 * the splash, the scroll-open uniform and the poster path. The control panel
 * exists only in this lab.
 */
export default function HeroCLab() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const wordmarkRef = useRef<HTMLHeadingElement>(null);
  const sceneRef = useRef<HeroCScene | null>(null);

  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("live");
  const [metrics, setMetrics] = useState<HeroCMetrics | null>(null);
  const [energy, setEnergy] = useState(1);
  const [reveal, setReveal] = useState(0);
  const [showDom, setShowDom] = useState(false);
  const [panel, setPanel] = useState(true);
  const [posterView, setPosterView] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    const wordmark = wordmarkRef.current;
    if (!canvas || !section || !wordmark) return;

    let disposed = false;
    let scene: HeroCScene | null = null;
    const cleanups: Array<() => void> = [];

    const reduced = window.matchMedia(REDUCED);
    const params = new URLSearchParams(window.location.search);
    const posterParam = params.get("poster");
    const requestedPoster =
      posterParam !== null
        ? Math.min(1, Math.max(0, Number(posterParam) || 0))
        : null;
    const timeParam = Number(params.get("t") ?? 0) || 0;
    queueMicrotask(() => setPosterView(requestedPoster !== null));

    if (!hasWebGL2()) {
      queueMicrotask(() => setMode("off"));
      return;
    }

    // Reduced motion gets the poster path, not a frozen live loop.
    const poster = reduced.matches ? requestedPoster ?? 0.35 : requestedPoster;
    const initialTime = reduced.matches ? timeParam || 2.4 : timeParam;
    const frozen = poster !== null || reduced.matches;

    const toUv = (event: PointerEvent) => {
      const rect = section.getBoundingClientRect();
      return {
        x: (event.clientX - rect.left) / rect.width,
        y: 1 - (event.clientY - rect.top) / rect.height,
      };
    };

    const onMove = (event: PointerEvent) => {
      const point = toUv(event);
      scene?.setPointer(point.x, point.y);
    };

    const onDown = (event: PointerEvent) => {
      onMove(event);
      scene?.pulse();
    };

    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;

      if (event.key === "h" || event.key === "H") setPanel((value) => !value);
      if (event.key === "d" || event.key === "D") setShowDom((value) => !value);
      if (event.key === "s" || event.key === "S") scene?.sweep();
      if (event.key === "r" || event.key === "R") {
        setEnergy(1);
        setReveal(0);
      }
    };

    section.addEventListener("pointermove", onMove, { passive: true });
    section.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    cleanups.push(() => {
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    });

    void import("@/features/hero-scene/heroC/scene")
      .then(({ createHeroCScene }) => {
        if (disposed) return;

        scene = createHeroCScene({
          canvas,
          section,
          wordmark,
          initialTime,
          poster,
          onFirstFrame: () => {
            if (!disposed) setReady(true);
          },
          onMetrics: (next) => {
            if (!disposed) setMetrics(next);
          },
          onContextLost: () => {
            if (disposed) return;
            setReady(false);
            setMode("off");
          },
        });

        sceneRef.current = scene;
        setMode(frozen ? "poster" : "live");
        if (!frozen) scene.start();
      })
      .catch(() => {
        if (!disposed) setMode("off");
      });

    return () => {
      disposed = true;
      cleanups.forEach((cleanup) => cleanup());
      scene?.dispose();
      sceneRef.current = null;
    };
  }, []);

  const applyEnergy = useCallback((value: number) => {
    setEnergy(value);
    sceneRef.current?.setEnergy(value);
  }, []);

  const applyReveal = useCallback((value: number) => {
    setReveal(value);
    sceneRef.current?.setReveal(value);
  }, []);

  const reset = useCallback(() => {
    applyEnergy(1);
    applyReveal(0);
  }, [applyEnergy, applyReveal]);

  const fps = metrics?.fps ?? 0;
  const sim = metrics ? `${metrics.simWidth}×${metrics.simHeight}` : "—";
  const dpr = metrics?.dpr ?? 0;
  const passes = metrics?.passes ?? 0;

  return (
    <>
      <Cursor />
      <section
        ref={sectionRef}
        aria-labelledby="lab-hero-title"
        data-hero-c
        data-ready={ready ? "true" : "false"}
        data-text={ready ? "canvas" : "dom"}
        data-show-dom={showDom ? "true" : "false"}
        className={styles.stage}
      >
      <picture className={styles.poster}>
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
        />
      </picture>

      <canvas
        ref={canvasRef}
        className={styles.canvas}
        aria-hidden="true"
      />

      <div className={styles.badge}>
        <span>
          Lab / <strong>Hero C — The Sheet</strong>
        </span>
        <span>
          {mode === "off" ? (
            <em>no WebGL2 — poster</em>
          ) : mode === "poster" ? (
            <em>frozen poster</em>
          ) : ready ? (
            "live · drag to stir · click to splash"
          ) : (
            "starting scene…"
          )}
        </span>
      </div>

      {!posterView ? (
        <p className={styles.metrics}>
          {`FPS ${fps || "—"}   SIM ${sim}\nDPR ${dpr || "—"}   PASSES ${passes || "—"}`}
        </p>
      ) : null}

      <div className={styles.wordmarkWrap}>
        <h1
          ref={wordmarkRef}
          id="lab-hero-title"
          className={`hero-wordmark ${styles.wordmark}`}
          data-hero-wordmark
        >
          {copy.hero.name}
        </h1>
      </div>

      {!posterView && panel ? (
        <div className={styles.panel}>
          <div className={styles.panelHead}>
            <span>Reveal / energy</span>
            <strong>{mode.toUpperCase()}</strong>
          </div>

          <label className={styles.row}>
            <span>Reveal</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={reveal}
              onChange={(event) => applyReveal(Number(event.target.value))}
            />
            <output>{reveal.toFixed(2)}</output>
          </label>

          <label className={styles.row}>
            <span>Energy</span>
            <input
              type="range"
              min={0}
              max={2}
              step={0.01}
              value={energy}
              onChange={(event) => applyEnergy(Number(event.target.value))}
            />
            <output>{energy.toFixed(2)}</output>
          </label>

          <div className={styles.buttons}>
            <button
              type="button"
              className={styles.button}
              onClick={() => sceneRef.current?.sweep()}
            >
              Sweep
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={() => sceneRef.current?.pulse()}
            >
              Splash
            </button>
            <button type="button" className={styles.button} onClick={reset}>
              Reset
            </button>
            <button
              type="button"
              className={styles.button}
              data-active={showDom ? "true" : "false"}
              onClick={() => setShowDom((value) => !value)}
            >
              DOM text
            </button>
          </div>

          <p className={styles.hint}>
            H hides this panel · D toggles the DOM wordmark for alignment ·
            pointer drag stirs · click splashes
          </p>
        </div>
      ) : null}
      </section>
    </>
  );
}

"use client";

import Link from "next/link";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { copy } from "@/content/copy";
import type { HeroCScene, HeroCMetrics } from "@/features/hero-scene/heroC/scene";

/*
 * Hero Peel — the one-way version of Hero C's sheet.
 *
 * A full-screen canvas is filled with the site's colour and a ghost of the
 * wordmark. Moving the pointer erases it (destination-out); once half of the
 * sheet is gone the rest fades out and the sheet never comes back. The content
 * underneath is either the Hero C fluid scene or the Anom directed-scroll clip.
 *
 * The real h1 lives under the sheet, so SEO, selection and the a11y tree are
 * untouched. The canvas is a visual layer only (aria-hidden, no pointer
 * semantics), and the lab exposes Reveal as the keyboard/touch fallback.
 */

type PeelContent = "fluid" | "video";
type PeelColor = "lime" | "bone" | "black";
type PeelEdge = "torn" | "soft";

const PEEL_COLORS: Record<
  PeelColor,
  { top: string; bottom: string; ghost: string }
> = {
  lime: {
    top: "#c6f035",
    bottom: "#a8cf25",
    ghost: "rgba(23, 22, 20, 0.16)",
  },
  bone: {
    top: "#f5f1e8",
    bottom: "#e1dbcc",
    ghost: "rgba(23, 22, 20, 0.14)",
  },
  black: {
    top: "#0b0b0a",
    bottom: "#181815",
    ghost: "rgba(245, 241, 232, 0.14)",
  },
};

const RELEASE_AT = 0.5;
const BRUSH_RADIUS = 64;
const GRID_COLS = 64;
const GRID_ROWS = 40;
const TAU = Math.PI * 2;

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";

const subscribeReduced = (onChange: () => void) => {
  const media = window.matchMedia(REDUCED_QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
};

const getReduced = () => window.matchMedia(REDUCED_QUERY).matches;

export default function HeroPeelLab() {
  const stageRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const fluidRef = useRef<HTMLCanvasElement>(null);
  const h1Ref = useRef<HTMLHeadingElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const sceneRef = useRef<HeroCScene | null>(null);
  const releaseRef = useRef<(() => void) | null>(null);
  const peeledRef = useRef(false);

  const [content, setContent] = useState<PeelContent>("fluid");
  const [color, setColor] = useState<PeelColor>("lime");
  const [edge, setEdge] = useState<PeelEdge>("torn");
  const [peeled, setPeeled] = useState(false);
  const [coverage, setCoverage] = useState(0);
  const [resetToken, setResetToken] = useState(0);
  const [fluidReady, setFluidReady] = useState(false);
  const [metrics, setMetrics] = useState<HeroCMetrics | null>(null);

  // useSyncExternalStore reads the media query during the hydration commit,
  // before paint, so a reduced-motion visitor never sees the sheet flash.
  const reduced = useSyncExternalStore(
    subscribeReduced,
    getReduced,
    () => false,
  );

  // The fluid content is the Hero C scene with its text texture. The real h1
  // is the wordmark source; the scene hides it after the first frame, exactly
  // as in /lab/hero-c.
  useEffect(() => {
    if (content !== "fluid") return;

    const canvas = fluidRef.current;
    const section = contentRef.current;
    const wordmark = h1Ref.current;
    if (!canvas || !section || !wordmark) return;

    let disposed = false;
    let scene: HeroCScene | null = null;

    void import("@/features/hero-scene/heroC/scene")
      .then(({ createHeroCScene }) => {
        if (disposed) return;
        scene = createHeroCScene({
          canvas,
          section,
          wordmark,
          initialTime: reduced ? 2.4 : 0,
          poster: reduced ? 0.35 : null,
          startPaused: true,
          onFirstFrame: () => {
            if (!disposed) setFluidReady(true);
          },
          onMetrics: (next) => {
            if (!disposed) setMetrics(next);
          },
          onContextLost: () => {
            if (!disposed) setFluidReady(false);
          },
        });
        sceneRef.current = scene;

        // The sheet may have been peeled while the dynamic import was still
        // loading; in that case this scene is the one that must start.
        if (peeledRef.current && !reduced) {
          scene.start();
          scene.sweep();
        }
      })
      .catch(() => {});

    return () => {
      disposed = true;
      scene?.dispose();
      sceneRef.current = null;
      setFluidReady(false);
      setMetrics(null);
    };
  }, [content, reduced]);

  // Video content: play only when motion is allowed. Reduced motion keeps the
  // poster and the h1; the sheet is already open.
  useEffect(() => {
    if (content !== "video") return;
    const video = videoRef.current;
    if (!video) return;

    // The clip waits at its first frame until the sheet releases, so the
    // reveal always starts at the hero rather than mid-scroll.
    const sync = () => {
      if (reduced || !peeled) {
        video.pause();
        if (!peeled) {
          try {
            video.currentTime = 0;
          } catch {
            // Metadata may not be ready yet; canplay/loadeddata retry.
          }
        }
        return;
      }
      void video.play().catch(() => {});
    };

    sync();
    video.addEventListener("loadeddata", sync);
    video.addEventListener("canplay", sync);
    return () => {
      video.removeEventListener("loadeddata", sync);
      video.removeEventListener("canplay", sync);
    };
  }, [content, reduced, peeled]);

  // The sheet. Re-initialised when the content/colour/edge changes or Reset is
  // pressed; changing a control intentionally starts a fresh sheet.
  useIsomorphicLayoutEffect(() => {
    const canvas = overlayRef.current;
    const stage = stageRef.current;
    const h1 = h1Ref.current;
    if (!canvas || !stage || !h1) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (reduced) {
      canvas.style.display = "none";
      canvas.style.pointerEvents = "none";
      stage.dataset.peeled = "true";
      setPeeled(true);
      setCoverage(1);
      releaseRef.current = () => {};
      return;
    }

    let disposed = false;
    let peeledLocal = false;
    let lastPoint: { x: number; y: number } | null = null;
    let touchDown = false;
    let lastReadout = 0;
    let hideTimer = 0;
    let width = 0;
    let height = 0;

    const grid = {
      cells: new Uint8Array(GRID_COLS * GRID_ROWS),
      cleared: 0,
      cellW: 1,
      cellH: 1,
    };

    const colors = PEEL_COLORS[color];

    const measure = () => {
      const rect = stage.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      grid.cellW = width / GRID_COLS;
      grid.cellH = height / GRID_ROWS;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawGhost = () => {
      const stageRect = stage.getBoundingClientRect();
      const range = document.createRange();
      range.selectNodeContents(h1);
      const glyph = range.getBoundingClientRect();
      if (glyph.width < 1 || glyph.height < 1) return;

      const style = window.getComputedStyle(h1);
      const fontSize = Number.parseFloat(style.fontSize);
      if (!Number.isFinite(fontSize) || fontSize < 1) return;

      const raw = (h1.textContent ?? "").trim();
      if (!raw) return;
      const text =
        style.textTransform === "uppercase" ? raw.toUpperCase() : raw;
      const tracking = Number.parseFloat(style.letterSpacing);
      const letterSpacing = Number.isFinite(tracking) ? tracking : 0;
      const centerX = glyph.left - stageRect.left + glyph.width / 2;
      const centerY = glyph.top - stageRect.top + glyph.height / 2;

      ctx.font = `${style.fontStyle} ${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = colors.ghost;

      const trackingContext = ctx as CanvasRenderingContext2D & {
        letterSpacing?: string;
      };
      const supportsTracking =
        "letterSpacing" in (ctx as unknown as Record<string, unknown>);
      if (supportsTracking) trackingContext.letterSpacing = `${letterSpacing}px`;

      const measured = ctx.measureText(text).width;
      const correction =
        measured > 0
          ? Math.min(1.08, Math.max(0.92, glyph.width / measured))
          : 1;

      ctx.save();
      ctx.translate(centerX, 0);
      ctx.scale(correction, 1);
      ctx.translate(-centerX, 0);
      ctx.fillText(text, centerX, centerY);
      ctx.restore();
    };

    const paint = () => {
      measure();
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0, 0, width, height);

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, colors.top);
      gradient.addColorStop(1, colors.bottom);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      drawGhost();
    };

    const markCell = (x: number, y: number, radius: number) => {
      const c0 = Math.max(0, Math.floor((x - radius) / grid.cellW));
      const c1 = Math.min(GRID_COLS - 1, Math.ceil((x + radius) / grid.cellW));
      const r0 = Math.max(0, Math.floor((y - radius) / grid.cellH));
      const r1 = Math.min(GRID_ROWS - 1, Math.ceil((y + radius) / grid.cellH));

      for (let row = r0; row <= r1; row += 1) {
        for (let col = c0; col <= c1; col += 1) {
          const index = row * GRID_COLS + col;
          if (grid.cells[index]) continue;
          const cx = (col + 0.5) * grid.cellW;
          const cy = (row + 0.5) * grid.cellH;
          const dx = cx - x;
          const dy = cy - y;
          if (dx * dx + dy * dy <= radius * radius) {
            grid.cells[index] = 1;
            grid.cleared += 1;
          }
        }
      }
    };

    const stamp = (x: number, y: number) => {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";

      if (edge === "soft") {
        const gradient = ctx.createRadialGradient(
          x,
          y,
          BRUSH_RADIUS * 0.15,
          x,
          y,
          BRUSH_RADIUS,
        );
        gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
        gradient.addColorStop(0.65, "rgba(0, 0, 0, 0.92)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, BRUSH_RADIUS, 0, TAU);
        ctx.fill();
      } else {
        // A smooth lumpy blob: the accumulated stamps read as a torn, lifted
        // edge without the sawtooth a straight-line polygon leaves behind.
        const steps = 14;
        const points: Array<[number, number]> = [];
        for (let i = 0; i < steps; i += 1) {
          const angle = (i / steps) * TAU;
          const wobble =
            Math.sin(i * 1.3 + x * 0.008 + y * 0.006) * 0.1 +
            Math.sin(i * 2.9 - x * 0.005) * 0.05;
          const radius = BRUSH_RADIUS * (0.86 + wobble);
          points.push([
            x + Math.cos(angle) * radius,
            y + Math.sin(angle) * radius,
          ]);
        }
        const midpoint = (
          a: [number, number],
          b: [number, number],
        ): [number, number] => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];

        const first = midpoint(points[steps - 1], points[0]);
        ctx.beginPath();
        ctx.moveTo(first[0], first[1]);
        for (let i = 0; i < steps; i += 1) {
          const next = midpoint(points[i], points[(i + 1) % steps]);
          ctx.quadraticCurveTo(
            points[i][0],
            points[i][1],
            next[0],
            next[1],
          );
        }
        ctx.closePath();
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        ctx.fill();
      }

      ctx.restore();
      markCell(x, y, BRUSH_RADIUS * (edge === "soft" ? 0.8 : 0.95));
    };

    const segment = (x0: number, y0: number, x1: number, y1: number) => {
      const distance = Math.hypot(x1 - x0, y1 - y0);
      const step = BRUSH_RADIUS * 0.32;
      const count = Math.max(1, Math.ceil(distance / step));
      for (let i = 0; i <= count; i += 1) {
        stamp(x0 + ((x1 - x0) * i) / count, y0 + ((y1 - y0) * i) / count);
      }
    };

    const release = () => {
      if (peeledLocal || disposed) return;
      peeledLocal = true;
      peeledRef.current = true;
      stage.dataset.peeled = "true";
      setPeeled(true);
      setCoverage(1);
      canvas.style.pointerEvents = "none";
      canvas.style.opacity = "0";
      if (content === "fluid") {
        sceneRef.current?.start();
        sceneRef.current?.sweep();
      }
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        if (peeledLocal) canvas.style.display = "none";
      }, 520);
    };

    releaseRef.current = release;

    const reset = () => {
      if (disposed) return;
      peeledLocal = false;
      peeledRef.current = false;
      setPeeled(false);
      setCoverage(0);
      stage.dataset.peeled = "false";
      stage.dataset.coverage = "0";
      if (content === "fluid") sceneRef.current?.stop();
      grid.cells.fill(0);
      grid.cleared = 0;
      lastPoint = null;
      touchDown = false;
      lastReadout = 0;
      window.clearTimeout(hideTimer);
      canvas.style.display = "block";
      canvas.style.pointerEvents = "auto";
      canvas.style.opacity = "1";
      paint();
    };

    const readout = (now: number, force = false) => {
      if (!force && now - lastReadout < 90) return;
      lastReadout = now;
      const fraction = grid.cleared / (GRID_COLS * GRID_ROWS);
      stage.dataset.coverage = fraction.toFixed(2);
      setCoverage(fraction);
      if (fraction >= RELEASE_AT) release();
    };

    const toLocal = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      return {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    };

    const onPointerDown = (event: PointerEvent) => {
      if (peeledLocal) return;
      touchDown = event.pointerType === "touch";
      const point = toLocal(event);
      lastPoint = point;
      stamp(point.x, point.y);
      readout(performance.now(), true);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (peeledLocal) return;
      if (event.pointerType === "touch" && !touchDown) return;
      const point = toLocal(event);
      if (lastPoint) {
        segment(lastPoint.x, lastPoint.y, point.x, point.y);
      } else {
        stamp(point.x, point.y);
      }
      lastPoint = point;

      // Release immediately on the crossing move; the 90 ms readout throttle
      // must not delay the one-way transition.
      if (grid.cleared / (GRID_COLS * GRID_ROWS) >= RELEASE_AT) {
        release();
        return;
      }
      readout(performance.now());
    };

    const onPointerUp = () => {
      touchDown = false;
      lastPoint = null;
    };

    const onPointerLeave = () => {
      touchDown = false;
      lastPoint = null;
    };

    reset();

    canvas.addEventListener("pointerdown", onPointerDown, { passive: true });
    canvas.addEventListener("pointermove", onPointerMove, { passive: true });
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);

    const observer = new ResizeObserver(() => {
      if (!peeledLocal) reset();
    });
    observer.observe(stage);

    // The ghost is drawn with the site font; repaint once the font lands,
    // unless the visitor has already started peeling.
    const fontReady = document.fonts?.ready;
    if (fontReady) {
      void fontReady
        .then(() => {
          if (!disposed && !peeledLocal && grid.cleared === 0) paint();
        })
        .catch(() => {});
    }

    return () => {
      disposed = true;
      window.clearTimeout(hideTimer);
      observer.disconnect();
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      releaseRef.current = null;
    };
  }, [content, color, edge, reduced, resetToken]);

  const stateLabel = reduced
    ? "OPEN"
    : peeled
      ? "PEELED"
      : coverage > 0
        ? "PEELING"
        : "COVERED";

  return (
    <section
      ref={stageRef}
      data-hero-peel
        data-peeled={peeled ? "true" : "false"}
        data-coverage={coverage.toFixed(2)}
        data-content={content}
        data-color={color}
        data-edge={edge}
        data-fps={metrics ? String(metrics.fps) : ""}
        aria-labelledby="peel-title"
        className="lab-stage peel-stage"
      >
        <div
          ref={contentRef}
          className="peel-content"
          data-content={content}
          data-text={
            content === "fluid" && fluidReady ? "canvas" : "dom"
          }
          data-ready={
            content === "fluid" && fluidReady ? "true" : "false"
          }
        >
          {content === "video" ? (
            <>
              <video
                ref={videoRef}
                className="peel-media"
                aria-hidden="true"
                muted
                loop
                playsInline
                preload="auto"
                poster="/lab/video/anom-creative-poster.webp"
              >
                <source
                  src="/lab/video/anom-creative-directed.webm"
                  type="video/webm"
                />
              </video>
              <div className="peel-shade" aria-hidden="true" />
            </>
          ) : (
            <canvas ref={fluidRef} className="peel-fluid" aria-hidden="true" />
          )}

          <h1
            ref={h1Ref}
            id="peel-title"
            className="hero-wordmark peel-wordmark"
            data-peel-name
          >
            {copy.hero.name}
          </h1>
        </div>

        <canvas
          ref={overlayRef}
          className="peel-overlay"
          data-edge={edge}
          aria-hidden="true"
        />

        <div className="lab-badge">
          <span>
            Lab / <strong>Hero Peel — one-way sheet</strong>
          </span>
          <span>
            {reduced ? (
              <em>reduced motion — starts revealed</em>
            ) : peeled ? (
              "revealed · it does not come back"
            ) : (
              "move the pointer to peel"
            )}
          </span>
        </div>

        <p className="lab-metrics">
          {`REVEALED ${Math.round(coverage * 100)}%   ${content.toUpperCase()} / ${color.toUpperCase()} / ${edge.toUpperCase()}`}
          {content === "fluid" && metrics
            ? `\nFPS ${metrics.fps || "—"} · SIM ${metrics.simWidth}×${metrics.simHeight}`
            : content === "fluid" && !peeled
              ? "\nSURFACE PAUSED UNTIL PEEL"
              : content === "video"
                ? "\nCLIP 1280×800 · 11.6s"
                : ""}
        </p>

        <div className="lab-panel">
          <div className="lab-panel-head">
            <span>Peel / reveal</span>
            <strong>{stateLabel}</strong>
          </div>

          <div className="lab-control-group">
            <span className="lab-control-label">Content</span>
            <div className="lab-buttons">
              {(["fluid", "video"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className="lab-button"
                  data-active={content === value ? "true" : "false"}
                  onClick={() => setContent(value)}
                >
                  {value === "fluid" ? "Fluid" : "Video"}
                </button>
              ))}
            </div>
          </div>

          <div className="lab-control-group">
            <span className="lab-control-label">Sheet</span>
            <div className="lab-buttons">
              {(["lime", "bone", "black"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className="lab-button"
                  data-active={color === value ? "true" : "false"}
                  onClick={() => setColor(value)}
                >
                  {value[0].toUpperCase() + value.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="lab-control-group">
            <span className="lab-control-label">Edge</span>
            <div className="lab-buttons">
              {(["torn", "soft"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  className="lab-button"
                  data-active={edge === value ? "true" : "false"}
                  onClick={() => setEdge(value)}
                >
                  {value === "torn" ? "Torn" : "Soft"}
                </button>
              ))}
            </div>
          </div>

          <div className="lab-buttons">
            <button
              type="button"
              className="lab-button"
              disabled={reduced}
              onClick={() => releaseRef.current?.()}
            >
              Reveal
            </button>
            <button
              type="button"
              className="lab-button"
              disabled={reduced}
              onClick={() => setResetToken((value) => value + 1)}
            >
              Reset
            </button>
            <Link href="/lab" className="lab-button lab-link">
              ← Lab
            </Link>
          </div>

          <p className="lab-hint">
            Fluid reveals the live Hero C surface; Video reveals the Anom clip,
            paused until you peel. Move over the sheet; it peels once. Changing
            a control starts a fresh sheet.
          </p>
        </div>
      </section>
  );
}

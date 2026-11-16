import gsap from "gsap";
import * as THREE from "three";

import { heroScrollProgress } from "../math";
import { FULLSCREEN_VERT } from "../glsl/composite";
import { FluidField } from "./fluid";
import { HERO_C_FRAG } from "./shader";
import { createTextTexture } from "./textTexture";

/*
 * Hero C — "The Sheet".
 *
 * Two mercury layers (a dark membrane and the chrome room) composited through
 * a GPU Navier–Stokes density field. The pointer stirs the field; the field is
 * the mask. The DOM wordmark is mirrored into a canvas texture so it can live
 * inside the chrome room without leaving the accessibility tree.
 *
 * The scene never owns layout. It reads the h1 box once per resize, keeps the
 * texture in section space, and draws everything on one fullscreen quad.
 */

const PIXEL_RATIO_DESKTOP = 1.5;
const PIXEL_RATIO_TOUCH = 1.25;
const SIM_DESKTOP = 512;
const SIM_TOUCH = 256;
const PRESSURE_DESKTOP = 16;
const PRESSURE_TOUCH = 10;

const AMBIENT_STRENGTH = 0.72;
const POINTER_FORCE = 0.55;
const IDLE_EVERY = 1.7;

export type HeroCMetrics = {
  fps: number;
  simWidth: number;
  simHeight: number;
  dpr: number;
  passes: number;
};

export type HeroCScene = {
  start: () => void;
  stop: () => void;
  dispose: () => void;
  setPointer: (x: number, y: number) => void;
  pulse: () => void;
  setScroll: (progress: number) => void;
  setEnergy: (value: number) => void;
  setReveal: (value: number) => void;
  sweep: () => void;
  getMetrics: () => HeroCMetrics;
};

export type HeroCSceneOptions = {
  canvas: HTMLCanvasElement;
  section: HTMLElement;
  wordmark: HTMLElement;
  initialTime?: number;
  poster?: number | null;
  onFirstFrame?: () => void;
  onContextLost?: () => void;
  onMetrics?: (metrics: HeroCMetrics) => void;
};

const isCoarsePointer = () => window.matchMedia("(pointer: coarse)").matches;

const renderPixelRatio = () =>
  Math.min(
    window.devicePixelRatio || 1,
    isCoarsePointer() ? PIXEL_RATIO_TOUCH : PIXEL_RATIO_DESKTOP,
  );

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

export function createHeroCScene({
  canvas,
  section,
  wordmark,
  initialTime = 0,
  poster = null,
  onFirstFrame,
  onContextLost,
  onMetrics,
}: HeroCSceneOptions): HeroCScene {
  const frozen = initialTime > 0 || poster !== null;
  const startedAt = performance.now();

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: false,
    antialias: false,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x0b0b0a, 1);

  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const quad = new THREE.PlaneGeometry(2, 2);

  const text = createTextTexture(wordmark, section);

  const compositeUniforms = {
    uTime: { value: initialTime },
    uAspect: { value: 1 },
    uDensity: { value: null as THREE.Texture | null },
    uVelocity: { value: null as THREE.Texture | null },
    uSimTexel: { value: new THREE.Vector2(1 / SIM_DESKTOP, 1 / SIM_DESKTOP) },
    uText: { value: text.texture },
    uTextReady: { value: 1 },
    uAmbientCenter: { value: new THREE.Vector2(0.5, 0.12) },
    uAmbientHalf: { value: new THREE.Vector2(0.55, 0.16) },
    uAmbientStrength: { value: poster ?? AMBIENT_STRENGTH },
    uReveal: { value: 0 },
    uPosterReveal: { value: 0 },
    uAccent: { value: new THREE.Color(0xc6f035) },
    uPointer: { value: new THREE.Vector2(0.5, 0.5) },
    uScroll: { value: 0 },
    uDebug: { value: 0 },
  };

  const debugParam = new URLSearchParams(window.location.search).get("debug");
  compositeUniforms.uDebug.value =
    debugParam === "text"
      ? 1
      : debugParam === "density"
        ? 2
        : debugParam === "reveal"
          ? 3
          : debugParam === "chrome"
            ? 4
            : 0;

  const compositeMaterial = new THREE.ShaderMaterial({
    vertexShader: FULLSCREEN_VERT,
    fragmentShader: HERO_C_FRAG,
    uniforms: compositeUniforms,
    depthTest: false,
    depthWrite: false,
  });

  const compositeScene = new THREE.Scene();
  compositeScene.add(new THREE.Mesh(quad, compositeMaterial));

  // --- simulation ---------------------------------------------------------

  let fluid: FluidField | null = null;
  let rebuilds = 0;
  let splatCount = 0;

  const simSize = () => {
    const aspect = Math.max(0.35, canvas.clientWidth / Math.max(1, canvas.clientHeight));
    const max = isCoarsePointer() ? SIM_TOUCH : SIM_DESKTOP;
    if (aspect >= 1) {
      return { width: max, height: Math.max(96, Math.round(max / aspect)) };
    }
    return {
      width: Math.max(72, Math.round(max * aspect)),
      height: max,
    };
  };

  const buildFluid = () => {
    fluid?.dispose();
    const { width, height } = simSize();
    fluid = new FluidField(renderer, width, height, {
      iterations: isCoarsePointer() ? PRESSURE_TOUCH : PRESSURE_DESKTOP,
      aspect: width / height,
    });
    rebuilds += 1;
    section.dataset.rebuilds = String(rebuilds);
    compositeUniforms.uSimTexel.value.set(1 / width, 1 / height);
    compositeUniforms.uDensity.value = fluid.densityTexture;
    compositeUniforms.uVelocity.value = fluid.velocityTexture;
  };

  // --- state --------------------------------------------------------------

  const pointer = { x: 0.5, y: 0.15 };
  const previous = { x: 0.5, y: 0.15 };
  let pointerMoved = false;
  const energy = { value: 1 };
  const reveal = { value: 0 };
  let manualReveal: number | null = null;
  const sweepState = { progress: 0, active: false };
  let pendingSplash = 0;
  let idleClock = 0;
  let seed = 0x9e3779b9;

  const random = () => {
    // Deterministic for a poster run, random enough for idle life.
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };

  let running = false;
  let disposed = false;
  let frameId = 0;
  let lastTime = 0;
  let firstFrameSent = false;
  let frames = 0;
  let fpsWindow = 0;
  let lastFps = 0;

  const easeReveal = gsap.quickTo(reveal, "value", {
    duration: 0.6,
    ease: "power2.out",
  });

  const updateAmbient = () => {
    const box = text.box();
    const rect = section.getBoundingClientRect();
    if (!box || rect.width < 2 || rect.height < 2) return;

    compositeUniforms.uAmbientCenter.value.set(
      (box.left + box.width / 2) / rect.width,
      1 - (box.top + box.height / 2) / rect.height,
    );
    compositeUniforms.uAmbientHalf.value.set(
      ((box.width / 2) / rect.width) * 1.4,
      ((box.height / 2) / rect.height) * 1.6,
    );
    section.dataset.ambient = `${compositeUniforms.uAmbientCenter.value.x.toFixed(2)},${compositeUniforms.uAmbientCenter.value.y.toFixed(2)} ${compositeUniforms.uAmbientHalf.value.x.toFixed(2)},${compositeUniforms.uAmbientHalf.value.y.toFixed(2)}`;
  };

  // --- input --------------------------------------------------------------

  const splatPointer = () => {
    pointerMoved = false;
    if (!fluid) return;

    const dx = pointer.x - previous.x;
    const dy = pointer.y - previous.y;
    const distance = Math.hypot(dx, dy);

    // A jump is a re-entry, not a stroke: move the origin without painting a
    // line across the whole sheet.
    if (distance > 0.22) {
      previous.x = pointer.x;
      previous.y = pointer.y;
      return;
    }

    if (distance < 0.0004) return;

    const amount = Math.min(1.0, 0.16 + distance * 4) * energy.value;
    fluid.splat(
      pointer.x,
      pointer.y,
      dx * POINTER_FORCE,
      dy * POINTER_FORCE,
      amount,
      0.00085,
    );
    splatCount += 1;
    section.dataset.splats = String(splatCount);

    previous.x = pointer.x;
    previous.y = pointer.y;
  };

  const runSweep = () => {
    if (!fluid || !sweepState.active) return;

    const progress = sweepState.progress;
    const y =
      compositeUniforms.uAmbientCenter.value.y +
      Math.sin(progress * Math.PI) * 0.022;
    const x = 0.1 + progress * 0.8;
    fluid.splat(
      x,
      y,
      0.0055,
      0,
      0.045 * Math.max(0.35, energy.value),
      0.0019,
    );
    compositeUniforms.uPointer.value.set(x, y);
  };

  const runIdle = (dt: number) => {
    if (!fluid || energy.value < 0.05) return;
    idleClock += dt;
    if (idleClock < IDLE_EVERY) return;
    idleClock = 0;

    const x = 0.16 + random() * 0.68;
    const y =
      compositeUniforms.uAmbientCenter.value.y + (random() - 0.5) * 0.24;
    fluid.splat(x, y, (random() - 0.5) * 0.001, 0.0008, 0.028 * energy.value, 0.0035);
  };

  const runSplash = () => {
    if (!fluid || pendingSplash <= 0) return;
    pendingSplash = 0;

    const cx = compositeUniforms.uPointer.value.x;
    const cy = compositeUniforms.uPointer.value.y;
    const count = 14;
    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      fluid.splat(
        cx + dx * 0.012,
        cy + dy * 0.012,
        dx * 0.006,
        dy * 0.006,
        0.06 * energy.value,
        0.0022,
      );
    }
  };

  // --- draw ---------------------------------------------------------------

  const draw = (seconds: number) => {
    if (disposed) return;

    const dt = lastTime > 0 ? Math.min(seconds - lastTime, 1 / 20) : 1 / 60;
    lastTime = seconds;

    if (fluid && !frozen) {
      fluid.metrics.passes = 0;
      if (pointerMoved) splatPointer();
      runSweep();
      runIdle(dt);
      runSplash();
      fluid.step(dt);
    }

    compositeUniforms.uTime.value = seconds;
    compositeUniforms.uReveal.value = reveal.value;
    compositeUniforms.uPointer.value.set(pointer.x, pointer.y);
    if (fluid) {
      compositeUniforms.uDensity.value = fluid.densityTexture;
      compositeUniforms.uVelocity.value = fluid.velocityTexture;
    }

    renderer.setRenderTarget(null);
    renderer.render(compositeScene, camera);

    if (!firstFrameSent) {
      firstFrameSent = true;
      onFirstFrame?.();
    }

    frames += 1;
    if (fpsWindow === 0) fpsWindow = seconds;
    if (seconds - fpsWindow >= 0.5) {
      lastFps = frames / (seconds - fpsWindow);
      frames = 0;
      fpsWindow = seconds;

      const metrics = getMetrics();
      section.dataset.fps = lastFps.toFixed(0);
      section.dataset.sim = `${metrics.simWidth}x${metrics.simHeight}`;
      onMetrics?.(metrics);
    }
  };

  const getMetrics = (): HeroCMetrics => ({
    fps: Math.round(lastFps),
    simWidth: fluid?.metrics.width ?? 0,
    simHeight: fluid?.metrics.height ?? 0,
    dpr: Number(renderPixelRatio().toFixed(2)),
    passes: fluid?.metrics.passes ?? 0,
  });

  const loop = () => {
    if (!running) return;
    draw(performance.now() / 1000 - startedAt);
    frameId = requestAnimationFrame(loop);
  };

  const start = () => {
    if (running || disposed || frozen) return;
    running = true;
    lastTime = 0;
    frameId = requestAnimationFrame(loop);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(frameId);
    frameId = 0;
  };

  // --- lifecycle ----------------------------------------------------------

  const resize = () => {
    if (disposed) return;

    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    const aspect = width / height;

    renderer.setPixelRatio(renderPixelRatio());
    renderer.setSize(width, height, false);
    compositeUniforms.uAspect.value = aspect;

    const currentAspect = fluid
      ? fluid.metrics.width / fluid.metrics.height
      : 0;

    // A fluid field is tied to its grid aspect: rebuilding on a big shape
    // change is cheaper than stretching every vortex.
    if (!fluid || Math.abs(currentAspect - aspect) / aspect > 0.08) {
      buildFluid();
    }

    text.sync();
    updateAmbient();
    draw(frozen ? initialTime : performance.now() / 1000 - startedAt);
  };

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  const onLost = (event: Event) => {
    event.preventDefault();
    stop();
    onContextLost?.();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  const onVisibility = () => {
    if (!document.hidden) start();
    else stop();
  };
  document.addEventListener("visibilitychange", onVisibility);

  const intersection = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !document.hidden) start();
      else stop();
    },
    { threshold: 0 },
  );
  intersection.observe(section);

  const onScroll = () => {
    if (manualReveal !== null) return;
    const rect = section.getBoundingClientRect();
    easeReveal(heroScrollProgress(rect.top, rect.height, window.innerHeight));
  };

  if (!frozen) window.addEventListener("scroll", onScroll, { passive: true });

  const onResize = () => resize();
  window.addEventListener("resize", onResize);

  const sweep = () => {
    if (!fluid || frozen) return;
    sweepState.progress = 0;
    sweepState.active = true;
    gsap.to(sweepState, {
      progress: 1,
      duration: 1.2,
      ease: "sine.inOut",
      onComplete: () => {
        sweepState.active = false;
      },
    });
  };

  resize();

  // Fonts change the painted box after the first measurement; re-sync the
  // texture and the ambient ellipse once they land.
  const fontReady = document.fonts?.ready;
  if (fontReady) {
    void fontReady
      .then(() => {
        if (disposed) return;
        text.sync();
        updateAmbient();
        draw(frozen ? initialTime : performance.now() / 1000 - startedAt);
      })
      .catch(() => {});
  }

  if (frozen) {
    // Poster/frozen frame: fill the field along the same path the live sweep
    // uses, then render once. Deterministic for a given `t`/`poster` pair.
    const field = fluid as FluidField | null;
    if (field && poster !== null) {
      const target = initialTime || 2.4;
      field.warmUp(target, (progress) => {
        const y =
          compositeUniforms.uAmbientCenter.value.y +
          Math.sin(progress * Math.PI) * 0.022;
        const x = 0.1 + progress * 0.8;
        field.splat(x, y, 0.0055, 0, 0.045, 0.0019);
      });
      draw(target);
    } else {
      draw(initialTime);
    }
  } else {
    gsap.delayedCall(0.35, () => {
      if (disposed) return;
      sweep();
    });
  }

  if (process.env.NODE_ENV !== "production") {
    (
      window as unknown as {
        __heroC?: {
          textCanvas: HTMLCanvasElement;
          uniforms: typeof compositeUniforms;
          metrics: () => HeroCMetrics;
          textDebug: () => Record<string, unknown> | null;
          syncText: () => void;
        };
      }
    ).__heroC = {
      textCanvas: text.texture.image as HTMLCanvasElement,
      uniforms: compositeUniforms,
      metrics: getMetrics,
      textDebug: text.debug,
      syncText: text.sync,
    };
  }

  return {
    start,
    stop,
    setPointer(x, y) {
      pointer.x = clamp01(x);
      pointer.y = clamp01(y);
      pointerMoved = true;
    },
    pulse() {
      pendingSplash = 1;
    },
    setScroll(progress) {
      manualReveal = clamp01(progress);
      easeReveal(manualReveal);
    },
    setEnergy(value) {
      energy.value = Math.min(2, Math.max(0, value));
    },
    setReveal(value) {
      manualReveal = clamp01(value);
      easeReveal(manualReveal);
    },
    sweep,
    getMetrics,
    dispose() {
      disposed = true;
      stop();
      observer.disconnect();
      intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      canvas.removeEventListener("webglcontextlost", onLost);
      gsap.killTweensOf(reveal);
      gsap.killTweensOf(sweepState);
      text.dispose();
      fluid?.dispose();
      compositeMaterial.dispose();
      quad.dispose();
      renderer.dispose();
    },
  };
}

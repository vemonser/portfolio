import gsap from "gsap";
import * as THREE from "three";

import { COMPOSITE_GLSL, FULLSCREEN_VERT } from "./glsl/composite";
import { RIPPLE_GLSL } from "./glsl/ripple";
import type { HeroScene, HeroSceneOptions } from "./types";

/*
 * Mercury: the whole hero is two fullscreen triangles and two small wave
 * buffers. There is no mesh to tessellate, no HDR to download and no lights —
 * the metal is a function, so it renders at display resolution and stays cheap
 * enough to run on a phone.
 *
 * The wave simulation is the interaction layer. Every frame it steps a damped
 * wave equation over a ping-pong pair of render targets; the cursor injects a
 * capsule of force along the path it travelled since the last frame. The
 * composite pass then reads the wave height and slope to displace the metal.
 *
 * The wordmark is real HTML above this canvas — it is the page's h1 and it
 * reacts to its own hover, so the scene never draws text.
 */

// Calm by design: the surface should read as slow liquid, not a storm. The
// drift speeds live in the shaders; these are the input/energy dials.
const RIPPLE_FORCE = 0.42;
const RIPPLE_RADIUS = 0.018;
const RIPPLE_AMP = 0.005;

const DISPERSION = 2.4;
const SHEEN = 3.2;
const IDLE_WARP = 0.22;

/** Seconds of drift for the frozen frame (reduced motion, poster capture). */
export const FROZEN_TIME = 2.4;

const PIXEL_RATIO_DESKTOP = 1.5;
const PIXEL_RATIO_TOUCH = 1.25;

const isCoarsePointer = () => window.matchMedia("(pointer: coarse)").matches;

const renderPixelRatio = () =>
  Math.min(
    window.devicePixelRatio || 1,
    isCoarsePointer() ? PIXEL_RATIO_TOUCH : PIXEL_RATIO_DESKTOP,
  );

/** Wave buffers are small on purpose: the look comes from propagation, not texel precision. */
const rippleResolution = () => (isCoarsePointer() ? 256 : 384);

export function createMercuryScene({
  canvas,
  initialTime = 0,
  onFirstFrame,
  onContextLost,
}: HeroSceneOptions): HeroScene {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    // The wake is made of shading, not geometry — MSAA has no edges to smooth
    // here and only costs fill rate.
    alpha: false,
    antialias: false,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x0b0b0a, 1);

  const quad = new THREE.PlaneGeometry(2, 2);
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // --- wave simulation ----------------------------------------------------

  const rippleSize = rippleResolution();
  const makeTarget = () =>
    new THREE.WebGLRenderTarget(rippleSize, rippleSize, {
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    });

  const rippleTargets = [makeTarget(), makeTarget()];
  let rippleIndex = 0;

  const rippleUniforms = {
    uState: { value: null as THREE.Texture | null },
    uTexel: { value: new THREE.Vector2(1 / rippleSize, 1 / rippleSize) },
    uA: { value: new THREE.Vector2(0.5, 0.5) },
    uB: { value: new THREE.Vector2(0.5, 0.5) },
    uForce: { value: 0 },
    uRadius: { value: RIPPLE_RADIUS },
    uAspect: { value: 1 },
  };

  const rippleMaterial = new THREE.ShaderMaterial({
    vertexShader: FULLSCREEN_VERT,
    fragmentShader: RIPPLE_GLSL,
    uniforms: rippleUniforms,
    depthTest: false,
    depthWrite: false,
  });

  const rippleScene = new THREE.Scene();
  rippleScene.add(new THREE.Mesh(quad, rippleMaterial));

  // --- composite ----------------------------------------------------------

  const compositeUniforms = {
    uTime: { value: 0 },
    uAspect: { value: 1 },
    uRipple: { value: null as THREE.Texture | null },
    uRippleAmp: { value: RIPPLE_AMP },
    uDispersion: { value: DISPERSION },
    uSheen: { value: SHEEN },
    uWarp: { value: IDLE_WARP },
    uWarpDrift: { value: 0 },
    uScroll: { value: 0 },
    uAccent: { value: new THREE.Color(0xc6f035) },
    uPointer: { value: new THREE.Vector2(0.5, 0.5) },
    uCompressionCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uCompressionHalfSize: { value: new THREE.Vector2(0.2, 0.08) },
    uCompressionDirection: { value: new THREE.Vector2(1, 0) },
    uCompressionStrength: { value: 0 },
  };

  const compositeMaterial = new THREE.ShaderMaterial({
    vertexShader: FULLSCREEN_VERT,
    fragmentShader: COMPOSITE_GLSL,
    uniforms: compositeUniforms,
    depthTest: false,
    depthWrite: false,
  });

  const compositeScene = new THREE.Scene();
  compositeScene.add(new THREE.Mesh(quad, compositeMaterial));

  // --- input state --------------------------------------------------------

  const frozen = initialTime > 0;
  const pointer = { x: 0.5, y: 0.5 };
  const previous = { x: 0.5, y: 0.5 };
  const hover = { value: 0 };
  const scroll = { value: 0 };
  let moved = false;
  let burst = 0;
  let disposed = false;

  const easeHover = gsap.quickTo(hover, "value", { duration: 0.8, ease: "power2.out" });
  const easeScroll = gsap.quickTo(scroll, "value", { duration: 1.1, ease: "power2.out" });

  /*
   * Liquid compression. Positional values travel to a new target over 300ms
   * while strength is quicked over 350ms. On release only strength falls — the
   * centre stays where it was, so the fold collapses in place instead of
   * shooting back to the middle of the screen.
   */
  const compression = {
    centerX: 0.5,
    centerY: 0.5,
    halfX: 0.2,
    halfY: 0.08,
    strength: 0,
  };

  const easeCompression = gsap.quickTo(compression, "strength", {
    duration: 0.35,
    ease: "power2.out",
  });

  // --- drawing ------------------------------------------------------------

  let running = false;
  let frameId = 0;
  let firstFrameSent = false;
  const startedAt = performance.now() - initialTime * 1000;
  let currentTime = initialTime;

  const stepRipple = (force: number) => {
    rippleUniforms.uState.value = rippleTargets[rippleIndex].texture;
    rippleUniforms.uA.value.set(previous.x, previous.y);
    rippleUniforms.uB.value.set(pointer.x, pointer.y);
    rippleUniforms.uForce.value = force;

    renderer.setRenderTarget(rippleTargets[1 - rippleIndex]);
    renderer.render(rippleScene, camera);
    rippleIndex = 1 - rippleIndex;
    renderer.setRenderTarget(null);
  };

  const draw = (seconds: number) => {
    currentTime = seconds;

    const force = moved ? RIPPLE_FORCE * (0.4 + 0.6 * hover.value) : 0;
    const impulse = Math.max(force, burst * 1.1);
    burst = 0;
    moved = false;

    stepRipple(impulse);
    previous.x = pointer.x;
    previous.y = pointer.y;

    compositeUniforms.uTime.value = seconds;
    compositeUniforms.uWarpDrift.value = seconds * 0.06;
    compositeUniforms.uScroll.value = scroll.value;
    compositeUniforms.uWarp.value = IDLE_WARP + scroll.value * 0.55;
    compositeUniforms.uPointer.value.set(pointer.x, pointer.y);
    compositeUniforms.uRipple.value = rippleTargets[rippleIndex].texture;

    compositeUniforms.uCompressionCenter.value.set(
      compression.centerX,
      compression.centerY,
    );
    compositeUniforms.uCompressionHalfSize.value.set(
      compression.halfX,
      compression.halfY,
    );
    compositeUniforms.uCompressionStrength.value = compression.strength;

    renderer.render(compositeScene, camera);

    if (!firstFrameSent) {
      firstFrameSent = true;
      onFirstFrame?.();
    }
  };

  const loop = () => {
    if (!running) return;
    draw((performance.now() - startedAt) / 1000);
    frameId = requestAnimationFrame(loop);
  };

  const start = () => {
    if (running) return;
    running = true;
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

    renderer.setPixelRatio(renderPixelRatio());
    renderer.setSize(width, height, false);

    const aspect = width / height;
    compositeUniforms.uAspect.value = aspect;
    rippleUniforms.uAspect.value = aspect;

    draw(currentTime);
  };

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  const onLost = (event: Event) => {
    event.preventDefault();
    stop();
    onContextLost?.();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  resize();

  return {
    setPointer(x, y) {
      const nx = Math.min(1, Math.max(0, x * 0.5 + 0.5));
      const ny = Math.min(1, Math.max(0, y * 0.5 + 0.5));
      const jump = Math.hypot(nx - pointer.x, ny - pointer.y) > 0.25;
      pointer.x = nx;
      pointer.y = ny;

      // The wordmark swallows events while the cursor is over it, so the next
      // move can land far from the last one. That is a new entry, not a
      // stroke — move the segment origin instead of painting a line across
      // the surface.
      if (jump) {
        previous.x = nx;
        previous.y = ny;
        return;
      }

      moved = true;
    },
    setHover(intensity) {
      easeHover(Math.min(1, Math.max(0, intensity)));
    },
    pulse() {
      burst = 1;
    },
    setScroll(progress) {
      easeScroll(Math.min(1, Math.max(0, progress)));
    },
    setCompressionZone(zone) {
      if (!zone || zone.strength <= 0) {
        // Release: collapse the fold where it is. The next activation will
        // slide the centre over; the surface never teleports.
        easeCompression(0);
        return;
      }

      gsap.to(compression, {
        centerX: zone.center[0],
        centerY: zone.center[1],
        halfX: zone.halfSize[0],
        halfY: zone.halfSize[1],
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });
      easeCompression(zone.strength);
    },
    start: frozen ? () => {} : start,
    stop,
    dispose() {
      disposed = true;
      stop();
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      gsap.killTweensOf([hover, scroll, compression]);
      rippleTargets.forEach((target) => target.dispose());
      rippleMaterial.dispose();
      compositeMaterial.dispose();
      quad.dispose();
      renderer.dispose();
      // Deliberately no forceContextLoss: in development, Fast Refresh (and
      // StrictMode) tears the effect down and mounts again on the same canvas.
      // A forced loss poisons that canvas — the next WebGLRenderer gets a null
      // context and the hero falls back to the poster until a full reload.
      // dispose() releases the programs and targets; the context is reclaimed
      // with the element.
    },
  };
}

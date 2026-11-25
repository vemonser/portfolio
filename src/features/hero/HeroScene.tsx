"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import {
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector4,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";

import {
  gateMode,
  getPhase,
  onPhase,
  signalSceneReady,
} from "@/features/lab/heroPhase";
import { markHeroReady } from "@/features/hero/scene-ready";

const MAX_PUFFS = 40;
const TRAIL_W = 256;
const TRAIL_H = 144;

/*
 * Slot 0 is the cursor itself, not part of the trail: it is reset every frame
 * so a still pointer keeps one soft bend under it instead of stacking puffs
 * until the smoke saturates. The trail starts at 1.
 */
const POINTER_PUFF = 0;
const TRAIL_START = 1;

/* Minimum screen distance between two trail stamps, as a fraction of the
 * canvas height, so the spacing reads the same at any viewport. */
const EMIT_SPACING = 0.008;
/* How fast the emitter closes on the pointer, in 1/s. High enough that the
 * wake sits under the cursor rather than a beat behind it. */
const FOLLOW_RATE = 46;
/* Stamps per frame. A fast flick is allowed to lag for a frame or two rather
 * than flood the trail pool and wipe the tail. */
const MAX_STAMPS = 14;

const VERT = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/** One pass that stamps every live puff into a small target. */
const TRAIL_FRAG = /* glsl */ `
precision highp float;

uniform vec4 uPuffs[${MAX_PUFFS}];
uniform float uAspect;
varying vec2 vUv;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

void main() {
  float sum = 0.0;
  float head = 0.0;
  for (int i = 0; i < ${MAX_PUFFS}; i++) {
    vec4 puff = uPuffs[i];
    if (puff.w <= 0.0) continue;
    vec2 d = (vUv - puff.xy) * vec2(uAspect, 1.0);
    float falloff = exp(-dot(d, d) / max(puff.z * puff.z, 1e-6) * 2.6);
    // Internal structure, so the warp reads as smoke and not as a sphere.
    float body = 0.82 + 0.18 * valueNoise(vUv * 7.0 + puff.x * 3.0);
    float weight = falloff * puff.w * body;
    sum += weight;
    if (i == 0) head = weight;
  }
  // Red carries the wake; green carries the pointer head so the composite can
  // tint only the newest part of it.
  gl_FragColor = vec4(min(sum, 1.0), min(head, 1.0), 0.0, 1.0);
}
`;

/**
 * The field, ported from the reference's own background shader.
 *
 * The shape is not a noise texture with a light on top — it is two squared
 * value-noise octaves whose *frequency depends on distance* from two fixed
 * anchors (the centre, then the top-left corner), plus a per-pixel grain,
 * through smoothstep(0, 2). That is what gives the reference its few huge
 * soft cells near the middle and finer detail at the edges. The smoke target
 * does not add light: it bends the sample position, so the pattern itself
 * smears around the pointer.
 */
const FRAG = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uReveal;
uniform sampler2D uSmoke;
varying vec2 vUv;

#define PI 3.14159265359

float rand(vec2 st) {
  st = fract(st * vec2(123.34, 456.21));
  st += dot(st, st + 45.32);
  return fract(st.x * st.y);
}

float ns(vec2 p) {
  vec2 ip = floor(p);
  vec2 u = fract(p);
  // Quintic, not cubic: the reference's cubic interpolation leaves its cell
  // diagonals visible as straight creases once the field is this dark. The
  // cell layout — and so the shape — is identical.
  u = u * u * u * (u * (u * 6.0 - 15.0) + 10.0);
  float res = mix(
    mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x),
    mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x),
    u.y
  );
  return res * res;
}

void main() {
  vec2 m = vUv;

  vec4 n = texture2D(uSmoke, vUv);
  float z = n.r * 2.0 * PI;
  vec2 dr = vec2(sin(z));
  vec2 uv = vUv + dr * n.r * 0.10;

  float d1 = distance(uv, vec2(0.5));
  float d2 = distance(uv, vec2(0.0, 1.0));

  // Their clock advances 0.05 per frame at 60fps, so one second is 3 units.
  float t = uTime * 3.0;
  float gr = mix(-0.2, 0.2, rand(uv + vec2(t * 0.03)));
  vec2 mv = vec2(t * 0.05, t * -0.05);

  float f = ns((uv * d1 * 2.0) + mv);
  f += ns((uv * d2 * 2.2) + vec2(t * -0.075, t * 0.05)) * 0.8;
  f += gr;
  f = smoothstep(0.0, 2.0, f + 0.34);

  vec3 color = mix(vec3(0.0), vec3(0.15), f);

  /*
   * The wake is warm off-white at a low ceiling. The head gets the only lime
   * in the field — a suggestion, never a second light source.
   */
  vec3 warm = vec3(0.94, 0.90, 0.82);
  vec3 accent = vec3(0.60, 0.78, 0.16);
  color += warm * n.r * 0.24;
  color += accent * n.g * 0.04;

  // Symmetric, very soft edge: both sides leave equally, so the composition
  // never looks like a dark patch pasted onto the right.
  float side = smoothstep(0.95, 0.28, length((vUv - 0.5) * vec2(0.62, 1.0)));
  color *= mix(0.84, 1.0, side);

  // Reveal edge, in screen space. y is up, so the sheet enters from y = 1.
  float eased = uReveal * uReveal * uReveal * (uReveal * (uReveal * 6.0 - 15.0) + 10.0);
  float sag = 0.145 * min(2.0 * uReveal, 2.0 * (1.0 - uReveal)) * sin(PI * m.x + 0.25);
  float edge = mix(1.0, -0.18, eased) - sag;
  float cover = smoothstep(edge - 0.0025, edge + 0.0025, m.y);

  gl_FragColor = vec4(color, cover);
}
`;

type Puff = {
  x: number;
  y: number;
  a: number;
  age: number;
  radius: number;
  alive: boolean;
};

/**
 * The atmosphere behind the hero.
 *
 * A pool of soft puffs is stamped into a small target each frame; the field
 * samples that target to bend its own coordinates and lift its value. Puffs
 * are born along the pointer path, expand, and fade quickly, so the wake
 * tracks the cursor closely and dissolves behind it instead of leaving a rim.
 *
 * The same canvas owns the loader exit on the lab route: until uReveal runs the
 * plane sits above the viewport and the canvas is fully transparent, so the
 * bone plate in the page is what the visitor sees. On Home there is no loader,
 * so the first frame is already the settled field.
 */
export default function HeroScene({ paused = false }: { paused?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const controlsRef = useRef<{ start: () => void; stop: () => void } | null>(
    null,
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    /*
     * Cheap "ready" signal, fired immediately.
     *
     * The loader waits on markHeroReady() before it wipes away. Previously
     * this fired only after the full WebGL scene was built and rendered — a
     * ~1.5s synchronous long task that sat on the critical path while the
     * loader plate was still up, so any early click queued behind it (poor
     * load-time INP). The CSS poster/gradient is a complete visual on its own,
     * so the hero is "ready" the moment the text paints. The expensive WebGL
     * setup is deferred below, out of the loader window.
     */
    markHeroReady();

    const section = canvas.closest<HTMLElement>("section") ?? canvas.parentElement;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const puffs: Puff[] = Array.from({ length: MAX_PUFFS }, () => ({
      x: 0.5,
      y: 0.5,
      a: 0,
      age: 99,
      radius: 0.004,
      alive: false,
    }));
    let puffCursor = TRAIL_START;
    let reveal =
      gateMode() === "run" && getPhase() !== "reveal" && getPhase() !== "done"
        ? 0
        : 1;
    let disposed = false;
    let running = !pausedRef.current && !reduced.matches;
    let onScreen = true;
    canvas.dataset.motion = reduced.matches ? "frozen" : "live";
    canvas.dataset.running = running ? "1" : "0";

    /*
     * Pointer state lives in canvas UV (0..1, y up). The target is what the
     * browser reported; the emitter is the smoothed point the trail is drawn
     * from; emitted is the last point a puff was actually placed at, so a
     * fast move is filled in with a line instead of one dot per event.
     */
    let pointerX = 0.5;
    let pointerY = 0.5;
    let pointerActive = false;
    let emitterX = 0.5;
    let emitterY = 0.5;
    let emittedX = 0.5;
    let emittedY = 0.5;
    let lastClientX = 0;
    let lastClientY = 0;

    /*
     * Everything from here builds the WebGL scene. It is heavy (~1.5s on a
     * mid device) and does not need to run during the loader window, so it is
     * deferred to idle time via requestIdleCallback (setTimeout fallback). The
     * hero text + CSS poster are already painted and markHeroReady() has
     * already fired, so the loader is free to finish while this waits.
     */
    let cleanup: (() => void) | undefined;
    const startScene = () => {
      if (disposed) return;

      /*
       * The scene is built deferred, so the loader may have already finished
       * and the hero phase advanced to "reveal"/"done" before this runs. In
       * that case the onPhase listener below would never fire, so snap reveal
       * to 1 now — otherwise the field would build invisible and stay that way.
       */
      if (reveal === 0 && (getPhase() === "reveal" || getPhase() === "done")) {
        reveal = 1;
      }

      let renderer: WebGLRenderer;
    /*
     * An opaque default framebuffer composites much faster than a transparent
     * one, and Home never needs to see through the canvas. The lab loader is
     * the one exception: its first frame must sit transparently over the bone
     * plate, so alpha is only enabled while that entrance is running.
     */
    const needsAlpha =
      document.documentElement.dataset.heroLoader === "run";
    try {
      renderer = new WebGLRenderer({
        canvas,
        alpha: needsAlpha,
        antialias: false,
        powerPreference: "high-performance",
      });
    } catch {
      // No GPU context: the CSS gradient is the whole hero, but the page
      // loader must not wait five seconds for a frame that will never come.
      markHeroReady();
      return;
    }
    renderer.setClearColor(0x000000, 0);
    const lowEnd =
      (navigator.hardwareConcurrency ?? 8) <= 4 ||
      window.matchMedia("(pointer: coarse)").matches;
    const quality = Math.min(window.devicePixelRatio || 1, lowEnd ? 1.5 : 2);
    renderer.setPixelRatio(quality);

    const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const smokeTarget = new WebGLRenderTarget(TRAIL_W, TRAIL_H, {
      depthBuffer: false,
      stencilBuffer: false,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
    });
    const puffVectors = Array.from(
      { length: MAX_PUFFS },
      () => new Vector4(0.5, 0.5, 0.01, 0),
    );

    const trailScene = new Scene();
    const trailMaterial = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: TRAIL_FRAG,
      uniforms: {
        uPuffs: { value: puffVectors },
        uAspect: { value: 1 },
      },
      depthTest: false,
      depthWrite: false,
    });
    const trailGeometry = new PlaneGeometry(2, 2);
    trailScene.add(new Mesh(trailGeometry, trailMaterial));

    const scene = new Scene();
    const material = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uReveal: { value: reveal },
        uSmoke: { value: smokeTarget.texture },
      },
      depthTest: false,
      depthWrite: false,
      transparent: true,
    });
    const geometry = new PlaneGeometry(2, 2);
    scene.add(new Mesh(geometry, material));

    let width = 1;
    let height = 1;
    let left = 0;
    let top = 0;
    /*
     * The canvas is the reference frame, not the window: the hero can be
     * shorter than the viewport (mobile browser chrome) or scrolled away, and
     * mapping against innerWidth/innerHeight puts the trail next to the
     * pointer instead of under it.
     */
    const updateBounds = () => {
      const rect = canvas.getBoundingClientRect();
      left = rect.left;
      top = rect.top;
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      // The page can move under a still pointer; keep the stored point valid
      // so the trail cannot detach from the canvas while scrolling.
      if (pointerActive) {
        const x = (lastClientX - left) / width;
        const y = 1 - (lastClientY - top) / height;
        if (x < 0 || x > 1 || y < 0 || y > 1) {
          pointerActive = false;
        } else {
          pointerX = x;
          pointerY = y;
        }
      }
    };
    const resize = () => {
      updateBounds();
      renderer.setSize(width, height, false);
      trailMaterial.uniforms.uAspect.value = width / height;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    window.addEventListener("scroll", updateBounds, { passive: true });

    const spawn = (x: number, y: number) => {
      const puff = puffs[puffCursor];
      puffCursor =
        TRAIL_START +
        ((puffCursor - TRAIL_START + 1) % (MAX_PUFFS - TRAIL_START));
      puff.x = x;
      puff.y = y;
      puff.age = 0;
      puff.a = 0.24;
      puff.radius = 0.004;
      puff.alive = true;
    };

    /*
     * The pointer is sampled at frame rate, not at event rate: the emitter
     * chases the reported point and the gap between two stamps is filled in.
     * That is what makes a flick a continuous stroke instead of a handful of
     * dots that overwrite the pool before the tail has faded.
     */
    const follow = (dt: number) => {
      if (!pointerActive) {
        puffs[POINTER_PUFF].alive = false;
        puffs[POINTER_PUFF].a = 0;
        return;
      }

      const anchor = puffs[POINTER_PUFF];
      anchor.x = pointerX;
      anchor.y = pointerY;
      anchor.radius = 0.016;
      anchor.a = 0.16;
      anchor.alive = true;

      const k = 1 - Math.exp(-FOLLOW_RATE * dt);
      emitterX += (pointerX - emitterX) * k;
      emitterY += (pointerY - emitterY) * k;

      const dx = emitterX - emittedX;
      const dy = emitterY - emittedY;
      const distance = Math.hypot(dx * width, dy * height);
      const step = Math.max(1e-4, EMIT_SPACING * height);
      const count = Math.min(MAX_STAMPS, Math.floor(distance / step));
      if (count < 1) return;

      for (let index = 1; index <= count; index += 1) {
        const t = (index * step) / distance;
        spawn(emittedX + dx * t, emittedY + dy * t);
      }

      const covered = (count * step) / distance;
      emittedX += dx * covered;
      emittedY += dy * covered;
    };

    let last = performance.now();
    let announced = false;
    const render = (now: number) => {
      if (disposed) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      if (!reduced.matches) follow(dt);

      for (let index = 0; index < puffs.length; index += 1) {
        if (index === POINTER_PUFF) continue;
        const puff = puffs[index];
        if (!puff.alive) continue;
        puff.age += dt;
        // Shorter life than the reference: a faster fade keeps the wake a
        // gesture, not a stain.
        const fade = Math.pow(0.925, puff.age * 60);
        const shrink = Math.pow(0.97, puff.age * 60);
        puff.a = 0.24 * fade;
        if (puff.a < 0.006) puff.alive = false;
        puff.radius = 0.03 * (1 - shrink) + 0.0024;
      }
      puffs.forEach((puff, index) => {
        puffVectors[index].set(
          puff.x,
          puff.y,
          puff.radius,
          puff.alive ? puff.a : 0,
        );
      });

      material.uniforms.uTime.value = reduced.matches ? 0 : now / 1000;
      material.uniforms.uReveal.value = reveal;
      renderer.setRenderTarget(smokeTarget);
      renderer.render(trailScene, camera);
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);

      if (!announced) {
        announced = true;
        markHeroReady();
      }
    };

    let frame = 0;
    const loop = (now: number) => {
      if (!running) return;
      render(now);
      frame = requestAnimationFrame(loop);
    };

    const start = () => {
      if (
        running ||
        disposed ||
        pausedRef.current ||
        reduced.matches ||
        !onScreen
      ) {
        return;
      }
      running = true;
      canvas.dataset.running = "1";
      last = performance.now();
      frame = requestAnimationFrame(loop);
    };

    const stop = () => {
      running = false;
      canvas.dataset.running = "0";
      cancelAnimationFrame(frame);
      frame = 0;
    };

    controlsRef.current = { start, stop };

    const onPointerMove = (event: PointerEvent) => {
      if (reduced.matches) return;
      // A finger drags the page; painting a hover trail under it is noise.
      if (event.pointerType === "touch") return;

      lastClientX = event.clientX;
      lastClientY = event.clientY;

      const x = (event.clientX - left) / width;
      const y = 1 - (event.clientY - top) / height;
      if (x < 0 || x > 1 || y < 0 || y > 1) {
        pointerActive = false;
        return;
      }

      if (!pointerActive) {
        // Re-entry must not draw a line from where the pointer left.
        emitterX = x;
        emitterY = y;
        emittedX = x;
        emittedY = y;
      }
      pointerX = x;
      pointerY = y;
      pointerActive = true;
    };

    const onPointerLeave = () => {
      pointerActive = false;
    };

    const onVisibility = () => {
      if (document.hidden || pausedRef.current) stop();
      else if (!reduced.matches && onScreen) start();
    };

    const inView =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              onScreen = entry.isIntersecting;
              if (onScreen && !document.hidden && !reduced.matches) {
                start();
              } else {
                stop();
              }
            },
            { threshold: 0 },
          );

    if (section && inView) inView.observe(section);

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("blur", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);

    if (reduced.matches || pausedRef.current) {
      stop();
      render(performance.now());
    } else {
      running = true;
      canvas.dataset.running = "1";
      frame = requestAnimationFrame(loop);
    }

    // The loader counts on this: the first painted frame is what makes the
    // plate readable, so it is part of the progress, not a fake timer.
    requestAnimationFrame(() => signalSceneReady());

    const revealState = { value: reveal };
    const stopRevealWatch = onPhase((phase) => {
      if (phase !== "reveal") return;
      gsap.to(revealState, {
        value: 1,
        duration: 1.9,
        delay: 0.85,
        ease: "power4.inOut",
        onUpdate: () => {
          reveal = revealState.value;
        },
      });
    });

    const onReducedChange = () => {
      if (reduced.matches) {
        stop();
        pointerActive = false;
        puffs.forEach((puff) => {
          puff.alive = false;
          puff.a = 0;
        });
        render(performance.now());
      } else if (onScreen) {
        start();
      }
    };
    reduced.addEventListener("change", onReducedChange);

    cleanup = () => {
      controlsRef.current = null;
      stop();
      stopRevealWatch();
      gsap.killTweensOf(revealState);
      observer.disconnect();
      inView?.disconnect();
      reduced.removeEventListener("change", onReducedChange);
      window.removeEventListener("scroll", updateBounds);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("blur", onPointerLeave);
      document.removeEventListener("pointerleave", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      delete canvas.dataset.running;
      delete canvas.dataset.motion;
      smokeTarget.dispose();
      trailMaterial.dispose();
      material.dispose();
      trailGeometry.dispose();
      geometry.dispose();
      renderer.dispose();
    };
    };

    /*
     * Defer the heavy build until the loader is done.
     *
     * requestIdleCallback alone is not enough: during the loader's GSAP
     * timeline the browser finds idle gaps between frames and would run the
     * ~1.5s build there — still inside the loader window, still blocking early
     * clicks. So wait explicitly for data-page-loader="done" (the loader sets
     * it on <html> when it wipes away), then build via requestIdleCallback
     * (setTimeout fallback). A 3s safety ensures the scene still builds if the
     * attribute never flips (reduced motion, hash deep link, loader skipped).
     */
    const root = document.documentElement;
    const BUILD_SAFETY_MS = 3000;
    let started = false;
    const build = () => {
      if (started || disposed) return;
      started = true;
      const idle = window.requestIdleCallback;
      if (typeof idle === "function") {
        idle(startScene, { timeout: 2000 });
      } else {
        window.setTimeout(startScene, 0);
      }
    };
    const maybeBuild = () => {
      const pl = root.dataset.pageLoader;
      if (pl === "done" || pl === "skip") build();
    };
    maybeBuild();
    const loaderObserver = new MutationObserver(maybeBuild);
    loaderObserver.observe(root, {
      attributes: true,
      attributeFilter: ["data-page-loader"],
    });
    const buildSafety = window.setTimeout(build, BUILD_SAFETY_MS);

    return () => {
      disposed = true;
      started = true;
      loaderObserver.disconnect();
      window.clearTimeout(buildSafety);
      cleanup?.();
      delete canvas.dataset.running;
      delete canvas.dataset.motion;
    };
  }, []);

  useEffect(() => {
    pausedRef.current = paused;
    if (paused) {
      if (canvasRef.current) canvasRef.current.dataset.running = "0";
      controlsRef.current?.stop();
    } else {
      controlsRef.current?.start();
    }
  }, [paused]);

  return <canvas ref={canvasRef} className="hero-scene" aria-hidden="true" />;
}

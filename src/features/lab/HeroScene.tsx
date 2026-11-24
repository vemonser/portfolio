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

import { gateMode, getPhase, onPhase, signalSceneReady } from "./heroPhase";

const MAX_PUFFS = 64;
const TRAIL_W = 320;
const TRAIL_H = 180;

/*
 * Slot 0 is the cursor itself, not part of the trail: it is reset every frame
 * so a still pointer keeps one soft bend under it instead of stacking puffs
 * until the smoke saturates. The trail starts at 1.
 */
const POINTER_PUFF = 0;
const TRAIL_START = 1;

/* Minimum screen distance between two trail stamps, as a fraction of the
 * canvas height, so the spacing reads the same at any viewport. */
const EMIT_SPACING = 0.016;
/* How fast the emitter closes on the pointer, in 1/s. Low enough that a flick
 * leaves a comet, high enough that it never feels detached. */
const FOLLOW_RATE = 24;
/* Stamps per frame. A fast flick is allowed to lag for a frame or two rather
 * than flood the 63-slot trail pool and wipe the tail. */
const MAX_STAMPS = 6;

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
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
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
  for (int i = 0; i < ${MAX_PUFFS}; i++) {
    vec4 puff = uPuffs[i];
    vec2 d = (vUv - puff.xy) * vec2(uAspect, 1.0);
    float falloff = exp(-dot(d, d) / max(puff.z * puff.z, 1e-6) * 2.2);
    // Internal structure, so the warp reads as smoke and not as a sphere.
    float body = 0.80 + 0.20 * valueNoise(vUv * 7.0 + puff.x * 3.0);
    sum += falloff * puff.w * body;
  }
  // Full range on purpose. The field reads this through sin(n.r * 2π), so the
  // warp grows, peaks, reverses and dies inside a single puff — that wrap is
  // the motion. Putting a ceiling on it turns the warp into one linear shear.
  gl_FragColor = vec4(min(sum, 1.0), 0.0, 0.0, 1.0);
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
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
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

  /*
   * The smoke does two jobs. It bends the field, which is what gives the
   * cursor its wake, and it carries a little light, because the field here is
   * far darker than the reference's: a pure displacement of a near-black
   * pattern is invisible, so the trail has to be readable on its own.
   */
  vec4 n = texture2D(uSmoke, vUv);
  float z = n.r * 2.0 * PI;
  vec2 dr = vec2(sin(z));
  vec2 uv = vUv + dr * n.r * 0.12;

  float d1 = distance(uv, vec2(0.5));
  float d2 = distance(uv, vec2(0.0, 1.0));

  // Their clock advances 0.05 per frame at 60fps, so one second is 3 units.
  float t = uTime * 3.0;
  float gr = mix(-0.2, 0.2, rand(uv + sin(t)));
  vec2 mv = vec2(t * 0.05, t * -0.05);

  float f = ns((uv * d1 * 2.0) + mv);
  f += ns((uv * d2 * 2.2) + vec2(t * -0.075, t * 0.05)) * 0.8;
  f += gr;
  // Lift before the curve. On the reference's own frames the field sits on the
  // upper half of smoothstep, where it is gentle; the raw sum lands on the
  // steep half, which reads as hard-edged plates in a dark field.
  f = smoothstep(0.0, 2.0, f + 0.34);

  vec3 color = mix(vec3(0.0), vec3(0.3), f);
  /*
   * The lift is deliberately small in absolute terms and generous in the
   * multiplier: the smoke target is a 320x180 buffer where a decaying puff
   * only reaches a few hundredths, so 2.5 turns that into a faint grey wake
   * instead of a lamp. Raise this and the trail becomes a light source.
   */
  color += vec3(2.5) * n.r;

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
 * A pool of additive puffs is stamped into a small target each frame; the
 * field samples that target to bend its own coordinates and lift its value.
 * Puffs are born at the pointer, expand, and fade, so the wake follows the
 * cursor exactly and dissolves behind it instead of leaving a rim.
 *
 * The same canvas owns the loader exit: until uReveal runs the plane sits
 * above the viewport and the canvas is fully transparent, so the bone plate in
 * the page is what the visitor sees.
 */
export default function HeroScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

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
    let reveal = gateMode() === "run" && getPhase() !== "reveal" && getPhase() !== "done" ? 0 : 1;
    let disposed = false;

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

    let renderer: WebGLRenderer;
    try {
      renderer = new WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

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
    trailScene.add(new Mesh(new PlaneGeometry(2, 2), trailMaterial));

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
    scene.add(new Mesh(new PlaneGeometry(2, 2), material));

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
        TRAIL_START + ((puffCursor - TRAIL_START + 1) % (MAX_PUFFS - TRAIL_START));
      puff.x = x;
      puff.y = y;
      puff.age = 0;
      puff.a = 0.5;
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
      anchor.radius = 0.018;
      anchor.a = 0.2;
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
    const render = (now: number) => {
      if (disposed) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      follow(dt);

      for (let index = 0; index < puffs.length; index += 1) {
        if (index === POINTER_PUFF) continue;
        const puff = puffs[index];
        if (!puff.alive) continue;
        puff.age += dt;
        // Their coefficients: scale = .98 * scale + .109 and opacity *= .96
        // per frame. At 60fps that is a 5.45 ceiling and a ~1s fade.
        const shrink = Math.pow(0.98, puff.age * 60);
        const fade = Math.pow(0.96, puff.age * 60);
        puff.a = 0.5 * fade;
        if (puff.a < 0.008) puff.alive = false;
        /*
         * A trail puff is small on purpose. At the reference's own scale one
         * puff covers a quarter of the view, so three of them merge into one
         * field-wide haze and the stroke has no shape — the pointer moves, the
         * screen only breathes. Cap it at a fraction of the view so the line
         * stays a line.
         */
        puff.radius = 0.04 * (1 - shrink) + 0.002;
      }
      puffs.forEach((puff, index) => {
        puffVectors[index].set(puff.x, puff.y, puff.radius, puff.a);
      });

      material.uniforms.uTime.value = now / 1000;
      material.uniforms.uReveal.value = reveal;
      renderer.setRenderTarget(smokeTarget);
      renderer.render(trailScene, camera);
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
    };

    let frame = 0;
    const loop = (now: number) => {
      render(now);
      frame = requestAnimationFrame(loop);
    };

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
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else if (!frame && !disposed) {
        last = performance.now();
        frame = requestAnimationFrame(loop);
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerleave", onPointerLeave);
    window.addEventListener("blur", onPointerLeave);
    document.addEventListener("visibilitychange", onVisibility);

    if (reduced.matches) {
      render(performance.now());
    } else {
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

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      stopRevealWatch();
      gsap.killTweensOf(revealState);
      observer.disconnect();
      window.removeEventListener("scroll", updateBounds);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("blur", onPointerLeave);
      document.removeEventListener("visibilitychange", onVisibility);
      smokeTarget.dispose();
      trailMaterial.dispose();
      material.dispose();
      scene.traverse((object) => {
        (object as Mesh).geometry?.dispose();
      });
      trailScene.traverse((object) => {
        (object as Mesh).geometry?.dispose();
      });
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-scene" aria-hidden="true" />;
}

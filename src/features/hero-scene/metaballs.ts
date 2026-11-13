import gsap from "gsap";
import * as THREE from "three";

import { clamp } from "./math";
import { createStudioEnvironment } from "./studio";
import type { HeroScene, HeroSceneOptions } from "./types";

/**
 * Raymarched metaballs — the other way to get "molten chrome".
 *
 * Instead of meshing anything, this draws a full-screen quad and marches a
 * signed distance field made of five spheres blended with a smooth minimum.
 * That buys two things a mesh cannot: the blobs genuinely merge and split like
 * liquid, and there is no tessellation anywhere, so the silhouette is exact at
 * any zoom.
 *
 * The price is per-pixel work. Rays that miss the bounding sphere exit in one
 * test, the pixel ratio is capped at 1, and the march is bounded — but this is
 * still the most expensive of the looks by a wide margin.
 */

const BOUND = 2.75;
const CAMERA_Z = 5.4;
const FOV = 34;
const MAX_STEPS = 96;

export function createMetaballScene({
  canvas,
  initialTime = 0,
  onFirstFrame,
  onContextLost,
}: HeroSceneOptions): HeroScene {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: "high-performance",
  });
  renderer.setClearAlpha(0);

  // The environment is baked into a cube map rather than a PMREM: a raw
  // shader cannot sample three's PMREM layout, and a cube sample is all a
  // mirror needs.
  const studio = createStudioEnvironment();
  const cubeTarget = new THREE.WebGLCubeRenderTarget(256, {
    type: THREE.HalfFloatType,
    generateMipmaps: false,
  });
  const cubeCamera = new THREE.CubeCamera(0.1, 200, cubeTarget);
  cubeCamera.update(renderer, studio);
  studio.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      (object.material as THREE.Material).dispose();
    }
  });

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  camera.position.z = 1;

  const uniforms = {
    uTime: { value: initialTime * 0.1 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uEnv: { value: cubeTarget.texture },
    uPointer: { value: new THREE.Vector2() },
    uHover: { value: 0 },
    uTan: { value: Math.tan((FOV * Math.PI) / 360) },
    uCamZ: { value: CAMERA_Z },
    uBound: { value: BOUND },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    depthTest: false,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      precision highp float;

      uniform float uTime;
      uniform vec2 uRes;
      uniform samplerCube uEnv;
      uniform vec2 uPointer;
      uniform float uHover;
      uniform float uTan;
      uniform float uCamZ;
      uniform float uBound;

      varying vec2 vUv;

      float smin(float a, float b, float k) {
        float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
        return mix(b, a, h) - k * h * (1.0 - h);
      }

      // Five drifting spheres, blended. Positions breathe on different
      // periods so the mass never repeats a shape.
      float map(vec3 p) {
        float t = uTime;
        float d = 1e5;

        d = smin(d, length(p - vec3(-0.55 + 0.35 * sin(t * 0.7), 0.35 + 0.3 * cos(t * 0.5), 0.0)) - 0.95, 0.34);
        d = smin(d, length(p - vec3(0.75, -0.15 + 0.28 * sin(t * 0.63 + 1.7), 0.15)) - 0.72, 0.34);
        d = smin(d, length(p - vec3(-0.15 + 0.4 * cos(t * 0.44 + 2.1), -0.65, -0.2)) - 0.62, 0.34);
        d = smin(d, length(p - vec3(0.35 + 0.3 * sin(t * 0.55 + 4.0), 0.75, -0.35)) - 0.5, 0.34);
        d = smin(d, length(p - vec3(-0.9, -0.35 + 0.25 * cos(t * 0.72 + 0.6), 0.25)) - 0.44, 0.34);

        // A slow swell where the pointer is, in world space.
        d -= smoothstep(1.3, 0.0, length(p.xy - uPointer)) * uHover * 0.22;

        return d;
      }

      vec3 calcNormal(vec3 p) {
        float e = 0.002;
        vec2 h = vec2(e, 0.0);
        return normalize(vec3(
          map(p + h.xyy) - map(p - h.xyy),
          map(p + h.yxy) - map(p - h.yxy),
          map(p + h.yyx) - map(p - h.yyx)
        ));
      }

      // ACES fit, then linear → sRGB. Raw shaders do not get three's tone
      // mapping or colour-space pass, so both happen here.
      vec3 aces(vec3 x) {
        return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
      }

      vec3 toSrgb(vec3 c) {
        return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
      }

      void main() {
        vec2 p = vUv * 2.0 - 1.0;
        float aspect = uRes.x / uRes.y;

        vec3 ro = vec3(0.0, 0.0, uCamZ);
        vec3 rd = normalize(vec3(p.x * aspect * uTan, p.y * uTan, -1.0));

        vec3 background = mix(vec3(0.004), vec3(0.02), smoothstep(-1.0, 1.0, p.y));

        // Analytic bounding-sphere rejection: most pixels never march.
        float b = dot(ro, rd);
        float c = dot(ro, ro) - uBound * uBound;
        float disc = b * b - c;
        if (disc < 0.0) {
          gl_FragColor = vec4(toSrgb(aces(background)), 1.0);
          return;
        }
        float root = sqrt(disc);
        float tStart = max(-b - root, 0.0);
        float tEnd = -b + root;

        float travel = 0.0;
        float hitT = -1.0;
        for (int i = 0; i < ${MAX_STEPS}; i++) {
          float t = tStart + travel;
          if (t > tEnd) break;
          float d = map(ro + rd * t);
          if (d < 0.0012) { hitT = t; break; }
          travel += d;
        }

        vec3 color = background;

        if (hitT > 0.0) {
          vec3 pos = ro + rd * hitT;
          vec3 n = calcNormal(pos);
          vec3 refl = reflect(rd, n);

          color = textureCube(uEnv, refl).rgb;

          // Thin grazing-angle rim. This is what draws the bright contour
          // lines the reference has: a high exponent keeps it to the edge
          // instead of washing the whole form.
          float fresnel = pow(1.0 - clamp(dot(n, -rd), 0.0, 1.0), 5.0);
          color += fresnel * 0.55;

          // Depth falloff: the trailing blobs sit in shadow.
          color *= smoothstep(0.0, 1.6, uCamZ - hitT);
        }

        gl_FragColor = vec4(toSrgb(aces(color)), 1.0);
      }
    `,
  });

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  scene.add(quad);

  // --- state -------------------------------------------------------------

  const pointer = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };
  const hover = { value: 0 };
  const scroll = { value: 0 };

  const easeX = gsap.quickTo(eased, "x", { duration: 0.8, ease: "power2.out" });
  const easeY = gsap.quickTo(eased, "y", { duration: 0.8, ease: "power2.out" });
  const easeHover = gsap.quickTo(hover, "value", { duration: 0.6, ease: "power2.out" });
  const easeScroll = gsap.quickTo(scroll, "value", { duration: 0.9, ease: "power2.out" });

  let running = false;
  let frameId = 0;
  let startedAt = performance.now() - initialTime * 1000;
  let firstFrame = true;
  let time = initialTime * 0.1;

  const frozen = initialTime > 0;

  const draw = () => {
    uniforms.uTime.value = time;
    uniforms.uHover.value = hover.value;

    // The pointer is in NDC; the field is in world units. Map it through the
    // same tangent the ray direction uses.
    const tan = uniforms.uTan.value;
    const aspect = uniforms.uRes.value.x / uniforms.uRes.value.y;
    uniforms.uPointer.value.set(
      eased.x * aspect * tan * uDisplacement(),
      eased.y * tan * uDisplacement(),
    );

    uniforms.uCamZ.value = CAMERA_Z * (1 + 0.12 * scroll.value);

    renderer.render(scene, camera);

    if (firstFrame) {
      firstFrame = false;
      onFirstFrame?.();
    }
  };

  // Pointer → world offset on the blob's mid-plane.
  const uDisplacement = () => uniforms.uCamZ.value;

  const loop = () => {
    if (!running) return;
    const elapsed = (performance.now() - startedAt) / 1000;
    time = elapsed * 0.1;
    draw();
    frameId = requestAnimationFrame(loop);
  };

  const start = () => {
    if (running) return;
    running = true;
    startedAt = performance.now() - (time / 0.1) * 1000;
    frameId = requestAnimationFrame(loop);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(frameId);
  };

  const setPointer = (x: number, y: number) => {
    const nx = clamp(x, -1, 1);
    const ny = clamp(y, -1, 1);
    if (nx === pointer.x && ny === pointer.y) return;
    pointer.x = nx;
    pointer.y = ny;
    easeX(nx);
    easeY(ny);
  };

  const setHover = (intensity: number) => {
    easeHover(clamp(intensity, 0, 1));
  };

  const pulse = () => {
    gsap
      .timeline({ overwrite: true })
      .to(hover, { value: 1, duration: 0.3, ease: "power2.out" })
      .to(hover, { value: 0, duration: 1.1, ease: "power3.inOut" });
  };

  const setScroll = (progress: number) => {
    easeScroll(clamp(progress, 0, 1));
  };

  const resize = () => {
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;

    // One device pixel per CSS pixel: this shader is fill-rate bound and a
    // retina buffer quadruples the cost for no visible gain on a soft surface.
    renderer.setPixelRatio(1);
    renderer.setSize(width, height, false);
    uniforms.uRes.value.set(width, height);
    draw();
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
    setPointer,
    setHover,
    pulse,
    setScroll,
    start: frozen ? () => {} : start,
    stop,
    dispose() {
      stop();
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      gsap.killTweensOf([eased, hover, scroll]);
      quad.geometry.dispose();
      material.dispose();
      cubeTarget.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

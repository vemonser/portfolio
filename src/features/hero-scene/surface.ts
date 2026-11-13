import gsap from "gsap";
import * as THREE from "three";

import { clamp } from "./math";
import { SIMPLEX_3D } from "./noise";
import { createStudioEnvironment } from "./studio";
import type { HeroScene, HeroSceneOptions } from "./types";

/**
 * Liquid chrome, full bleed.
 *
 * The reference is not an object in a scene — it is a macro photograph of
 * molten metal: a surface that fills the frame, no silhouette, no horizon.
 * So this is a tall, densely tessellated plane sitting just in front of the
 * camera, displaced along its normal by animated 3D noise.
 *
 * A plane rather than a sphere on purpose. Seen this close, a sphere is only
 * a slightly curved patch anyway, but its silhouette and its folds produce
 * grazing-angle artefacts which a height field cannot: the normal here is an
 * analytic gradient, so the shading is smooth at any zoom.
 *
 * There are no lights. Metal with roughness near zero is shaded entirely by
 * the studio cubemap — which is why the contrast is built into the
 * environment rather than recovered in the shader.
 */

const PLANE_WIDTH = 7.2;
const PLANE_HEIGHT = 4.6;
const SEGMENTS = 340;
const RINGS = 220;

const AMPLITUDE = 0.28;
const FLOW = 0.1;
const FOV = 42;
const CAMERA_Z = 3.4;

export function createSurfaceScene({
  canvas,
  initialTime = 0,
  onFirstFrame,
  onContextLost,
}: HeroSceneOptions): HeroScene {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setClearAlpha(0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.72;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
  camera.position.set(0, 0, CAMERA_Z);

  // PMREM, not a raw cube: a raw cube map leaves a visible seam where two
  // faces meet, which reads as a stray line across the metal. PMREM's
  // prefiltered levels are seamless, and with broad lights (no thin rings)
  // the blur costs nothing.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const studio = createStudioEnvironment();
  scene.environment = pmrem.fromScene(studio, 0.02).texture;
  pmrem.dispose();
  studio.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      (object.material as THREE.Material).dispose();
    }
  });

  const uniforms = {
    uTime: { value: initialTime * FLOW },
    uAmplitude: { value: AMPLITUDE },
    uPointer: { value: new THREE.Vector2() },
    uHover: { value: 0 },
  };

  const material = new THREE.MeshPhysicalMaterial({
    color: "#e4e1da",
    metalness: 1,
    roughness: 0.06,
    clearcoat: 1,
    clearcoatRoughness: 0.12,
    envMapIntensity: 1.5,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uAmplitude = uniforms.uAmplitude;
    shader.uniforms.uPointer = uniforms.uPointer;
    shader.uniforms.uHover = uniforms.uHover;

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        /* glsl */ `
        #include <common>
        uniform float uTime;
        uniform float uAmplitude;
        uniform vec2 uPointer;
        uniform float uHover;
        vec3 heroDisplaced;

        ${SIMPLEX_3D}

        // Two octaves, second one deliberately weak. More detail here reads as
        // foil; the reference is one mass with a soft sheen.
        float heroFbm(vec3 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 2; i++) {
            value += amplitude * heroSnoise(p);
            p *= 1.9;
            amplitude *= 0.3;
          }
          return value;
        }

        float heroField(vec2 p) {
          float t = uTime;

          // Domain warp. This is the difference between "noise" and "liquid":
          // every point is pushed by another slice of the same field, so the
          // surface folds instead of bumping.
          vec3 warp = vec3(
            heroSnoise(vec3(p * 0.12, t * 0.4)),
            heroSnoise(vec3(p * 0.12 + 8.7, t * 0.4)),
            0.0
          );

          float height = heroFbm(vec3(p * 0.245 + warp.xy * 0.62, t * 0.55));

          // The pointer presses into the surface rather than moving a light.
          float d = length(p - uPointer);
          height += exp(-d * d * 0.62) * uHover * 1.25;

          return height * uAmplitude;
        }
        `,
      )
      .replace(
        "#include <beginnormal_vertex>",
        /* glsl */ `
        #include <beginnormal_vertex>

        vec2 heroP = position.xy;
        float heroEps = 0.05;

        float heroH = heroField(heroP);
        float heroHx = heroField(heroP + vec2(heroEps, 0.0));
        float heroHy = heroField(heroP + vec2(0.0, heroEps));

        // Analytic gradient. No cross products, no folded triangles.
        objectNormal = normalize(vec3(
          -(heroHx - heroH) / heroEps,
          -(heroHy - heroH) / heroEps,
          1.0
        ));

        heroDisplaced = vec3(heroP, heroH);
        `,
      )
      .replace(
        "#include <begin_vertex>",
        /* glsl */ `
        #include <begin_vertex>
        transformed = heroDisplaced;
        `,
      );
  };

  material.customProgramCacheKey = () => "hero-liquid-plane-v1";

  const geometry = new THREE.PlaneGeometry(PLANE_WIDTH, PLANE_HEIGHT, SEGMENTS, RINGS);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // --- state -------------------------------------------------------------

  const pointer = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };
  const hover = { value: 0 };
  const scroll = { value: 0 };

  const easeX = gsap.quickTo(eased, "x", { duration: 0.8, ease: "power2.out" });
  const easeY = gsap.quickTo(eased, "y", { duration: 0.8, ease: "power2.out" });
  const easeHover = gsap.quickTo(hover, "value", { duration: 0.65, ease: "power2.out" });
  const easeScroll = gsap.quickTo(scroll, "value", { duration: 0.9, ease: "power2.out" });

  const ray = new THREE.Vector3();

  let running = false;
  let frameId = 0;
  let startedAt = performance.now() - initialTime * 1000;
  let firstFrame = true;

  // A fixed moment: render one frame and stay there, so captures are exact.
  const frozen = initialTime > 0;

  const draw = (seconds: number) => {
    uniforms.uTime.value = seconds * FLOW;
    uniforms.uHover.value = hover.value;

    // Pointer → world position on the surface plane.
    ray.set(eased.x, eased.y, 0.5).unproject(camera).sub(camera.position).normalize();
    const distance = -camera.position.z / ray.z;
    uniforms.uPointer.value.set(
      camera.position.x + ray.x * distance,
      camera.position.y + ray.y * distance,
    );

    // Steady flow comes from the field itself. The mesh only answers input.
    mesh.rotation.x = -0.06 + eased.y * 0.06;
    mesh.rotation.y = eased.x * 0.08;
    mesh.position.y = scroll.value * 0.5;
    camera.position.z = CAMERA_Z * (1 - 0.06 * scroll.value);

    renderer.render(scene, camera);

    if (firstFrame) {
      firstFrame = false;
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
    startedAt = performance.now() - uniforms.uTime.value * (1000 / FLOW);
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
      .to(hover, { value: 1.15, duration: 0.28, ease: "power2.out" })
      .to(hover, { value: 0, duration: 1.1, ease: "power3.inOut" });
  };

  const setScroll = (progress: number) => {
    easeScroll(clamp(progress, 0, 1));
  };

  // --- lifecycle ---------------------------------------------------------

  const resize = () => {
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    draw(uniforms.uTime.value / FLOW);
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
      geometry.dispose();
      material.dispose();
      scene.environment?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

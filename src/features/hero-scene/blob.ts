import gsap from "gsap";
import * as THREE from "three";

import { cameraDistance, clamp } from "./math";
import { SIMPLEX_3D } from "./noise";
import { createStudioEnvironment } from "./studio";
import type { HeroScene, HeroSceneOptions } from "./types";

/**
 * One dark chrome mass.
 *
 * The reference is a single molten form with a readable silhouette — a
 * *thing*, not a surface filling the frame. A displaced plane read as a
 * curtain, so this is a dense sphere: low-frequency noise gives it lobes,
 * the silhouette stays visible, and the environment does all the shading.
 *
 * No lights. Metal with low roughness is lit entirely by the studio cubemap,
 * which is why the contrast lives in `studio.ts` and nowhere else.
 */

const RADIUS = 1;
const SEGMENTS = 300;
const RINGS = 180;

// Low frequency on purpose: a few large lobes read as molten, high frequency
// reads as crumpled foil.
const NOISE_SCALE = 0.6;
const AMPLITUDE = 0.34;

const FOV = 35;
const FILL = 1.3;
const FLOW = 0.1;

export function createBlobScene({
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
  renderer.toneMappingExposure = 1.0;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 60);
  camera.position.set(0, 0, 6);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const studio = createStudioEnvironment();
  scene.environment = pmrem.fromScene(studio, 0.012).texture;
  studio.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      (object.material as THREE.Material).dispose();
    }
  });
  pmrem.dispose();

  const uniforms = {
    uTime: { value: initialTime * FLOW },
    uAmplitude: { value: AMPLITUDE },
    uPointerDir: { value: new THREE.Vector3(0, 0, 1) },
    uHover: { value: 0 },
  };

  const material = new THREE.MeshPhysicalMaterial({
    color: "#dedbd4",
    metalness: 1,
    roughness: 0.1,
    clearcoat: 1,
    clearcoatRoughness: 0.06,
    envMapIntensity: 1.35,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uAmplitude = uniforms.uAmplitude;
    shader.uniforms.uPointerDir = uniforms.uPointerDir;
    shader.uniforms.uHover = uniforms.uHover;

    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        /* glsl */ `
        #include <common>
        uniform float uTime;
        uniform float uAmplitude;
        uniform vec3 uPointerDir;
        uniform float uHover;
        vec3 heroDisplaced;

        ${SIMPLEX_3D}

        // Two octaves, the second weak. More detail reads as foil.
        float heroFbm(vec3 p) {
          float value = 0.0;
          float amplitude = 0.5;
          for (int i = 0; i < 2; i++) {
            value += amplitude * heroSnoise(p);
            p *= 2.1;
            amplitude *= 0.28;
          }
          return value;
        }

        // Height of the molten surface above the base sphere, at a direction.
        float heroHeight(vec3 dir) {
          float t = uTime;
          vec3 q = dir * ${NOISE_SCALE.toFixed(3)};

          // Domain warp: the difference between noise and liquid.
          vec3 warp = vec3(
            heroSnoise(q * 0.7 + vec3(0.0, 0.0, t * 0.7)),
            heroSnoise(q * 0.7 + vec3(9.3, 2.7, t * 0.7)),
            heroSnoise(q * 0.7 + vec3(4.1, 8.6, t * 0.7))
          );

          float height = heroFbm(q + warp * 0.18 + vec3(0.0, 0.0, t * 0.9));

          // A soft, wide press where the pointer is.
          float angle = acos(clamp(dot(dir, uPointerDir), -1.0, 1.0));
          height += smoothstep(1.15, 0.0, angle) * uHover * 0.55;

          return height * uAmplitude;
        }
        `,
      )
      .replace(
        "#include <beginnormal_vertex>",
        /* glsl */ `
        #include <beginnormal_vertex>

        vec3 heroDir = normalize(position);
        vec3 heroUp = abs(heroDir.y) > 0.99 ? vec3(1.0, 0.0, 0.0) : vec3(0.0, 1.0, 0.0);
        vec3 heroT1 = normalize(cross(heroDir, heroUp));
        vec3 heroT2 = normalize(cross(heroDir, heroT1));

        float heroEps = 0.06;
        vec3 heroDir1 = normalize(heroDir + heroT1 * heroEps);
        vec3 heroDir2 = normalize(heroDir + heroT2 * heroEps);

        vec3 heroP0 = heroDir * (1.0 + heroHeight(heroDir));
        vec3 heroP1 = heroDir1 * (1.0 + heroHeight(heroDir1));
        vec3 heroP2 = heroDir2 * (1.0 + heroHeight(heroDir2));

        heroDisplaced = heroP0;

        // Analytic-ish normal from the displaced surface itself, so the
        // shading follows the lobes instead of the base sphere.
        vec3 heroNormal = normalize(cross(heroP1 - heroP0, heroP2 - heroP0));
        objectNormal = dot(heroNormal, heroDir) < 0.0 ? -heroNormal : heroNormal;
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

  material.customProgramCacheKey = () => "hero-chrome-mass-v1";

  const geometry = new THREE.SphereGeometry(RADIUS, SEGMENTS, RINGS);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  // --- state -------------------------------------------------------------

  const pointer = { x: 0, y: 0 };
  const eased = { x: 0, y: 0 };
  const hover = { value: 0 };
  const scroll = { value: 0 };
  const intro = { value: 0 };

  const easeX = gsap.quickTo(eased, "x", { duration: 0.8, ease: "power2.out" });
  const easeY = gsap.quickTo(eased, "y", { duration: 0.8, ease: "power2.out" });
  const easeHover = gsap.quickTo(hover, "value", { duration: 0.6, ease: "power2.out" });
  const easeScroll = gsap.quickTo(scroll, "value", { duration: 0.9, ease: "power2.out" });

  const ray = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();

  let running = false;
  let frameId = 0;
  let startedAt = performance.now() - initialTime * 1000;
  let firstFrame = true;

  // A fixed moment: render one frame and stay there, so captures are exact.
  const frozen = initialTime > 0;

  const draw = (seconds: number) => {
    uniforms.uTime.value = seconds * FLOW;
    uniforms.uHover.value = hover.value;

    ray.set(eased.x, eased.y, 0.5).unproject(camera).sub(camera.position).normalize();
    mesh.getWorldQuaternion(quaternion).invert();
    uniforms.uPointerDir.value.copy(ray).applyQuaternion(quaternion).normalize();

    // The flow lives in the noise; the mesh only answers input.
    mesh.rotation.y = eased.x * 0.22 + scroll.value * Math.PI * 0.5;
    mesh.rotation.x = eased.y * 0.16;
    mesh.position.y = 0.02 + scroll.value * 0.35;
    mesh.scale.setScalar(0.88 + intro.value * 0.12);

    camera.position.z = cameraDistance(RADIUS + AMPLITUDE, camera.aspect, FOV, FILL);

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
      .to(hover, { value: 1, duration: 0.3, ease: "power2.out" })
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

  uniforms.uTime.value = initialTime * FLOW;

  if (frozen) {
    intro.value = 1;
  } else {
    gsap.to(intro, { value: 1, duration: 1.4, ease: "power3.out" });
  }

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
      gsap.killTweensOf([eased, hover, scroll, intro]);
      geometry.dispose();
      material.dispose();
      scene.environment?.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

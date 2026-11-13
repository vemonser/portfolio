import * as THREE from "three";

/**
 * A procedural studio, baked once into a PMREM.
 *
 * The whole look depends on this. Chrome is a mirror, so every straight edge
 * in the environment comes back as a straight bright line across the metal —
 * thin panel strips made the surface read as a sphere under a light rig
 * instead of as molten chrome. So there are no panels: the dome is a vertical
 * gradient with a few soft, round highlights, and the surface's own lobes do
 * the warping.
 *
 * Keeping it in code also means no HDR file and no network request.
 */
export function createStudioEnvironment(): THREE.Scene {
  const scene = new THREE.Scene();

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(50, 64, 48),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uSky: { value: new THREE.Color(0.035, 0.035, 0.034) },
        uHorizon: { value: new THREE.Color(0.012, 0.012, 0.012) },
        uFloor: { value: new THREE.Color(0.012, 0.012, 0.012) },
        uKeyDir: { value: new THREE.Vector3(-0.55, 0.62, 0.56).normalize() },
        uKeyColor: { value: new THREE.Color(5.6, 5.55, 5.4) },
        uKeySize: { value: 0.1 },
        uFillDir: { value: new THREE.Vector3(0.82, 0.1, 0.56).normalize() },
        uFillColor: { value: new THREE.Color(2.2, 2.18, 2.1) },
        uFillSize: { value: 0.055 },
        uRimDir: { value: new THREE.Vector3(0.15, 0.98, -0.4).normalize() },
        uRimColor: { value: new THREE.Color(1.4, 1.39, 1.34) },
        uRimSize: { value: 0.05 },
        // Ring lights. A round light reflects as a dot; a ring reflects as a
        // long thin line, which is what gives the reference its filaments.
        uRingA: { value: new THREE.Vector3(0.0, 1.0, 0.0).normalize() },
        uRingAColor: { value: new THREE.Color(1.45, 1.43, 1.38) },
        uRingAWidth: { value: 0.13 },
        uRingB: { value: new THREE.Vector3(0.72, 0.32, -0.61).normalize() },
        uRingBColor: { value: new THREE.Color(0.95, 0.94, 0.91) },
        uRingBWidth: { value: 0.08 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uSky;
        uniform vec3 uHorizon;
        uniform vec3 uFloor;
        uniform vec3 uKeyDir;
        uniform vec3 uKeyColor;
        uniform float uKeySize;
        uniform vec3 uFillDir;
        uniform vec3 uFillColor;
        uniform float uFillSize;
        uniform vec3 uRimDir;
        uniform vec3 uRimColor;
        uniform float uRimSize;
        uniform vec3 uRingA;
        uniform vec3 uRingAColor;
        uniform float uRingAWidth;
        uniform vec3 uRingB;
        uniform vec3 uRingBColor;
        uniform float uRingBWidth;
        varying vec3 vDir;

        // Soft, round falloff — never an edge, so reflections stay liquid.
        float blob(vec3 dir, vec3 lightDir, float size) {
          float d = 1.0 - dot(dir, lightDir);
          return pow(smoothstep(size, 0.0, d), 2.2);
        }

        void main() {
          float y = vDir.y;
          vec3 color = mix(uFloor, uHorizon, smoothstep(-0.95, -0.05, y));
          color = mix(color, uSky, smoothstep(-0.05, 0.85, y));

          color += uKeyColor * blob(vDir, uKeyDir, uKeySize);
          color += uFillColor * blob(vDir, uFillDir, uFillSize);
          color += uRimColor * blob(vDir, uRimDir, uRimSize);

          // A ring is a band of directions perpendicular to an axis: bright
          // along a great circle, black either side of it.
          color += uRingAColor * pow(smoothstep(uRingAWidth, 0.0, abs(dot(vDir, uRingA))), 1.8);
          color += uRingBColor * pow(smoothstep(uRingBWidth, 0.0, abs(dot(vDir, uRingB))), 1.8);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    }),
  );

  scene.add(dome);
  return scene;
}

import * as THREE from "three";

/**
 * A procedural studio, baked once into a PMREM.
 *
 * Chrome is a mirror, so every straight edge in the environment comes back as
 * a bright line across the metal and every round light comes back as a dot.
 * The reference is built almost entirely from *filaments*, and a filament is
 * the reflection of a ring: a band of directions perpendicular to an axis.
 *
 * So the environment is a near-black dome plus five rings at different axes
 * and a couple of small hot spots. Five rings at five angles is what turns
 * "grey fog" into "molten metal".
 *
 * It is all code: no HDR file, no CDN, no network request.
 */
const RING_COUNT = 5;

const RINGS: Array<{ axis: [number, number, number]; color: number; width: number }> = [
  { axis: [0, 1, 0], color: 2.6, width: 0.011 },
  { axis: [0.72, 0.32, -0.61], color: 1.7, width: 0.007 },
  { axis: [-0.42, 0.86, 0.29], color: 1.3, width: 0.006 },
  { axis: [0.31, -0.28, 0.91], color: 1.05, width: 0.005 },
  { axis: [-0.86, -0.12, 0.49], color: 1.45, width: 0.008 },
];

export function createStudioEnvironment(): THREE.Scene {
  const scene = new THREE.Scene();

  const axes = RINGS.map((ring) => new THREE.Vector3(...ring.axis).normalize());
  const colors = RINGS.map(
    (ring) => new THREE.Color(ring.color, ring.color * 0.99, ring.color * 0.96),
  );
  const widths = RINGS.map((ring) => ring.width);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(50, 128, 96),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uSky: { value: new THREE.Color(0.012, 0.012, 0.012) },
        uHorizon: { value: new THREE.Color(0.004, 0.004, 0.004) },
        uFloor: { value: new THREE.Color(0.002, 0.002, 0.002) },
        uKeyDir: { value: new THREE.Vector3(-0.55, 0.62, 0.56).normalize() },
        uKeyColor: { value: new THREE.Color(3.4, 3.37, 3.28) },
        uKeySize: { value: 0.03 },
        uAxes: { value: axes },
        uColors: { value: colors },
        uWidths: { value: widths },
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
        uniform vec3 uAxes[${RING_COUNT}];
        uniform vec3 uColors[${RING_COUNT}];
        uniform float uWidths[${RING_COUNT}];

        varying vec3 vDir;

        void main() {
          float y = vDir.y;
          vec3 color = mix(uFloor, uHorizon, smoothstep(-0.95, -0.05, y));
          color = mix(color, uSky, smoothstep(-0.05, 0.85, y));

          // One small hot spot for the tight, near-white highlight.
          float keyD = 1.0 - dot(vDir, uKeyDir);
          color += uKeyColor * pow(smoothstep(uKeySize, 0.0, keyD), 2.6);

          // The filaments.
          for (int i = 0; i < ${RING_COUNT}; i++) {
            float band = smoothstep(uWidths[i], 0.0, abs(dot(vDir, uAxes[i])));
            color += uColors[i] * pow(band, 3.2);
          }

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    }),
  );

  scene.add(dome);
  return scene;
}

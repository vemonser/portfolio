import * as THREE from "three";

/**
 * A procedural studio, baked once into a cube map.
 *
 * The first version used ring lights to draw thin filaments, but a ring
 * reflects off a near-flat surface as a closed loop — a line that appears
 * from nowhere and reads as an artefact, not as metal. So: no rings. Two
 * broad, soft sources give the gradients that make the surface look liquid,
 * and one small hot spot gives the single crisp glint that makes it look
 * polished.
 *
 * It is all code: no HDR file, no CDN, no network request.
 */
export function createStudioEnvironment(): THREE.Scene {
  const scene = new THREE.Scene();

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(50, 128, 96),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uSky: { value: new THREE.Color(0.028, 0.028, 0.027) },
        uHorizon: { value: new THREE.Color(0.008, 0.008, 0.008) },
        uFloor: { value: new THREE.Color(0.002, 0.002, 0.002) },

        // Broad, soft key: the large gradient across the form.
        uKeyDir: { value: new THREE.Vector3(-0.62, 0.5, 0.6).normalize() },
        uKeyColor: { value: new THREE.Color(1.25, 1.24, 1.2) },
        uKeySize: { value: 0.75 },

        // Second, cooler fill from the opposite side.
        uFillDir: { value: new THREE.Vector3(0.8, -0.15, 0.58).normalize() },
        uFillColor: { value: new THREE.Color(0.55, 0.55, 0.54) },
        uFillSize: { value: 0.42 },

        // One small hot spot for a single crisp highlight.
        uDotDir: { value: new THREE.Vector3(0.12, 0.72, 0.68).normalize() },
        uDotColor: { value: new THREE.Color(4.2, 4.16, 4.05) },
        uDotSize: { value: 0.022 },
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
        uniform vec3 uDotDir;
        uniform vec3 uDotColor;
        uniform float uDotSize;

        varying vec3 vDir;

        float spot(vec3 dir, vec3 lightDir, float size, float softness) {
          float d = 1.0 - dot(dir, lightDir);
          return pow(smoothstep(size, 0.0, d), softness);
        }

        void main() {
          float y = vDir.y;

          // One continuous gradient. Two joined smoothsteps leave a slope
          // discontinuity at the seam, and a mirror renders that as a hard
          // line straight across the metal.
          vec3 color = mix(uFloor, uSky, smoothstep(-0.9, 0.9, y));
          color += uHorizon * exp(-pow(y * 3.2, 2.0));

          color += uKeyColor * spot(vDir, uKeyDir, uKeySize, 1.35);
          color += uFillColor * spot(vDir, uFillDir, uFillSize, 1.5);
          color += uDotColor * spot(vDir, uDotDir, uDotSize, 3.0);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
    }),
  );

  scene.add(dome);
  return scene;
}

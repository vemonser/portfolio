import * as THREE from "three";

/**
 * A procedural studio, captured once into a PMREM.
 *
 * three's RoomEnvironment is a *small room*, so a mirror sphere ends up
 * showing a miniature room inside the marble. What reads as chrome is a much
 * simpler thing: a huge gradient dome for the broad falloff, plus a handful
 * of hard emissive strips that become the highlights, plus large near-black
 * panels so half the sphere reflects nothing at all. Contrast is the metal.
 *
 * It is also a few hundred bytes of code and no network request.
 */
export function createStudioEnvironment(): THREE.Scene {
  const scene = new THREE.Scene();

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(50, 32, 24),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      uniforms: {
        uSky: { value: new THREE.Color(0.3, 0.3, 0.29) },
        uHorizon: { value: new THREE.Color(0.075, 0.075, 0.075) },
        uFloor: { value: new THREE.Color(0.02, 0.02, 0.02) },
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
        varying vec3 vDir;
        void main() {
          float y = vDir.y;
          vec3 color = mix(uFloor, uHorizon, smoothstep(-0.95, -0.02, y));
          color = mix(color, uSky, smoothstep(-0.02, 0.9, y));
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    }),
  );
  scene.add(dome);

  const panel = (
    width: number,
    height: number,
    intensity: number,
    position: [number, number, number],
  ) => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(intensity, intensity * 0.99, intensity * 0.96),
        side: THREE.DoubleSide,
      }),
    );
    mesh.position.set(...position);
    mesh.lookAt(0, 0, 0);
    scene.add(mesh);
  };

  // A broad softbox, a hard key, a rim, and an overhead strip. Different
  // sizes and distances are what separate "studio" from "two glowing bars".
  panel(9, 5, 0.55, [-3, 8, -7]);
  panel(1.2, 15, 7, [7.5, 5, 6]);
  panel(0.55, 9, 4.2, [-8.5, 3.6, 3.2]);
  panel(11, 0.8, 2.8, [0, 9, -2]);
  panel(3.4, 2.6, 1.7, [5.5, -3.4, 4.6]);
  panel(0.45, 8, 5.2, [-3.4, 4.2, 7.2]);
  panel(0.28, 6, 3.4, [3.6, -1.2, 8]);
  panel(6.5, 0.32, 2.6, [-2.2, -4.2, 7.4]);
  panel(0.6, 5, 3, [6.2, -3, -2.4]);
  panel(0.35, 4, 2.2, [-6.5, -1, 4]);

  /*
   * A face-on mirror reflects the cone directly behind the camera. That cone
   * has to be full of edges or the metal reads as flat grey, no matter how
   * good the shading is. These panels sit just in front of it, so a ±15°
   * change in surface normal slides the reflection across bright/dark
   * boundaries — which is the entire visual language of liquid chrome.
   */
  panel(17, 17, 0.005, [0, 0, 20]);
  panel(4.5, 11, 3.4, [-5.4, 3.2, 22]);
  panel(3.2, 9, 1.4, [5.6, -1.8, 22]);
  panel(15, 1.9, 2.6, [-1, 6.4, 22]);
  panel(15, 1.4, 0.01, [-1, -6.6, 22]);
  panel(1.1, 7, 3.9, [2.4, 4.4, 21]);
  panel(10, 5, 0.01, [-7.5, -3.5, 21]);

  // Negative space — the black halves of the reflection.
  panel(18, 22, 0.006, [-9, 1, -11]);
  panel(16, 20, 0.006, [10, -2, -10]);
  panel(20, 6, 0.004, [0, -7, 0]);

  return scene;
}

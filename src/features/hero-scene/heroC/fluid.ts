import * as THREE from "three";

import { FULLSCREEN_VERT } from "../glsl/composite";

/*
 * A small stable-fluids solver on the GPU: advect, curl/vorticity, divergence,
 * Jacobi pressure, gradient subtract. It is the interaction layer for the Hero
 * C sheet — density is the mask, velocity is the stir.
 *
 * Units: velocity is stored in simulation texels per second, so a 0.1 UV flick
 * lands around 600 px/s in a 512 grid and the advection step can use the same
 * texel size as every other pass. Grid is aspect-corrected (max dimension 512,
 * height from the viewport) so a circular splat stays circular on a wide screen.
 *
 * Adapted from Pavel Dobryakov's MIT WebGL-Fluid-Simulation, reduced to the
 * passes this scene needs. No pressure warm-start, no bloom, no shading pass.
 */

const SPLAT_FORCE = 6000;

const BASE_VERT = FULLSCREEN_VERT;

const SPLAT_FRAG = /* glsl */ `
precision highp float;

uniform sampler2D uSource;
uniform vec2 uPoint;
uniform vec3 uColor;
uniform float uRadius;
uniform float uAspect;

varying vec2 vUv;

void main() {
  vec2 p = vUv - uPoint;
  p.x *= uAspect;
  float g = exp(-dot(p, p) / uRadius);
  vec4 base = texture2D(uSource, vUv);
  gl_FragColor = base + vec4(uColor * g, 0.0);
}
`;

const ADVECTION_FRAG = /* glsl */ `
precision highp float;

uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform float uDt;
uniform float uDissipation;

varying vec2 vUv;

void main() {
  vec2 coord = vUv - uDt * texture2D(uVelocity, vUv).xy * uTexel;
  gl_FragColor = texture2D(uSource, coord) * uDissipation;
}
`;

const CURL_FRAG = /* glsl */ `
precision highp float;

uniform sampler2D uVelocity;
uniform vec2 uTexel;

varying vec2 vUv;

void main() {
  float L = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).y;
  float R = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
  float T = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).x;
  float B = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
  gl_FragColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}
`;

const VORTICITY_FRAG = /* glsl */ `
precision highp float;

uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 uTexel;
uniform float uCurlStrength;
uniform float uDt;

varying vec2 vUv;

void main() {
  float L = texture2D(uCurl, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture2D(uCurl, vUv + vec2(uTexel.x, 0.0)).x;
  float T = texture2D(uCurl, vUv + vec2(0.0, uTexel.y)).x;
  float B = texture2D(uCurl, vUv - vec2(0.0, uTexel.y)).x;
  float C = texture2D(uCurl, vUv).x;

  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= uCurlStrength * C;
  force.y *= -1.0;

  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity += force * uDt;
  velocity = clamp(velocity, vec2(-2000.0), vec2(2000.0));
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`;

const DIVERGENCE_FRAG = /* glsl */ `
precision highp float;

uniform sampler2D uVelocity;
uniform vec2 uTexel;

varying vec2 vUv;

void main() {
  float L = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
  float T = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
  float B = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
  float div = 0.5 * (R - L + T - B);
  gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
}
`;

const PRESSURE_FRAG = /* glsl */ `
precision highp float;

uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexel;

varying vec2 vUv;

void main() {
  float L = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float T = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float B = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  float divergence = texture2D(uDivergence, vUv).x;
  float pressure = (L + R + B + T - divergence) * 0.25;
  gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
}
`;

const GRADIENT_FRAG = /* glsl */ `
precision highp float;

uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 uTexel;

varying vec2 vUv;

void main() {
  float L = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
  float R = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float T = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  float B = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
  vec2 velocity = texture2D(uVelocity, vUv).xy;
  velocity -= vec2(R - L, T - B) * 0.5;
  gl_FragColor = vec4(velocity, 0.0, 1.0);
}
`;

type PingPong = {
  read: THREE.WebGLRenderTarget;
  write: THREE.WebGLRenderTarget;
};

const makeTarget = (width: number, height: number) =>
  new THREE.WebGLRenderTarget(width, height, {
    type: THREE.HalfFloatType,
    format: THREE.RGBAFormat,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
    generateMipmaps: false,
  });

const pingPong = (width: number, height: number): PingPong => ({
  read: makeTarget(width, height),
  write: makeTarget(width, height),
});

const swap = (pair: PingPong) => {
  const next = pair.read;
  pair.read = pair.write;
  pair.write = next;
};

export type FluidMetrics = {
  width: number;
  height: number;
  passes: number;
  iterations: number;
};

export class FluidField {
  readonly metrics: FluidMetrics;

  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private quad = new THREE.PlaneGeometry(2, 2);
  private mesh: THREE.Mesh;

  private velocity: PingPong;
  private density: PingPong;
  private pressure: PingPong;
  private divergence: THREE.WebGLRenderTarget;
  private curl: THREE.WebGLRenderTarget;

  private splatMaterial: THREE.ShaderMaterial;
  private advectionMaterial: THREE.ShaderMaterial;
  private curlMaterial: THREE.ShaderMaterial;
  private vorticityMaterial: THREE.ShaderMaterial;
  private divergenceMaterial: THREE.ShaderMaterial;
  private pressureMaterial: THREE.ShaderMaterial;
  private gradientMaterial: THREE.ShaderMaterial;

  private width: number;
  private height: number;
  private texel: THREE.Vector2;
  private iterations: number;
  private scratchColor = new THREE.Vector3();

  constructor(
    renderer: THREE.WebGLRenderer,
    width: number,
    height: number,
    options: { iterations?: number; aspect?: number } = {},
  ) {
    this.renderer = renderer;
    this.width = width;
    this.height = height;
    this.texel = new THREE.Vector2(1 / width, 1 / height);
    this.iterations = options.iterations ?? 16;
    this.metrics = {
      width,
      height,
      passes: 0,
      iterations: this.iterations,
    };

    this.velocity = pingPong(width, height);
    this.density = pingPong(width, height);
    this.pressure = pingPong(width, height);
    this.divergence = makeTarget(width, height);
    this.curl = makeTarget(width, height);

    const common = {
      uTexel: { value: this.texel },
      uAspect: { value: options.aspect ?? width / height },
    };

    this.splatMaterial = new THREE.ShaderMaterial({
      vertexShader: BASE_VERT,
      fragmentShader: SPLAT_FRAG,
      uniforms: {
        uSource: { value: null },
        uPoint: { value: new THREE.Vector2(0.5, 0.5) },
        uColor: { value: new THREE.Vector3() },
        uRadius: { value: 0.0006 },
        uAspect: common.uAspect,
      },
      depthTest: false,
      depthWrite: false,
    });

    this.advectionMaterial = new THREE.ShaderMaterial({
      vertexShader: BASE_VERT,
      fragmentShader: ADVECTION_FRAG,
      uniforms: {
        uVelocity: { value: null },
        uSource: { value: null },
        uTexel: common.uTexel,
        uDt: { value: 0 },
        uDissipation: { value: 1 },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.curlMaterial = new THREE.ShaderMaterial({
      vertexShader: BASE_VERT,
      fragmentShader: CURL_FRAG,
      uniforms: {
        uVelocity: { value: null },
        uTexel: common.uTexel,
      },
      depthTest: false,
      depthWrite: false,
    });

    this.vorticityMaterial = new THREE.ShaderMaterial({
      vertexShader: BASE_VERT,
      fragmentShader: VORTICITY_FRAG,
      uniforms: {
        uVelocity: { value: null },
        uCurl: { value: null },
        uTexel: common.uTexel,
        uCurlStrength: { value: 14 },
        uDt: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    });

    this.divergenceMaterial = new THREE.ShaderMaterial({
      vertexShader: BASE_VERT,
      fragmentShader: DIVERGENCE_FRAG,
      uniforms: {
        uVelocity: { value: null },
        uTexel: common.uTexel,
      },
      depthTest: false,
      depthWrite: false,
    });

    this.pressureMaterial = new THREE.ShaderMaterial({
      vertexShader: BASE_VERT,
      fragmentShader: PRESSURE_FRAG,
      uniforms: {
        uPressure: { value: null },
        uDivergence: { value: null },
        uTexel: common.uTexel,
      },
      depthTest: false,
      depthWrite: false,
    });

    this.gradientMaterial = new THREE.ShaderMaterial({
      vertexShader: BASE_VERT,
      fragmentShader: GRADIENT_FRAG,
      uniforms: {
        uPressure: { value: null },
        uVelocity: { value: null },
        uTexel: common.uTexel,
      },
      depthTest: false,
      depthWrite: false,
    });

    this.mesh = new THREE.Mesh(this.quad, this.splatMaterial);
    this.mesh.frustumCulled = false;
    this.scene.add(this.mesh);

    // Every field starts at true zero. WebGL zero-initialises new textures, but
    // a renderer clear colour is not zero; clearing explicitly keeps the first
    // frame independent of the surface's clear colour.
    const previousColor = new THREE.Color();
    this.renderer.getClearColor(previousColor);
    const previousAlpha = this.renderer.getClearAlpha();
    this.renderer.setClearColor(0x000000, 0);
    [
      this.velocity.read,
      this.velocity.write,
      this.density.read,
      this.density.write,
      this.pressure.read,
      this.pressure.write,
      this.divergence,
      this.curl,
    ].forEach((target) => this.clearPass(target));
    this.renderer.setClearColor(previousColor, previousAlpha);
  }

  get densityTexture(): THREE.Texture {
    return this.density.read.texture;
  }

  get velocityTexture(): THREE.Texture {
    return this.velocity.read.texture;
  }

  get texelSize(): THREE.Vector2 {
    return this.texel;
  }

  private clearPass(target: THREE.WebGLRenderTarget) {
    const previous = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(target);
    this.renderer.clear(true, false, false);
    this.renderer.setRenderTarget(previous);
  }

  private run(
    material: THREE.ShaderMaterial,
    target: THREE.WebGLRenderTarget,
  ) {
    this.mesh.material = material;
    this.renderer.setRenderTarget(target);
    this.renderer.render(this.scene, this.camera);
    this.metrics.passes += 1;
  }

  private splatPass(
    target: THREE.WebGLRenderTarget,
    source: THREE.Texture,
    x: number,
    y: number,
    color: THREE.Vector3,
    radius: number,
  ) {
    this.splatMaterial.uniforms.uSource.value = source;
    this.splatMaterial.uniforms.uPoint.value.set(x, y);
    this.splatMaterial.uniforms.uColor.value.copy(color);
    this.splatMaterial.uniforms.uRadius.value = radius;
    this.run(this.splatMaterial, target);
  }

  /**
   * One pointer/impulse splat. `dx`/`dy` are a UV delta, scaled here into the
   * solver's texel-per-second velocity; `amount` is dye density. Zero amount
   * skips the dye pass.
   */
  splat(
    x: number,
    y: number,
    dx: number,
    dy: number,
    amount: number,
    radius = 0.0006,
  ) {
    this.scratchColor.set(dx * SPLAT_FORCE, dy * SPLAT_FORCE, 0);

    this.splatPass(
      this.velocity.write,
      this.velocity.read.texture,
      x,
      y,
      this.scratchColor,
      radius,
    );
    swap(this.velocity);

    if (amount > 0) {
      this.scratchColor.set(amount, 0, 0);
      this.splatPass(
        this.density.write,
        this.density.read.texture,
        x,
        y,
        this.scratchColor,
        radius,
      );
      swap(this.density);
    }
  }

  step(dtSeconds: number) {
    const dt = Math.min(Math.max(dtSeconds, 1 / 240), 1 / 30);

    // curl
    this.curlMaterial.uniforms.uVelocity.value = this.velocity.read.texture;
    this.run(this.curlMaterial, this.curl);

    // vorticity confinement
    this.vorticityMaterial.uniforms.uVelocity.value =
      this.velocity.read.texture;
    this.vorticityMaterial.uniforms.uCurl.value = this.curl.texture;
    this.vorticityMaterial.uniforms.uDt.value = dt;
    this.run(this.vorticityMaterial, this.velocity.write);
    swap(this.velocity);

    // divergence
    this.divergenceMaterial.uniforms.uVelocity.value =
      this.velocity.read.texture;
    this.run(this.divergenceMaterial, this.divergence);

    // pressure: Jacobi iterations. The field is bounded and the previous
    // iterate is a valid warm start, so no extra damping pass is needed.
    for (let i = 0; i < this.iterations; i += 1) {
      this.pressureMaterial.uniforms.uPressure.value =
        this.pressure.read.texture;
      this.pressureMaterial.uniforms.uDivergence.value =
        this.divergence.texture;
      this.run(this.pressureMaterial, this.pressure.write);
      swap(this.pressure);
    }

    // subtract the gradient
    this.gradientMaterial.uniforms.uPressure.value =
      this.pressure.read.texture;
    this.gradientMaterial.uniforms.uVelocity.value =
      this.velocity.read.texture;
    this.run(this.gradientMaterial, this.velocity.write);
    swap(this.velocity);

    // advect velocity, then dye
    this.advectionMaterial.uniforms.uVelocity.value =
      this.velocity.read.texture;
    this.advectionMaterial.uniforms.uSource.value = this.velocity.read.texture;
    this.advectionMaterial.uniforms.uDt.value = dt;
    this.advectionMaterial.uniforms.uDissipation.value = Math.pow(
      0.985,
      dt * 60,
    );
    this.run(this.advectionMaterial, this.velocity.write);
    swap(this.velocity);

    this.advectionMaterial.uniforms.uVelocity.value =
      this.velocity.read.texture;
    this.advectionMaterial.uniforms.uSource.value = this.density.read.texture;
    this.advectionMaterial.uniforms.uDissipation.value = Math.pow(
      0.992,
      dt * 60,
    );
    this.run(this.advectionMaterial, this.density.write);
    swap(this.density);

    this.renderer.setRenderTarget(null);
  }

  /**
   * Advance the solver without rendering, for a poster frame or a deterministic
   * screenshot. `inject(t)` may add splats at a normalized time.
   */
  warmUp(seconds: number, inject?: (t: number) => void) {
    const step = 1 / 60;
    for (let t = 0; t < seconds; t += step) {
      inject?.(t / seconds);
      this.step(step);
    }
    this.renderer.setRenderTarget(null);
  }

  dispose() {
    this.velocity.read.dispose();
    this.velocity.write.dispose();
    this.density.read.dispose();
    this.density.write.dispose();
    this.pressure.read.dispose();
    this.pressure.write.dispose();
    this.divergence.dispose();
    this.curl.dispose();
    [
      this.splatMaterial,
      this.advectionMaterial,
      this.curlMaterial,
      this.vorticityMaterial,
      this.divergenceMaterial,
      this.pressureMaterial,
      this.gradientMaterial,
    ].forEach((material) => material.dispose());
    this.quad.dispose();
  }
}

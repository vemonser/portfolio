/**
 * The final pass: the mercury field, composed on one quad.
 *
 * The ripple state is sampled at the pixel and two tangents; the finite
 * difference is the slope. That single vector does two jobs:
 *   1. it displaces the metal (the wake is visible),
 *   2. it splits the environment per channel (dispersion).
 *
 * Everything else is atmosphere: a vignette, a darker floor so the wordmark
 * above sits down cleanly, and a grain layer so the gradients never band on
 * 8-bit panels.
 */
import { MERCURY_GLSL } from "./mercury";

/**
 * One vertex shader for every fullscreen pass. `PlaneGeometry(2, 2)` covers
 * clip space exactly, so `position.xy` is already the NDC we want.
 */
export const FULLSCREEN_VERT = /* glsl */ `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const COMPOSITE_GLSL = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uAspect;
uniform sampler2D uRipple;
uniform float uRippleAmp;
uniform float uDispersion;
uniform float uSheen;
uniform float uWarp;
uniform float uWarpDrift;
uniform float uScroll;

varying vec2 vUv;

${MERCURY_GLSL}

void main() {
  // Working in a centred, aspect-correct space keeps the folds isotropic on
  // any window shape.
  vec2 scale = vec2(uAspect, 1.0) * 0.8;
  vec2 p = (vUv - 0.5) * scale;
  p.y += uScroll * 0.12;

  vec2 duv = vec2(0.004) / scale;
  vec3 raw = vec3(
    texture2D(uRipple, vUv).r,
    texture2D(uRipple, vUv + vec2(duv.x, 0.0)).r,
    texture2D(uRipple, vUv + vec2(0.0, duv.y)).r
  );

  // A slow shallow warp on top of the fBm field. It keeps the surface alive
  // when nothing is touching it, like air moving over the metal.
  vec2 flow = vUv * vec2(5.0, 12.0);
  vec2 warp = (vec2(
    mNoise(flow + uWarpDrift),
    mNoise(flow + vec2(17.3, 4.1) - uWarpDrift)
  ) - 0.5) * uWarp;
  p += warp * 0.16 * scale;

  vec2 slope = vec2(raw.x - raw.y, raw.x - raw.z);
  vec3 col = mercury(
    p,
    uTime,
    raw * uRippleAmp,
    slope * uDispersion + warp * 0.12,
    raw.x * uSheen + length(warp) * 0.06
  );

  float vig = smoothstep(1.25, 0.35, length((vUv - 0.5) * vec2(uAspect * 0.8, 1.0)));
  col *= mix(0.55, 1.0, vig);
  col *= mix(0.55, 1.0, smoothstep(0.0, 0.45, vUv.y));

  // Reinhard-ish shoulder: the sun highlight would clip to pure white without
  // it, and clipped white loses the dispersion at exactly its brightest point.
  col = col / (1.0 + col * 0.35);

  col += (mHash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
`;

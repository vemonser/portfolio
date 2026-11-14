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
uniform vec3 uAccent;
uniform vec2 uPointer;
uniform vec2 uCompressionCenter;
uniform vec2 uCompressionHalfSize;
uniform vec2 uCompressionDirection;
uniform float uCompressionStrength;

varying vec2 vUv;

${MERCURY_GLSL}

/**
 * Signed distance to the active compression rectangle, in the same centred,
 * aspect-correct space as the mercury field.
 */
float compressionDistance(vec2 p, vec2 center, vec2 halfSize) {
  vec2 d = abs(p - center) - halfSize;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
  // Working in a centred, aspect-correct space keeps the folds isotropic on
  // any window shape.
  vec2 scale = vec2(uAspect, 1.0) * 0.8;
  vec2 p = (vUv - 0.5) * scale;
  p.y += uScroll * 0.2;

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

  /*
   * Liquid compression. The active target arrives in UV space; convert it
   * into the field's own space, then fold the domain toward the rectangle's
   * axis instead of denting it in a circle. The crease runs across the
   * reading direction, so Arabic folds the other way without mirroring the
   * lighting. Strength zero makes every term vanish.
   */
  vec2 zoneCenter = (uCompressionCenter - 0.5) * scale;
  vec2 zoneHalf = max(uCompressionHalfSize * scale, vec2(0.001));
  vec2 foldDir = normalize(uCompressionDirection + vec2(0.0001));
  vec2 fromCenter = p - zoneCenter;
  float edge =
    1.0 - smoothstep(0.0, 0.14, abs(compressionDistance(p, zoneCenter, zoneHalf)));
  float fold = edge * uCompressionStrength;
  float along = dot(fromCenter, foldDir);
  float across = dot(fromCenter, vec2(-foldDir.y, foldDir.x));

  p += foldDir * (-along * 0.55 * fold);
  p += foldDir * (sin(across * 18.0 + uTime * 0.8) * 0.012 * fold);

  vec3 col = mercury(
    p,
    uTime,
    raw * uRippleAmp,
    slope * uDispersion + warp * 0.12,
    raw.x * uSheen + length(warp) * 0.06 + fold * 0.18
  );

  float vig = smoothstep(1.25, 0.35, length((vUv - 0.5) * vec2(uAspect * 0.8, 1.0)));
  col *= mix(0.55, 1.0, vig);
  col *= mix(0.55, 1.0, smoothstep(0.0, 0.45, vUv.y));

  // Reinhard-ish shoulder: the sun highlight would clip to pure white without
  // it, and clipped white loses the dispersion at exactly its brightest point.
  col = col / (1.0 + col * 0.35);

  // The accent only lives on the crest of a fresh ripple, near the cursor:
  // idle metal stays monochrome.
  float crest = smoothstep(0.12, 0.6, raw.x);
  float near = 1.0 - smoothstep(0.04, 0.4, distance(vUv, uPointer));
  col += uAccent * crest * near * 0.12;

  col += (mHash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
`;

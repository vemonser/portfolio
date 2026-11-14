/**
 * One step of the ripple simulation.
 *
 * A ping-pong pair of render targets holds the wave state: `.r` is the current
 * height, `.g` the previous height. The classic damped wave equation
 * `next = (neighbours * 0.5 - previous) * damping` makes each pixel trade with
 * its four neighbours, so a disturbance spreads and fades over time instead of
 * staying under the cursor.
 *
 * The cursor is injected as a capsule — the closest distance to the segment
 * the pointer travelled this frame — rather than a disc, so fast strokes leave
 * one continuous wake instead of a dotted line.
 */
export const RIPPLE_GLSL = /* glsl */ `
precision highp float;

uniform sampler2D uState;
uniform vec2 uTexel;
uniform vec2 uA;
uniform vec2 uB;
uniform float uForce;
uniform float uRadius;
uniform float uAspect;

varying vec2 vUv;

void main() {
  vec4 s = texture2D(uState, vUv);
  float n =
    texture2D(uState, vUv + vec2(uTexel.x, 0.0)).r +
    texture2D(uState, vUv - vec2(uTexel.x, 0.0)).r +
    texture2D(uState, vUv + vec2(0.0, uTexel.y)).r +
    texture2D(uState, vUv - vec2(0.0, uTexel.y)).r;

  float next = (n * 0.5 - s.g) * 0.976;

  vec2 k = vec2(uAspect, 1.0);
  vec2 pa = (vUv - uA) * k;
  vec2 ba = (uB - uA) * k;
  float t = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  float d = length(pa - ba * t);
  next += uForce * (1.0 - smoothstep(0.0, uRadius, d));

  gl_FragColor = vec4(clamp(next, -2.0, 2.0), s.r, 0.0, 1.0);
}
`;

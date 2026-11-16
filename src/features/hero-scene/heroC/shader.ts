import { MERCURY_GLSL } from "../glsl/mercury";

/**
 * Hero C composite: one quad that draws both layers and the fluid mask.
 *
 *   membrane  the same metal, far from the light, carrying a ghost wordmark
 *   chrome    the existing mercury surface, carrying the solid wordmark
 *   reveal    max(fluid density, ambient band around the name, scroll-open)
 *
 * The DOM h1 is sampled from `uText`, which is drawn in section space, so it
 * lands exactly where the real text was before it went transparent.
 */
export const HERO_C_FRAG = /* glsl */ `
precision highp float;

uniform float uTime;
uniform float uAspect;
uniform sampler2D uDensity;
uniform sampler2D uVelocity;
uniform vec2 uSimTexel;
uniform sampler2D uText;
uniform float uTextReady;
uniform vec2 uAmbientCenter;
uniform vec2 uAmbientHalf;
uniform float uAmbientStrength;
uniform float uReveal;
uniform float uPosterReveal;
uniform vec3 uAccent;
uniform vec2 uPointer;
uniform float uScroll;
uniform float uDebug;

varying vec2 vUv;

${MERCURY_GLSL}

void main() {
  vec2 scale = vec2(uAspect, 1.0) * 0.8;
  vec2 p = (vUv - 0.5) * scale;
  p.y += uScroll * 0.2;

  // Layer B — the chrome room. The same surface the site already has, lifted
  // out of the dark: a deep studio with a horizon, so an opening reads as
  // chrome anywhere on the sheet, not only on a fold.
  vec3 chrome = mercury(p, uTime, vec3(0.0), vec2(0.0), 0.04);
  chrome *= 1.22;
  chrome += vec3(0.045, 0.047, 0.052);
  chrome += vec3(0.1, 0.105, 0.115) *
    exp(-pow((vUv.y - 0.42) * 2.6, 2.0));

  // Layer A — the membrane. The same metal in shadow. A second mercury call
  // doubles the shader cost for a surface that is 92% black; the darkened
  // chrome reads the same and keeps the frame budget for the fluid.
  vec3 membrane = chrome * 0.075 + vec3(0.005, 0.006, 0.007);

  // A tiny 5-tap blur on the mask. The raw field keeps every splat's fingerprint,
  // which reads as cracked crust at the rim; a blurred iso-contour reads liquid.
  vec2 de = uSimTexel * 1.6;
  float density =
    (
      texture2D(uDensity, vUv).r * 2.0 +
      texture2D(uDensity, vUv + vec2(de.x, 0.0)).r +
      texture2D(uDensity, vUv - vec2(de.x, 0.0)).r +
      texture2D(uDensity, vUv + vec2(0.0, de.y)).r +
      texture2D(uDensity, vUv - vec2(0.0, de.y)).r
    ) / 6.0;
  float fluid = smoothstep(0.1, 0.4, density);
  // The ambient opening: a soft, noise-broken ellipse over the painted
  // wordmark box. It is the floor that keeps the name readable when the
  // pointer is asleep, and it must never read as a geometric lens.
  vec2 ad = (vUv - uAmbientCenter) / uAmbientHalf;
  float wobble = mNoise(vUv * vec2(6.0, 14.0) + uTime * 0.03) - 0.5;
  float ambientMask =
    1.0 - smoothstep(0.6, 1.45, length(ad) * (1.0 + wobble * 0.35));
  float ambient = ambientMask * uAmbientStrength;
  float poster = ambientMask * uPosterReveal;

  float reveal = clamp(
    max(max(fluid, ambient), max(uReveal, poster)),
    0.0,
    1.0
  );

  // Lab diagnostics: 1 text alpha, 2 density, 3 reveal, 4 chrome.
  if (uDebug > 0.5) {
    if (uDebug < 1.5) {
      float a = texture2D(uText, vUv).a;
      gl_FragColor = vec4(vec3(a), 1.0);
      return;
    }
    if (uDebug < 2.5) {
      gl_FragColor = vec4(vec3(density), 1.0);
      return;
    }
    if (uDebug < 3.5) {
      gl_FragColor = vec4(vec3(reveal), 1.0);
      return;
    }
    gl_FragColor = vec4(chrome, 1.0);
    return;
  }

  // The room is lit: inside the opening the chrome catches a soft haze and a
  // horizon strip behind the type, so a reveal reads as a place behind the
  // sheet rather than a brighter pixel.
  float room = ambientMask * uAmbientStrength;
  chrome = chrome * (1.0 + room * 0.55) + vec3(0.06, 0.058, 0.054) * room;
  float horizon = exp(-pow((vUv.y - uAmbientCenter.y) * 7.0, 2.0));
  chrome += vec3(0.075, 0.078, 0.085) * horizon * ambientMask;

  // A reveal is a lit room: the chrome brightens as the sheet opens.
  chrome *= 1.0 + reveal * 0.35;

  vec3 col = mix(membrane, chrome, reveal);

  // Atmosphere belongs to the metal, not to the type. Applying the floor
  // shadow or the shoulder after the text would grey the name exactly where
  // it sits.
  float vig = smoothstep(1.25, 0.35, length((vUv - 0.5) * vec2(uAspect * 0.8, 1.0)));
  col *= mix(0.5, 1.0, vig);
  col *= mix(0.78, 1.0, smoothstep(0.0, 0.45, vUv.y));
  col = col / (1.0 + col * 0.35);

  // Text: a velocity-warped sample of the DOM wordmark. The shift is tiny on
  // purpose — enough to feel liquid, never enough to blur the name.
  vec2 velUv = texture2D(uVelocity, vUv).xy * uSimTexel;
  vec2 textUv = vUv + clamp(velUv * 0.004, vec2(-0.006), vec2(0.006));
  textUv.y -= uScroll * 0.04;
  float textMask = texture2D(uText, textUv).a * uTextReady;

  // The type sits in the metal: a soft contact shadow keeps bone legible when
  // the chrome behind a glyph is a white crest.
  float shadowMask = texture2D(uText, textUv + vec2(0.0016, -0.0028)).a;
  col *= 1.0 - shadowMask * 0.38;

  // The ghost lives on the membrane; it is the fallback that keeps the name
  // legible even when the sheet is nearly closed.
  vec3 bone = vec3(0.96, 0.94, 0.89);
  col += bone * textMask * 0.095 * (1.0 - reveal);

  // The solid name lives in the chrome room.
  float textReveal = smoothstep(0.05, 0.34, reveal);
  vec3 textCol = bone * (0.95 + 0.1 * clamp(dot(chrome, vec3(0.3333)), 0.0, 1.0));
  col = mix(col, textCol, textMask * textReveal);

  // Thin-film edge: the boundary of the reveal picks up dispersion and a lime
  // filament. This is what makes the opening read as a tear in a sheet rather
  // than a soft vignette.
  vec2 e = uSimTexel * 2.5;
  float dx =
    texture2D(uDensity, vUv + vec2(e.x, 0.0)).r -
    texture2D(uDensity, vUv - vec2(e.x, 0.0)).r;
  float dy =
    texture2D(uDensity, vUv + vec2(0.0, e.y)).r -
    texture2D(uDensity, vUv - vec2(0.0, e.y)).r;
  float edge = smoothstep(0.05, 0.3, length(vec2(dx, dy)));
  // Only the transition band is a rim; the saturated interior is just open.
  float rim =
    smoothstep(0.02, 0.12, density) * (1.0 - smoothstep(0.26, 0.5, density));
  edge *= rim;
  col += vec3(0.13, 0.14, 0.16) * edge;
  col.r += edge * 0.012;
  col += uAccent * edge * 0.04;

  col += (mHash(gl_FragCoord.xy + fract(uTime) * 91.0) - 0.5) / 255.0;

  gl_FragColor = vec4(col, 1.0);
}
`;

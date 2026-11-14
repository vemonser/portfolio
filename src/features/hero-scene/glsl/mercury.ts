/**
 * The mercury field — a screen-space molten-metal surface.
 *
 * There is no geometry, no light rig and no environment map. Every pixel of
 * metal comes from one value-noise field, so the surface is as sharp as the
 * display and costs no download. The look is adapted from the public
 * "liquid chrome" shader family (David Lyons' ogl examples, MIT): a rotated
 * fBm gives the height, a second fBm warps the domain so folds read as liquid
 * rather than bumps, and the environment is a procedural studio with two long
 * strips and one tight sun.
 *
 * Dispersion is baked into the shading itself: each RGB channel reflects the
 * environment from a slightly different normal, which is where the red/blue
 * fringing on the crests comes from. The composite reuses the same slope to
 * displace the surface against the wave field.
 *
 * Symbols are prefixed `m` (mercury) and only ever compiled inside the
 * fullscreen composite, so there is nothing here to collide with.
 */
export const MERCURY_GLSL = /* glsl */ `
float mHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float mNoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float a = mHash(i);
  float b = mHash(i + vec2(1.0, 0.0));
  float c = mHash(i + vec2(0.0, 1.0));
  float d = mHash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Rotating the domain between octaves hides the axis-aligned grid of value
// noise; the extra scale is what makes each octave read as finer detail.
const mat2 M_ROT = mat2(1.6, 1.2, -1.2, 1.6);

float mFbm3(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * mNoise(p);
    p = M_ROT * p;
    a *= 0.5;
  }
  return v;
}

float mFbm4(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * mNoise(p);
    p = M_ROT * p;
    a *= 0.4;
  }
  return v;
}

// Two independent fBm samples drifting in opposite directions. This is the
// difference between "noise" and "liquid": every point is pushed by another
// slice of the same field, so the surface folds instead of bumping. The drift
// is deliberately slow — this is a still pool, not a storm.
vec2 mWarp(vec2 p, float t) {
  return vec2(
    mFbm3(p + t * vec2(0.15, 0.08)),
    mFbm3(p + vec2(5.2, 1.3) - t * vec2(0.11, 0.14))
  );
}

float mHeight(vec2 p, vec2 w, float t) {
  return mFbm4(p + 1.9 * w + vec2(t * 0.05, -t * 0.035));
}

// A studio, not an HDRI: a dim sky gradient, one long horizontal strip, one
// vertical bounce card and a tight sun. Metal is nothing but what it reflects,
// so every highlight in the frame is one of these four.
vec3 mEnv(vec3 r) {
  float sky = smoothstep(-0.6, 1.0, r.y);
  float env = mix(0.02, 0.16, sky * sky);
  float stripH = exp(-pow((r.y - 0.45) * 9.0, 2.0)) * smoothstep(1.0, 0.1, abs(r.x + 0.1));
  float stripV = exp(-pow((r.x - 0.62) * 11.0, 2.0)) * smoothstep(0.9, -0.2, r.y);
  env += stripH + stripV * 0.5;
  vec3 L = normalize(vec3(-0.45, 0.55, 0.7));
  env += pow(max(dot(r, L), 0.0), 90.0) * 2.2;
  return vec3(env) * vec3(0.93, 0.96, 1.0);
}

vec3 mIridescence(float phase) {
  return 0.5 + 0.5 * cos(6.28318 * (phase + vec3(0.0, 0.33, 0.67)));
}

// extra carries the ripple heights (centre + two tangents), disp the
// colour split, sheen the thin-film phase. All three come from the wave
// simulation, which is what makes the metal answer the cursor.
vec3 mercury(vec2 p, float t, vec3 extra, vec2 disp, float sheen) {
  vec2 w = mWarp(p, t);
  float e = 0.004;
  float h = mHeight(p, w, t) + extra.x;
  float hx = mHeight(p + vec2(e, 0.0), w, t) + extra.y;
  float hy = mHeight(p + vec2(0.0, e), w, t) + extra.z;

  vec3 n = normalize(vec3((h - hx) / e * 0.65, (h - hy) / e * 0.65, 1.0));
  vec3 v = vec3(0.0, 0.0, -1.0);
  vec3 nR = normalize(n + vec3(disp, 0.0));
  vec3 nB = normalize(n - vec3(disp, 0.0));

  vec3 col = vec3(
    mEnv(reflect(v, nR)).r,
    mEnv(reflect(v, n)).g,
    mEnv(reflect(v, nB)).b
  );

  float film = clamp(abs(sheen), 0.0, 1.0);
  col = mix(col, col * mIridescence(sheen * 1.5 + h) * 1.6, film);

  float fresnel = pow(1.0 - clamp(n.z, 0.0, 1.0), 3.0);
  col += fresnel * 0.35;
  col *= mix(0.6, 1.05, smoothstep(0.2, 0.7, h));
  return col;
}
`;

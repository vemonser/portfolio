import * as THREE from "three";

/*
 * The DOM wordmark, copied into a canvas texture.
 *
 * The h1 stays the source of truth — layout, SEO, find-in-page, selection and
 * text-only zoom all still see real text. This module only mirrors its painted
 * box into a texture the shader can reveal, tint and distort. It draws in
 * section-relative CSS pixels and samples with section UVs, so registration is
 * 1:1 without any per-frame measuring.
 *
 * The texture is capped at 2048 px on the long edge. The wordmark is huge; at 2×
 * a 1440 hero would be 2880 px wide for no visible gain once the fluid is
 * moving over it.
 */

const MAX_DIMENSION = 2048;
const SCALE_CAP = 2;
const MIN_SCALE = 0.5;

export type TextTexture = {
  texture: THREE.CanvasTexture;
  sync: () => void;
  dispose: () => void;
  /** CSS-pixel box of the painted glyphs, relative to the section. */
  box: () => { left: number; top: number; width: number; height: number } | null;
  /** Diagnostics for the lab: what the last paint used. */
  debug: () => Record<string, unknown> | null;
};

export function createTextTexture(
  wordmark: HTMLElement,
  section: HTMLElement,
): TextTexture {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  let frame = 0;
  let lastBox: { left: number; top: number; width: number; height: number } | null =
    null;
  let lastDraw: Record<string, unknown> | null = null;

  const draw = () => {
    frame = 0;
    if (!context) return;

    const sectionRect = section.getBoundingClientRect();
    const wordmarkRect = wordmark.getBoundingClientRect();
    if (sectionRect.width < 2 || sectionRect.height < 2) return;
    if (wordmarkRect.width < 1 || wordmarkRect.height < 1) return;

    const dpr = Math.min(window.devicePixelRatio || 1, SCALE_CAP);
    const cap = Math.min(
      1,
      MAX_DIMENSION / Math.max(sectionRect.width * dpr, sectionRect.height * dpr),
    );
    const scale = Math.max(MIN_SCALE, dpr * cap);

    const width = Math.round(sectionRect.width * scale);
    const height = Math.round(sectionRect.height * scale);
    const resized = canvas.width !== width || canvas.height !== height;
    if (resized) {
      canvas.width = width;
      canvas.height = height;
    }

    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.clearRect(0, 0, sectionRect.width, sectionRect.height);

    const style = window.getComputedStyle(wordmark);
    const fontSize = Number.parseFloat(style.fontSize);
    if (!Number.isFinite(fontSize) || fontSize < 1) return;

    const raw = (wordmark.textContent ?? "").trim();
    if (!raw) return;
    const text = style.textTransform === "uppercase" ? raw.toUpperCase() : raw;

    // The range is the painted line box; its centre is the em-box centre, which
    // is where `textBaseline: middle` puts the glyphs.
    const range = document.createRange();
    range.selectNodeContents(wordmark);
    const glyph = range.getBoundingClientRect();
    if (glyph.width < 1) return;

    const left = glyph.left - sectionRect.left;
    const top = glyph.top - sectionRect.top;
    const centerX = left + glyph.width / 2;
    const centerY = top + glyph.height / 2;

    const tracking = Number.parseFloat(style.letterSpacing);
    const letterSpacing = Number.isFinite(tracking) ? tracking : 0;

    context.font = `${style.fontStyle} ${style.fontWeight} ${fontSize}px ${style.fontFamily}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#ffffff";

    const supportsTracking =
      "letterSpacing" in (context as unknown as Record<string, unknown>);
    if (supportsTracking) {
      (
        context as CanvasRenderingContext2D & { letterSpacing: string }
      ).letterSpacing = `${letterSpacing}px`;
    }

    const measured = supportsTracking
      ? context.measureText(text).width
      : measureManual(context, text, letterSpacing);

    // Sub-pixel differences between CSS and Canvas tracking are common; a small
    // horizontal correction lands the canvas glyph box on the DOM one.
    const correction =
      measured > 0
        ? Math.min(1.08, Math.max(0.92, glyph.width / measured))
        : 1;

    context.save();
    context.translate(centerX, 0);
    context.scale(correction, 1);
    context.translate(-centerX, 0);

    if (supportsTracking) {
      context.fillText(text, centerX, centerY);
    } else {
      // Safari < 18.4 has no ctx.letterSpacing: advance glyph by glyph.
      const chars = Array.from(text);
      const total = chars.reduce(
        (sum, char) => sum + context.measureText(char).width + letterSpacing,
        -letterSpacing,
      );
      let x = centerX - total / 2;
      context.textAlign = "left";
      for (const char of chars) {
        context.fillText(char, x, centerY);
        x += context.measureText(char).width + letterSpacing;
      }
    }

    context.restore();

    lastBox = { left, top, width: glyph.width, height: glyph.height };
    lastDraw = {
      width,
      height,
      scale,
      text,
      fontSize,
      centerX,
      centerY,
      font: context.font,
      measured,
      correction,
      glyphWidth: glyph.width,
      supportsTracking,
      resized,
    };
    if (resized || !texture.needsUpdate) texture.needsUpdate = true;
  };

  const measureManual = (
    ctx: CanvasRenderingContext2D,
    text: string,
    letterSpacing: number,
  ) => {
    const chars = Array.from(text);
    return chars.reduce(
      (sum, char) => sum + ctx.measureText(char).width + letterSpacing,
      -letterSpacing,
    );
  };

  const sync = () => {
    if (frame !== 0) cancelAnimationFrame(frame);
    frame = 0;
    draw();
  };

  const schedule = () => {
    if (frame !== 0) return;
    frame = requestAnimationFrame(draw);
  };

  const resizeObserver = new ResizeObserver(schedule);
  resizeObserver.observe(wordmark);
  resizeObserver.observe(section);
  window.addEventListener("resize", schedule);
  const fontReady = document.fonts?.ready;
  if (fontReady) void fontReady.then(schedule).catch(() => {});

  sync();

  return {
    texture,
    sync,
    box: () => lastBox,
    debug: () => lastDraw,
    dispose() {
      if (frame !== 0) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", schedule);
      texture.dispose();
    },
  };
}

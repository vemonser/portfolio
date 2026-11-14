import { clamp } from "./math";

/**
 * The Hero's liquid compression is a shader effect driven by one rectangle:
 * the surface folds anisotropically toward a target (the wordmark or a visible
 * project card) while the pointer is over it.
 *
 * This module is the pure half of that decision. It turns DOM rectangles into
 * normalized, GL-oriented values and decides which target is active. It never
 * reads the DOM, so the geometry is testable without a browser or a GPU.
 */

export type CompressionZone = {
  /** Centre in normalized canvas space (0–1, y up). */
  center: [number, number];
  /** Half extents, as a fraction of the viewport. */
  halfSize: [number, number];
  /** Unit vector the fold travels along: right in LTR, left in RTL. */
  direction: [number, number];
  /** 0–1; the scene smooths this toward its uniform. */
  strength: number;
};

export type CompressionTarget = {
  /** Client-space rectangle, as getBoundingClientRect reports it. */
  rect: { left: number; top: number; width: number; height: number };
  direction: "ltr" | "rtl";
};

export type Viewport = { width: number; height: number };

const isFiniteRect = (rect: CompressionTarget["rect"]) =>
  Number.isFinite(rect.left) &&
  Number.isFinite(rect.top) &&
  Number.isFinite(rect.width) &&
  Number.isFinite(rect.height);

/**
 * Normalize one target, or return null when it cannot produce a usable fold:
 * no viewport, an empty rectangle, zero strength, or a rectangle entirely
 * outside the viewport. Partially visible targets are kept — a card clipped by
 * the fold is exactly when the effect is most visible.
 */
export function compressionZone(
  target: CompressionTarget,
  viewport: Viewport,
  strength: number,
): CompressionZone | null {
  const { width: viewportWidth, height: viewportHeight } = viewport;
  const { rect } = target;

  if (!(viewportWidth > 0) || !(viewportHeight > 0)) return null;
  if (!isFiniteRect(rect)) return null;
  if (!(rect.width > 0) || !(rect.height > 0)) return null;

  const clamped = clamp(strength, 0, 1);
  if (clamped <= 0) return null;

  const right = rect.left + rect.width;
  const bottom = rect.top + rect.height;

  if (right <= 0 || rect.left >= viewportWidth) return null;
  if (bottom <= 0 || rect.top >= viewportHeight) return null;

  return {
    center: [
      (rect.left + rect.width / 2) / viewportWidth,
      1 - (rect.top + rect.height / 2) / viewportHeight,
    ],
    halfSize: [
      rect.width / (2 * viewportWidth),
      rect.height / (2 * viewportHeight),
    ],
    direction: target.direction === "rtl" ? [-1, 0] : [1, 0],
    strength: clamped,
  };
}

/**
 * The target under the pointer. When rectangles overlap (the wordmark sits over
 * the hero, a card can overlap the section edge) the nearest centre wins; an
 * exact tie keeps catalogue order, so the result never flickers between two
 * candidates on the same pixel.
 */
export function activeCompressionZone(
  targets: CompressionTarget[],
  pointer: [number, number],
  viewport: Viewport,
  strength: number,
): CompressionZone | null {
  const [x, y] = pointer;

  if (!targets.length) return null;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;

  let best: CompressionTarget | null = null;
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const target of targets) {
    const { rect } = target;
    if (!isFiniteRect(rect)) continue;
    if (rect.width <= 0 || rect.height <= 0) continue;

    const inside =
      x >= rect.left &&
      x <= rect.left + rect.width &&
      y >= rect.top &&
      y <= rect.top + rect.height;
    if (!inside) continue;

    const distance = Math.hypot(
      x - (rect.left + rect.width / 2),
      y - (rect.top + rect.height / 2),
    );

    if (distance < bestDistance) {
      bestDistance = distance;
      best = target;
    }
  }

  return best ? compressionZone(best, viewport, strength) : null;
}

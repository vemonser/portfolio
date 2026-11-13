export const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Progress of the hero leaving the viewport: 0 while its top is pinned to the
 * top edge, 1 once it has travelled its own height. Pure, so it can be tested
 * without a browser or a GPU.
 */
export function heroScrollProgress(
  rectTop: number,
  height: number,
  viewportHeight: number,
): number {
  if (height <= 0) return 0;
  const travel = Math.min(height, viewportHeight);
  if (travel <= 0) return 0;
  return clamp(-rectTop / travel, 0, 1);
}

/**
 * Camera distance that makes a blob of `radius` occupy a chosen share of the
 * frame. On portrait the width becomes the limit, so the form still reads as
 * a form instead of being cropped into a wall.
 */
export function cameraDistance(
  radius: number,
  aspect: number,
  fovDeg: number,
  fill: number,
): number {
  const tanHalf = Math.tan((fovDeg * Math.PI) / 360);
  const share = aspect >= 1 ? fill : fill * aspect;
  return clamp((2 * radius) / (share * 2 * tanHalf), 2.4, 14);
}

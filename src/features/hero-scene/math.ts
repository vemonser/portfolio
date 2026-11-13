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

/**
 * Approved cursor variants for the lab switcher.
 *
 * Centralised so the default and the allowed set have a single source of
 * truth; the lab component only renders them.
 */
export const DEFAULT_CURSOR_VARIANT = "magnetic-lime" as const;

export const CURSOR_VARIANTS = [
  { id: "magnetic-lime", label: "Lime" },
  { id: "magnetic-bone", label: "Bone" },
] as const;

export type CursorVariant = (typeof CURSOR_VARIANTS)[number]["id"];

export function isCursorVariant(
  value: string | undefined,
): value is CursorVariant {
  return CURSOR_VARIANTS.some((option) => option.id === value);
}

/**
 * The editorial system's shared numbers.
 *
 * CSS owns colour and layout; this module owns the decisions that must agree
 * between TypeScript and the stylesheet — the English composition's type
 * ceiling, reading measure and the counters the site shows.
 */

export type EditorialType = {
  /** One ratio for the whole composition, never a second scale. */
  ratio: number;
  /** Ceiling for the display face. */
  displayMax: string;
  /** Reading measure for argument-sized copy. */
  bodyMeasure: string;
};

const TYPE: EditorialType = {
  ratio: 1.25,
  displayMax: "7.5rem",
  bodyMeasure: "60ch",
};

export function editorialType(): EditorialType {
  return TYPE;
}

/**
 * The only spacing values the site is allowed to use, smallest to largest.
 * Editorial chapters are spaced from the top of this scale; components from
 * the bottom. A value not in this list does not belong in the build.
 */
const SPACE = [
  "0.5rem",
  "1rem",
  "1.5rem",
  "3rem",
  "6rem",
  "10rem",
] as const;

export function editorialSpace(step: number): string {
  if (!Number.isInteger(step) || step < 0 || step >= SPACE.length) {
    throw new RangeError(
      `editorialSpace: ${step} is outside 0-${SPACE.length - 1}`,
    );
  }

  return SPACE[step];
}

/** Zero-based index to the two-digit chapter numbers the site shows. */
export function chapterNumber(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/** Padded counters: chapter numbers, project indices, archive positions. */
export function formatNumber(
  value: number,
  options: { pad?: number } = {},
): string {
  return String(value).padStart(options.pad ?? 0, "0");
}

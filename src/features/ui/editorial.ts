/**
 * The editorial system's shared numbers.
 *
 * CSS owns colour and layout; this module owns the decisions that must agree
 * between TypeScript and the stylesheet — the locale compositions, the spacing
 * scale and the number formatting that switches script with the locale.
 */

export type Locale = "en" | "ar";

export type EditorialType = {
  /** One ratio for the whole composition, never a second scale. */
  ratio: number;
  /** Ceiling for the display face. Arabic gets more room for its ascenders. */
  displayMax: string;
  /** Reading measure for argument-sized copy. */
  bodyMeasure: string;
  /** Leading that Arabic actually needs at body size. */
  arabicLeading: number;
};

const TYPE: Record<Locale, EditorialType> = {
  en: {
    ratio: 1.25,
    displayMax: "8.5rem",
    bodyMeasure: "68ch",
    arabicLeading: 1.55,
  },
  ar: {
    ratio: 1.25,
    displayMax: "9rem",
    bodyMeasure: "58ch",
    arabicLeading: 1.8,
  },
};

export function editorialType(locale: Locale): EditorialType {
  return TYPE[locale];
}

/**
 * The only spacing values the site is allowed to use, smallest to largest.
 * Editorial chapters are spaced from the top of this scale; components from
 * the bottom. A value not in this list does not belong in the build.
 */
const SPACE = [
  "0.5rem",
  "0.75rem",
  "1rem",
  "1.5rem",
  "2rem",
  "3rem",
  "4.5rem",
  "7rem",
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

const ARABIC_INDIC = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

/**
 * Counters, years and dates follow the script of the page: Arabic-Indic
 * digits in Arabic, Latin digits in English. `dateTime` attributes and stored
 * dates stay ISO — only presentation is localized.
 */
export function formatNumber(
  value: number,
  locale: Locale,
  options: { pad?: number } = {},
): string {
  const latin = String(value).padStart(options.pad ?? 0, "0");

  if (locale === "en") return latin;

  return latin.replace(/[0-9]/g, (digit) => ARABIC_INDIC[Number(digit)]);
}

/**
 * Route params arrive as `string`. Everything downstream takes the closed
 * `Locale` union, so the boundary normalizes once instead of casting.
 */
export function toLocale(value: string | undefined): Locale {
  return value === "ar" ? "ar" : "en";
}

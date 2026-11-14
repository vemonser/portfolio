import type { ReactNode } from "react";

import { formatNumber, type Locale } from "./editorial";

type Props = {
  locale: Locale;
  /** Zero-based chapter position, rendered one-based. */
  index: number;
  children: ReactNode;
};

/**
 * The chapter opener: a two-digit index and its label, set in the label face.
 * The number is decorative — the label alone carries meaning — but it is the
 * page's rhythm device, so it must not be a generic bullet.
 */
export default function ChapterLabel({ locale, index, children }: Props) {
  return (
    <p className="chapter-label">
      <span className="chapter-label__index" aria-hidden="true">
        {formatNumber(index + 1, locale, { pad: 2 })}
      </span>
      <span className="chapter-label__rule" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

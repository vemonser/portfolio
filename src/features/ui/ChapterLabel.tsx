import type { ReactNode } from "react";

import { formatNumber } from "./editorial";

type Props = {
  /** Zero-based chapter position, rendered one-based. Omit on a repeat. */
  index?: number;
  children: ReactNode;
};

/**
 * The chapter opener: a two-digit index and its label, set in the label face.
 * The number is decorative — the label alone carries meaning — but it is the
 * page's rhythm device, so it must not be a generic bullet.
 *
 * A repeat of a chapter (the closing Contact block) passes no index: the same
 * chapter cannot have two numbers.
 */
export default function ChapterLabel({ index, children }: Props) {
  return (
    <p className="chapter-label">
      {typeof index === "number" ? (
        <>
          <span className="chapter-label__index" aria-hidden="true">
            {formatNumber(index + 1, { pad: 2 })}
          </span>
          <span className="chapter-label__rule" aria-hidden="true" />
        </>
      ) : null}
      <span>{children}</span>
    </p>
  );
}

import type { ReactNode } from "react";

type Props = {
  /** Hostname shown in the address bar, e.g. "anomcreative.com". */
  address: string;
  children: ReactNode;
  className?: string;
};

/**
 * A browser chrome shell. The child brings its own aspect ratio; the frame
 * clips whatever the child renders, including the parallax crop.
 *
 * The chrome is deliberately quiet: a hairline edge, a 40px bar, a small
 * address pill. The capture is the subject; the frame only says "this is a
 * site".
 */
export default function BrowserFrame({
  address,
  children,
  className,
}: Props) {
  return (
    <div
      className={`browser-frame overflow-hidden rounded-[1.1rem] border border-[var(--line-hairline)] bg-[var(--surface-raised)] shadow-[inset_0_1px_0_rgb(245_241_232_/_0.06)] ${
        className ?? ""
      }`}
    >
      <div className="flex h-10 items-center gap-[var(--space-2)] border-b border-[var(--line-hairline)] bg-[linear-gradient(180deg,rgb(245_241_232_/_0.035),transparent)] px-[var(--space-3)]">
        <span aria-hidden="true" className="flex shrink-0 gap-1.5">
          <span className="h-2 w-2 rounded-full bg-bone/20" />
          <span className="h-2 w-2 rounded-full bg-bone/20" />
          <span className="h-2 w-2 rounded-full bg-bone/20" />
        </span>
        <span
          className="browser-frame__address mx-auto max-w-[55%] truncate rounded-full bg-bone/5 px-[var(--space-2)] py-[0.22rem] font-label text-t-12 tracking-[var(--track-compact)] text-warm"
          dir="ltr"
        >
          {address}
        </span>
        <span aria-hidden="true" className="w-[3.4rem] shrink-0" />
      </div>
      <div className="relative overflow-hidden">{children}</div>
    </div>
  );
}

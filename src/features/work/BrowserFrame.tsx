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
 */
export default function BrowserFrame({
  address,
  children,
  className,
}: Props) {
  return (
    <div
      className={`browser-frame overflow-hidden rounded-[1.25rem] border border-[var(--line-strong)] bg-[var(--surface-raised)] ${
        className ?? ""
      }`}
    >
      <div className="flex h-11 items-center gap-[var(--space-2)] border-b border-[var(--line-hairline)] px-[var(--space-3)]">
        <span aria-hidden="true" className="flex shrink-0 gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-bone/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-bone/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-bone/15" />
        </span>
        <span
          className="browser-frame__address mx-auto max-w-[60%] truncate rounded-full bg-bone/5 px-[var(--space-2)] py-[0.2rem] font-label text-t-14 tracking-[var(--track)] text-warm"
          dir="ltr"
        >
          {address}
        </span>
        <span aria-hidden="true" className="w-[3.75rem] shrink-0" />
      </div>
      <div className="relative overflow-hidden">{children}</div>
    </div>
  );
}

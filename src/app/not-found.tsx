import Link from "next/link";

import PageFrame from "@/features/ui/PageFrame";
import { chapterFrame, displayTitle } from "@/features/ui/styles";

export const metadata = {
  title: { absolute: "Page not found — Abdelrhman" },
  robots: { index: false, follow: false },
};

const exits = [
  { href: "/", label: "Home" },
  { href: "/work", label: "Work" },
  { href: "/contact", label: "Contact" },
];

export default function NotFound() {
  return (
    <PageFrame
      className={`${chapterFrame} pb-[var(--inset-chapter)] pt-[clamp(8rem,26vh,16rem)]`}
    >
      <p className="ui-label m-0">Error</p>

      <h1 className={`${displayTitle} mt-[var(--space-3)]`}>404</h1>

      <p className="m-0 mt-[var(--space-3)] max-w-[42ch] text-[clamp(1.1rem,1.6vw,1.35rem)] leading-[1.7] text-bone/65">
        This page has moved, or it never existed. The work and the writing are
        both still here.
      </p>

      <ul className="m-0 mt-[var(--space-6)] flex list-none flex-wrap gap-x-[var(--space-4)] gap-y-[var(--space-2)] border-t border-[var(--line-hairline)] p-0 pt-[var(--space-3)]">
        {exits.map((exit) => (
          <li key={exit.href}>
            <Link
              href={exit.href}
              className="link-line inline-flex min-h-11 items-center text-t-16"
            >
              {exit.label}
            </Link>
          </li>
        ))}
      </ul>
    </PageFrame>
  );
}

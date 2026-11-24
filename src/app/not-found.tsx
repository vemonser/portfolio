import Link from "next/link";

import NotFoundMark from "@/features/not-found/NotFoundMark";
import PageFrame from "@/features/ui/PageFrame";
import DirectionalTransition from "@/features/transition/DirectionalTransition";
import TextReveal from "@/features/ui/TextReveal";
import { chapterFrame, displayTitle } from "@/features/ui/styles";
import PageTitle from "@/features/motion/PageTitle";

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
    <DirectionalTransition>
    <PageFrame
      className={`${chapterFrame} flex min-h-[100svh] flex-col items-center justify-center section-pad text-center`}
    >
      <p className="ui-label m-0">
        <TextReveal as="span" split="words">Error</TextReveal>
      </p>

      <NotFoundMark />

      <PageTitle>
        <TextReveal as="h1" className={`${displayTitle} mt-[var(--space-2)]`}>
          404
        </TextReveal>
      </PageTitle>

      <TextReveal
        as="p"
        className="m-0 mt-[var(--space-3)] max-w-[42ch] text-lede leading-[1.7] text-fg-muted"
      >
        This page doesn&apos;t exist. The work and the writing are both still
        here.
      </TextReveal>

      <ul className="m-0 mt-[var(--space-6)] flex list-none flex-wrap justify-center gap-x-[var(--space-4)] gap-y-[var(--space-2)] border-t border-[var(--line-hairline)] p-0 pt-[var(--space-3)]">
        {exits.map((exit) => (
          <li key={exit.href}>
            <Link
              href={exit.href}
              className="link-line inline-flex min-h-11 items-center text-t-16"
              transitionTypes={["nav-forward"]}
            >
              {exit.label}
            </Link>
          </li>
        ))}
      </ul>
    </PageFrame>
    </DirectionalTransition>
  );
}

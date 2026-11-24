import Link from "next/link";
import type { ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
  /** Renders a plain anchor with target/rel instead of a Next link. */
  external?: boolean;
  className?: string;
  ariaLabel?: string;
  /** View-transition type for in-app navigation. Defaults to nav-forward. */
  transitionType?: "nav-forward" | "nav-back";
};

/**
 * The site-wide link: text plus the signature underline. The line enters from
 * the inline start and leaves toward the inline end, fully in CSS so it
 * survives server rendering and reduced motion.
 */
export default function LinkLine({
  href,
  children,
  external = false,
  className,
  ariaLabel,
  transitionType = "nav-forward",
}: Props) {
  const classes = className ? `link-line ${className}` : "link-line";

  if (external) {
    return (
      <a
        href={href}
        className={classes}
        aria-label={ariaLabel}
        target="_blank"
        rel="noreferrer"
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className={classes}
      aria-label={ariaLabel}
      transitionTypes={[transitionType]}
    >
      {children}
    </Link>
  );
}

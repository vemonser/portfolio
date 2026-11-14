import type { ReactNode } from "react";

import { toLocale, type Locale } from "./editorial";

type Props = {
  locale: Locale;
  children: ReactNode;
  className?: string;
};

/**
 * Reading measure for MDX and argument copy. It wraps the content in an
 * <article> and styles elements that MDX emits — it never rewrites them, so
 * headings, links and lists keep their semantics.
 *
 * The measure is a locale token: English reads wide, Arabic reads narrower and
 * taller. Both come from `--measure-body` and `--leading-arabic`, so the
 * stylesheet and the typescript share one decision.
 */
export default function Prose({ locale, children, className }: Props) {
  const classes = className ? `prose-blog prose-editorial ${className}` : "prose-blog prose-editorial";

  return (
    <article data-locale={toLocale(locale)} className={classes}>
      {children}
    </article>
  );
}

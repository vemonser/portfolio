import type { ReactNode } from "react";

import { toLocale, type Locale } from "./editorial";

type Props = {
  locale: Locale;
  children: ReactNode;
  className?: string;
};

/**
 * Every route's single <main>. It does not set lang/dir — those belong to the
 * document — it only exposes the locale so CSS composition variants and tests
 * can address the page without guessing from text direction.
 *
 * `data-locale` is deliberately the locale, not `dir`: Arabic pages are RTL but
 * the composition decisions are per language, and an English RTL page (if one
 * ever exists) must still get the English composition.
 */
export default function PageFrame({ locale, children, className }: Props) {
  const classes = className
    ? `page-frame ${className}`
    : "page-frame";

  return (
    <main data-locale={toLocale(locale)} className={classes}>
      {children}
    </main>
  );
}

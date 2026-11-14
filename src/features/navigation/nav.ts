export type NavKey = "home" | "work" | "blog" | "about" | "contact";

export type NavLink = {
  key: NavKey;
  /** Locale-prefixed path, ready for `next/link`. */
  href: string;
  label: string;
};

/** Order of the modal menu. The header reuses the last three. */
const ROUTES: ReadonlyArray<{ key: NavKey; path: string }> = [
  { key: "home", path: "/" },
  { key: "work", path: "/work" },
  { key: "blog", path: "/blog" },
  { key: "about", path: "/about" },
  { key: "contact", path: "/contact" },
];

/**
 * `localePrefix: "always"` means every path carries its locale. The home path
 * carries nothing after the locale, so it stays `/{locale}` rather than
 * `/{locale}/`.
 */
export function localizedHref(locale: string, path: string): string {
  return path === "/" ? `/${locale}` : `/${locale}${path}`;
}

export function buildNavLinks(
  locale: string,
  labels: Record<NavKey, string>,
): NavLink[] {
  return ROUTES.map(({ key, path }) => ({
    key,
    href: localizedHref(locale, path),
    label: labels[key],
  }));
}

/** The destinations the header shows inline; home is the brand instead. */
export function buildHeaderLinks(links: NavLink[]): NavLink[] {
  return links.filter((link) => link.key !== "home");
}

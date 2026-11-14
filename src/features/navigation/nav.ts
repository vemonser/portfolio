export type NavKey = "home" | "work" | "blog" | "about" | "contact";

export type NavLink = {
  key: NavKey;
  /** Root path, ready for `next/link`. */
  href: string;
  label: string;
};

/** Order of the modal menu. The header reuses the last four. */
const ROUTES: ReadonlyArray<{ key: NavKey; path: string }> = [
  { key: "home", path: "/" },
  { key: "work", path: "/work" },
  { key: "blog", path: "/blog" },
  { key: "about", path: "/about" },
  { key: "contact", path: "/contact" },
];

export function buildNavLinks(labels: Record<NavKey, string>): NavLink[] {
  return ROUTES.map(({ key, path }) => ({ key, href: path, label: labels[key] }));
}

/** The destinations the header shows inline; home is the brand instead. */
export function buildHeaderLinks(links: NavLink[]): NavLink[] {
  return links.filter((link) => link.key !== "home");
}

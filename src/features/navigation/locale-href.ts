/**
 * The site uses `localePrefix: "always"`, so a locale is always the first path
 * segment. Switching language means swapping that segment and keeping the rest.
 * A pathname that does not start with a known locale is treated as already
 * unprefixed.
 */
export function switchLocalePath(
  pathname: string,
  targetLocale: string,
  locales: readonly string[],
): string {
  const segments = pathname.split("/").filter(Boolean);
  const hasLocale = segments.length > 0 && locales.includes(segments[0]);
  const rest = hasLocale ? segments.slice(1) : segments;

  return rest.length === 0
    ? `/${targetLocale}`
    : `/${targetLocale}/${rest.join("/")}`;
}

/** `/ar/work/` and `/ar/work` are the same destination. */
export function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

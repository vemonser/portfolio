/**
 * Blog dates are displayed in the reader's language; the stored value stays
 * ISO so sorting never depends on presentation.
 */
export function formatPostDate(date: string, locale: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);

  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

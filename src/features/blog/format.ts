/**
 * Blog dates are displayed for an English reader; the stored value stays ISO
 * so sorting never depends on presentation.
 */
export function formatPostDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00Z`);

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(parsed);
}

/**
 * The canonical origin, in one place. Set NEXT_PUBLIC_SITE_URL in production;
 * on Vercel the project's production domain is used as a fallback so preview
 * deployments still emit absolute URLs. Localhost is the last resort.
 */
export const siteName = "Abdelrhman";

function normalize(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return normalize(explicit);

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return normalize(vercel);

  return "http://localhost:3000";
}

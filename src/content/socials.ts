/**
 * Social destinations.
 *
 * A `href` is either a real profile URL or an empty string. Empty renders the
 * label as plain text: the row is always visible, but the site never ships a
 * dead `#` link. Fill a URL and that entry becomes a real external link with
 * the same semantics as every other link on the site.
 */
export type SocialKey = "instagram" | "twitter" | "linkedin";

export type Social = {
  key: SocialKey;
  label: string;
  href: string;
};

export const socials: Social[] = [
  { key: "instagram", label: "Instagram", href: "" },
  { key: "twitter", label: "Twitter", href: "" },
  { key: "linkedin", label: "LinkedIn", href: "" },
];

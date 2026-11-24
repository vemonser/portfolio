/**
 * Social destinations.
 *
 * A `href` is either a real profile URL or an empty string. Empty entries are
 * filtered out before rendering, so the footer and the menu never show a dead
 * profile name and never ship a `#` link. Fill a URL and it appears.
 */
export type SocialKey =
  | "github"
  | "x"
  | "linkedin"
  | "instagram"
  | "whatsapp";

export type Social = {
  key: SocialKey;
  label: string;
  href: string;
};

export const socials: Social[] = [
  { key: "github", label: "GitHub", href: "https://github.com/vemonser/" },
  { key: "x", label: "X", href: "" },
  { key: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/in/abdelrhman-samy-366260201/" },
  { key: "instagram", label: "Instagram", href: "" },
  { key: "whatsapp", label: "WhatsApp", href: "" },
];

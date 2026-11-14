import LinkLine from "@/features/ui/LinkLine";
import type { NavLink } from "@/features/navigation/nav";

import LocalTime from "./LocalTime";

type Props = {
  labels: {
    navigation: string;
    socials: string;
    edition: string;
    localTime: string;
    instagram: string;
    twitter: string;
    linkedin: string;
  };
  links: NavLink[];
  socials: Array<{ key: "instagram" | "twitter" | "linkedin"; href: string }>;
};

/** The dennissnellenberg bottom bar: navigation, socials, edition and clock. */
export default function SiteFooter({ labels, links, socials }: Props) {
  return (
    <footer className="border-t border-bone/10 px-[var(--nav-inset)] pb-[max(3rem,var(--nav-inset))] pt-20">
      <div className="grid grid-cols-2 items-start gap-x-8 gap-y-10 lg:grid-cols-[1fr_1fr_auto]">
        <nav aria-label={labels.navigation}>
          <p className="ui-label">{labels.navigation}</p>
          <ul className="m-0 mt-4 flex list-none flex-col items-start gap-[0.55rem] p-0">
            {links.map((link) => (
              <li key={link.key}>
                <LinkLine href={link.href} className="text-t-16 ar:text-t-20">
                  {link.label}
                </LinkLine>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={labels.socials}>
          <p className="ui-label">{labels.socials}</p>
          <ul className="m-0 mt-4 flex list-none flex-col items-start gap-[0.55rem] p-0">
            {socials.map((social) => (
              <li key={social.key}>
                <LinkLine
                  href={social.href}
                  external={social.href !== "#"}
                  className="text-t-16 ar:text-t-20"
                >
                  {labels[social.key]}
                </LinkLine>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-[0.55rem] lg:items-end lg:text-end">
          <p className="ui-label">{labels.edition}</p>
          <p data-clock className="ui-label inline-flex gap-[0.4em] whitespace-nowrap">
            {labels.localTime} <LocalTime />
          </p>
        </div>
      </div>
    </footer>
  );
}

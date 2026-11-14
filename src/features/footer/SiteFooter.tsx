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
    <footer className="site-footer">
      <div className="site-footer__inner">
        <nav aria-label={labels.navigation} className="site-footer__col">
          <p className="ui-label">{labels.navigation}</p>
          <ul className="site-footer__list">
            {links.map((link) => (
              <li key={link.key}>
                <LinkLine href={link.href}>{link.label}</LinkLine>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={labels.socials} className="site-footer__col">
          <p className="ui-label">{labels.socials}</p>
          <ul className="site-footer__list">
            {socials.map((social) => (
              <li key={social.key}>
                <LinkLine
                  href={social.href}
                  external={social.href !== "#"}
                >
                  {labels[social.key]}
                </LinkLine>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-footer__meta">
          <p className="ui-label">{labels.edition}</p>
          <p className="ui-label site-footer__time">
            {labels.localTime} <LocalTime />
          </p>
        </div>
      </div>
    </footer>
  );
}

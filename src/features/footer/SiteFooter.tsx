import type { Social } from "@/content/socials";
import LinkLine from "@/features/ui/LinkLine";
import type { NavLink } from "@/features/navigation/nav";

import LocalTime from "./LocalTime";

type Props = {
  labels: {
    navigation: string;
    socials: string;
    edition: string;
    localTime: string;
  };
  links: NavLink[];
  socials: Social[];
  wordmark: string;
};

/**
 * The closing bar. Three fixed columns: navigation, socials, and the edition /
 * local-time stamp. The socials column exists even before a profile is added,
 * so the grid never changes shape when real URLs arrive; an empty column shows
 * an honest dash instead of a dead link. The name signs off at full width.
 *
 * Every link row is at least 44px tall; the links are inline-flex so the target
 * is the whole box, not just the text.
 */
export default function SiteFooter({
  labels,
  links,
  socials,
  wordmark,
}: Props) {
  return (
    <footer className="footer page-shell border-t border-[var(--line-hairline)] pb-[var(--space-4)] pt-[var(--space-5)]">
      <div className="grid gap-[var(--space-4)] md:grid-cols-3 md:items-start md:gap-[var(--space-6)]">
        <nav aria-label={labels.navigation} className="min-w-0">
          <p className="ui-label m-0">{labels.navigation}</p>

          <ul className="m-0 mt-[var(--space-2)] -ms-2 flex list-none flex-wrap gap-x-[var(--space-2)] gap-y-0 p-0">
            {links.map((link) => (
              <li key={link.key} className="flex">
                <LinkLine
                  href={link.href}
                  className="site-footer__link inline-flex min-h-11 items-center text-t-16"
                >
                  {link.label}
                </LinkLine>
              </li>
            ))}
          </ul>
        </nav>

        {socials.length > 0 ? (
          <nav aria-label={labels.socials} className="min-w-0">
            <p className="ui-label m-0">{labels.socials}</p>

            <ul className="m-0 mt-[var(--space-2)] -ms-2 flex list-none flex-wrap gap-x-[var(--space-2)] gap-y-0 p-0">
              {socials.map((social) => (
                <li key={social.key} className="flex">
                  <LinkLine
                    href={social.href}
                    external
                    className="site-footer__link inline-flex min-h-11 items-center text-t-16"
                  >
                    {social.label}
                  </LinkLine>
                </li>
              ))}
            </ul>
          </nav>
        ) : (
          <div className="min-w-0">
            <p className="ui-label m-0">{labels.socials}</p>
            <p className="m-0 mt-[var(--space-2)] flex min-h-11 items-center text-small text-warm">
              —
            </p>
          </div>
        )}

        <div className="flex flex-col gap-[var(--space-1)] md:items-end md:text-end">
          <p className="ui-label m-0">{labels.edition}</p>
          <p
            data-clock
            className="ui-label m-0 inline-flex gap-[var(--space-1)] whitespace-nowrap"
          >
            {labels.localTime} <LocalTime />
          </p>
        </div>
      </div>

      <p className="footer-wordmark m-0 mt-[var(--space-6)] border-t border-[var(--line-hairline)] pt-[var(--space-3)]">
        {wordmark}
      </p>
    </footer>
  );
}

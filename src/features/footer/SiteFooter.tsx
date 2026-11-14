import LinkLine from "@/features/ui/LinkLine";
import type { NavLink } from "@/features/navigation/nav";

import LocalTime from "./LocalTime";

type Props = {
  labels: {
    navigation: string;
    edition: string;
    localTime: string;
  };
  links: NavLink[];
};

/**
 * The closing bar. It keeps the site's one navigation grammar — mono labels,
 * hairline rules, the same routes in the same order — and drops the social row
 * rather than shipping dead `#` links: a real destination or nothing.
 *
 * Every row here is at least 44px tall; the links are inline-flex so the
 * target is the whole box, not just the text.
 */
export default function SiteFooter({ labels, links }: Props) {
  return (
    <footer className="border-t border-[var(--line-hairline)] px-[var(--inset-edge)] pb-[max(var(--space-5),var(--inset-edge))] pt-[var(--space-6)]">
      <div className="flex flex-wrap items-end justify-between gap-[var(--space-6)]">
        <nav aria-label={labels.navigation} className="min-w-0">
          <p className="ui-label m-0">{labels.navigation}</p>

          <ul className="m-0 mt-[var(--space-2)] flex list-none flex-wrap gap-x-[var(--space-4)] gap-y-0 p-0">
            {links.map((link) => (
              <li key={link.key} className="flex">
                <LinkLine
                  href={link.href}
                  className="inline-flex min-h-11 items-center text-t-16"
                >
                  {link.label}
                </LinkLine>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-col gap-[0.35rem] md:items-end md:text-end">
          <p className="ui-label m-0">{labels.edition}</p>
          <p
            data-clock
            className="ui-label m-0 inline-flex gap-[0.4em] whitespace-nowrap"
          >
            {labels.localTime} <LocalTime />
          </p>
        </div>
      </div>
    </footer>
  );
}

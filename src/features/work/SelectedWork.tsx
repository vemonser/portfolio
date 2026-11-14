import { getTranslations } from "next-intl/server";

import { getProjects } from "@/content/projects";
import { localizedHref } from "@/features/navigation/nav";
import { formatNumber, toLocale } from "@/features/ui/editorial";
import LinkLine from "@/features/ui/LinkLine";
import ProjectIndex from "@/features/ui/ProjectIndex";
import Reveal from "@/features/ui/Reveal";
import { displayTitle } from "@/features/ui/styles";

type Props = {
  locale: string;
};

const HOME_COUNT = 6;

/**
 * The work chapter of Home: a display heading over an asymmetric sequence,
 * then one quiet route into the archive. The sequence lives in ProjectIndex so
 * the archive can share the card without sharing the rhythm.
 */
export default async function SelectedWork({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "workSection" });
  const projects = getProjects(locale).slice(0, HOME_COUNT);
  const typed = toLocale(locale);

  return (
    <section
      aria-labelledby="selected-work-title"
      data-section="selected-work"
      className="px-[var(--inset-edge)] pb-[var(--inset-chapter)] pt-[var(--inset-chapter)]"
    >
      <Reveal className="flex flex-wrap items-end justify-between gap-[var(--space-3)] border-t border-[var(--line-hairline)] pt-[var(--space-2)]">
        <h2 id="selected-work-title" className={displayTitle}>
          {t("label")}
        </h2>
        <p className="m-0 font-label text-t-14 uppercase tracking-[var(--track)] text-warm ar:text-t-16 ar:normal-case ar:tracking-normal">
          {formatNumber(1, typed, { pad: 2 })} —{" "}
          {formatNumber(projects.length, typed, { pad: 2 })}
        </p>
      </Reveal>

      <div className="mt-[var(--space-7)]">
        <ProjectIndex locale={typed} projects={projects} variant="home" />
      </div>

      <Reveal
        delay={60}
        className="mt-[var(--space-7)] flex justify-end border-t border-[var(--line-hairline)] pt-[var(--space-4)]"
      >
        <LinkLine
          href={localizedHref(locale, "/work")}
          className="inline-flex min-h-11 items-center text-[clamp(1.05rem,1.6vw,1.3rem)]"
        >
          {t("more")}
        </LinkLine>
      </Reveal>
    </section>
  );
}

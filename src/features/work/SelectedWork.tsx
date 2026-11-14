import { copy } from "@/content/copy";
import { getProjects } from "@/content/projects";
import { formatNumber } from "@/features/ui/editorial";
import LinkLine from "@/features/ui/LinkLine";
import ProjectIndex from "@/features/ui/ProjectIndex";
import Reveal from "@/features/ui/Reveal";
import { displayTitle } from "@/features/ui/styles";

const HOME_COUNT = 6;

/**
 * The work chapter of Home: a display heading over an asymmetric sequence,
 * then one quiet route into the archive. The sequence lives in ProjectIndex so
 * the archive can share the card without sharing the rhythm.
 */
export default function SelectedWork() {
  const projects = getProjects().slice(0, HOME_COUNT);

  return (
    <section
      aria-labelledby="selected-work-title"
      data-section="selected-work"
      className="px-[var(--inset-edge)] pb-[var(--inset-chapter)] pt-[var(--inset-chapter)]"
    >
      <Reveal className="flex flex-wrap items-end justify-between gap-[var(--space-3)] border-t border-[var(--line-hairline)] pt-[var(--space-2)]">
        <h2 id="selected-work-title" className={displayTitle}>
          {copy.workSection.label}
        </h2>
        <p className="m-0 font-label text-t-14 uppercase tracking-[var(--track)] text-warm">
          {formatNumber(1, { pad: 2 })} —{" "}
          {formatNumber(projects.length, { pad: 2 })}
        </p>
      </Reveal>

      <div className="mt-[var(--space-7)]">
        <ProjectIndex projects={projects} variant="home" />
      </div>

      <Reveal
        delay={60}
        className="mt-[var(--space-7)] flex justify-end border-t border-[var(--line-hairline)] pt-[var(--space-4)]"
      >
        <LinkLine
          href="/work"
          className="inline-flex min-h-11 items-center text-[clamp(1.05rem,1.6vw,1.3rem)]"
        >
          {copy.workSection.more}
        </LinkLine>
      </Reveal>
    </section>
  );
}

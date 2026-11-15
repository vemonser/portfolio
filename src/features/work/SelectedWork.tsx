import { copy } from "@/content/copy";
import { getProjects } from "@/content/projects";
import ChapterLabel from "@/features/ui/ChapterLabel";
import { HOME_COUNT } from "@/features/ui/home-layout";
import LinkLine from "@/features/ui/LinkLine";
import ProjectIndex from "@/features/ui/ProjectIndex";
import Reveal from "@/features/ui/Reveal";
import { displayTitle } from "@/features/ui/styles";

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
      <Reveal className="border-t border-[var(--line-hairline)] pt-[var(--space-2)]">
        <ChapterLabel index={1}>{copy.nav.work}</ChapterLabel>

        <div className="mt-[var(--space-4)]">
          <h2 id="selected-work-title" className={displayTitle}>
            {copy.workSection.label}
          </h2>
        </div>
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
          className="inline-flex min-h-11 items-center gap-2 text-lede"
        >
          {copy.workSection.more}
          <span aria-hidden="true">↗</span>
        </LinkLine>
      </Reveal>
    </section>
  );
}

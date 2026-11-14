import { copy } from "@/content/copy";
import { getProjects } from "@/content/projects";
import ChapterLabel from "@/features/ui/ChapterLabel";
import PageFrame from "@/features/ui/PageFrame";
import ProjectIndex from "@/features/ui/ProjectIndex";
import Reveal from "@/features/ui/Reveal";
import { bodyMeasure, chapterFrame, displayTitle } from "@/features/ui/styles";

export const metadata = {
  title: copy.workPage.title,
  description: copy.workPage.lede,
};

export default function WorkPage() {
  const projects = getProjects();

  return (
    <PageFrame
      className={`${chapterFrame} pb-[var(--inset-chapter)] pt-[clamp(8rem,22vh,14rem)]`}
    >
      <Reveal className="chapter-open">
        <ChapterLabel index={1}>{copy.workPage.label}</ChapterLabel>

        <h1 className={`${displayTitle} mt-[var(--space-3)]`}>
          {copy.workPage.title}
        </h1>

        <p
          className={`${bodyMeasure} mt-[var(--space-3)] text-[clamp(1.05rem,1.5vw,1.3rem)]`}
        >
          {copy.workPage.lede}
        </p>
      </Reveal>

      <div className="mt-[var(--space-8)]">
        <ProjectIndex projects={projects} variant="archive" />
      </div>
    </PageFrame>
  );
}

import { getTranslations } from "next-intl/server";

import ChapterLabel from "@/features/ui/ChapterLabel";
import { toLocale } from "@/features/ui/editorial";
import Reveal from "@/features/ui/Reveal";

type Props = {
  locale: string;
};

/**
 * The first chapter after the Hero: one statement, one supporting argument and
 * one quiet metadata line. The English spread puts the argument in a narrow
 * right-hand column; Arabic hangs it under an indented statement, because a
 * narrower measure is what its script wants, not a mirrored column.
 */
export default async function IntroSection({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "intro" });
  const hero = await getTranslations({ locale, namespace: "hero" });
  const typed = toLocale(locale);
  const arabic = typed === "ar";

  return (
    <section
      aria-labelledby="intro-title"
      data-section="intro"
      className="px-[var(--inset-edge)] pb-[var(--inset-chapter)] pt-[var(--inset-chapter-lg)]"
    >
      <Reveal className="border-t border-[var(--line-hairline)] pt-[var(--space-2)]">
        <ChapterLabel locale={typed} index={0}>
          {t("label")}
        </ChapterLabel>
      </Reveal>

      <div className="mt-[var(--space-6)] grid items-start gap-[var(--space-5)] lg:grid-cols-12 lg:gap-x-[var(--space-5)]">
        <Reveal className={arabic ? "lg:col-span-11" : "lg:col-span-8"}>
          <h2
            id="intro-title"
            className={`m-0 font-display text-[clamp(1.9rem,4.2vw,4rem)] font-medium leading-[1.1] tracking-[-0.03em] ${
              arabic
                ? "max-w-[26ch] leading-[1.5] tracking-normal"
                : "max-w-[22ch]"
            }`}
          >
            {t("statement")}
          </h2>
        </Reveal>

        <Reveal
          delay={120}
          className={
            arabic
              ? "lg:col-span-8 lg:col-start-3 lg:mt-[var(--space-6)]"
              : "lg:col-span-4 lg:col-start-9 lg:mt-[var(--space-5)]"
          }
        >
          <p className="m-0 max-w-[34ch] text-[clamp(1.05rem,1.5vw,1.3rem)] leading-[1.75] text-bone/65 ar:max-w-[30ch] ar:leading-[1.9]">
            {t("body")}
          </p>
        </Reveal>
      </div>

      <Reveal
        delay={180}
        className="mt-[var(--space-6)] flex flex-wrap items-center gap-x-[var(--space-3)] gap-y-[var(--space-1)] border-t border-[var(--line-hairline)] pt-[var(--space-2)] font-label text-t-14 uppercase tracking-[var(--track)] text-warm ar:text-t-16 ar:normal-case ar:tracking-normal"
      >
        <span>{hero("location")}</span>
        <span aria-hidden="true" className="text-bone/25">
          ·
        </span>
        <span className="inline-flex items-center gap-[0.45rem] text-bone/70">
          <span
            className="h-[6px] w-[6px] rounded-full bg-lime"
            aria-hidden="true"
          />
          {hero("available")}
        </span>
      </Reveal>
    </section>
  );
}

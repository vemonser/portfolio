import { getTranslations, setRequestLocale } from "next-intl/server";

import ChapterLabel from "@/features/ui/ChapterLabel";
import PageFrame from "@/features/ui/PageFrame";
import Reveal from "@/features/ui/Reveal";
import SkillMatrix from "@/features/ui/SkillMatrix";
import { toLocale } from "@/features/ui/editorial";
import { chapterFrame, displayTitle } from "@/features/ui/styles";

type Props = {
  params: Promise<{ locale: string }>;
};

type ServiceCopy = { title: string; body: string };

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });

  return { title: t("title"), description: t("lede") };
}

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "about" });
  const paragraphs = t.raw("paragraphs") as string[];
  const services = t.raw("services") as ServiceCopy[];
  const typed = toLocale(locale);
  const arabic = typed === "ar";

  return (
    <PageFrame
      locale={typed}
      className={`${chapterFrame} pb-[var(--inset-chapter)] pt-[clamp(8rem,22vh,14rem)]`}
    >
      <Reveal className="chapter-open">
        <ChapterLabel locale={typed} index={3}>
          {t("label")}
        </ChapterLabel>

        <h1 className={`${displayTitle} mt-[var(--space-3)]`}>{t("title")}</h1>

        <p className="m-0 mt-[var(--space-3)] max-w-[26ch] font-display text-[clamp(1.6rem,3.6vw,3.2rem)] font-medium leading-[1.12] tracking-[-0.03em] text-bone/85 ar:max-w-[24ch] ar:leading-[1.5] ar:tracking-normal">
          {t("lede")}
        </p>
      </Reveal>

      <div className="mt-[var(--space-8)] grid items-start gap-[var(--space-6)] lg:grid-cols-12">
        <Reveal
          className={
            arabic
              ? "lg:col-span-8 lg:col-start-5"
              : "lg:col-span-7 lg:col-start-1"
          }
        >
          <div className="flex flex-col gap-[var(--space-3)]">
            {paragraphs.map((paragraph, index) => (
              <p
                key={paragraph}
                className={
                  index === 0
                    ? "m-0 max-w-[46ch] text-[clamp(1.15rem,1.8vw,1.45rem)] leading-[1.65] text-bone/80 ar:max-w-[40ch] ar:leading-[1.95]"
                    : "m-0 max-w-[48ch] text-[clamp(1rem,1.3vw,1.15rem)] leading-[1.8] text-bone/60 ar:max-w-[42ch] ar:leading-[2]"
                }
              >
                {paragraph}
              </p>
            ))}
          </div>
        </Reveal>

        {/*
          Not a portrait placeholder: a typographic mark built from the initial
          the owner already supplies, set in the forest surface. It gives the
          manifesto a second column without pretending to be a photograph.
        */}
        <Reveal
          delay={120}
          className={
            arabic
              ? "lg:col-span-4 lg:col-start-1 lg:row-start-1"
              : "lg:col-span-4 lg:col-start-9"
          }
        >
          <div className="relative aspect-[3/4] overflow-hidden bg-forest">
            <span
              aria-hidden="true"
              className="absolute inset-0 grid place-items-center font-display text-[clamp(9rem,20vw,16rem)] font-semibold leading-none text-bone/10"
            >
              {t("initial")}
            </span>
            <span className="absolute font-label text-t-14 uppercase tracking-[var(--track)] text-bone/60 ar:text-t-16 ar:normal-case ar:tracking-normal [inset-block-end:var(--space-3)] [inset-inline-start:var(--space-3)]">
              {t("title")}
            </span>
          </div>
        </Reveal>
      </div>

      <div className="mt-[var(--space-8)]">
        <SkillMatrix locale={typed} groups={services} label={t("servicesLabel")} />
      </div>
    </PageFrame>
  );
}

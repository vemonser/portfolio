import { getTranslations } from "next-intl/server";

import Reveal from "@/features/ui/Reveal";

type Props = {
  locale: string;
};

/**
 * dennissnellenberg's intro section, cut down to the statement and its
 * support paragraph — no "About me" button, as agreed.
 */
export default async function IntroSection({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "intro" });

  return (
    <section
      aria-labelledby="intro-title"
      className="px-[var(--nav-inset)] pb-[clamp(6rem,13vh,10rem)] pt-[clamp(7rem,18vh,13rem)]"
    >
      <Reveal className="mb-[clamp(2rem,5vw,3.75rem)]">
        <p className="ui-label">{t("label")}</p>
      </Reveal>

      <div className="grid items-start gap-[clamp(2.5rem,5vw,4rem)] lg:grid-cols-[minmax(0,1fr)_minmax(15rem,23rem)] lg:gap-x-[clamp(2rem,6vw,7rem)]">
        <Reveal>
          <h2
            id="intro-title"
            className="m-0 max-w-[24ch] font-display text-[clamp(1.7rem,3.6vw,3.4rem)] font-medium leading-[1.14] tracking-[-0.03em] ar:max-w-[30ch] ar:leading-[1.55] ar:tracking-normal"
          >
            {t("statement")}
          </h2>
        </Reveal>
        <Reveal
          delay={100}
          className="max-w-[34ch] text-t-20 leading-[1.7] text-bone/60 ar:leading-[1.9]"
        >
          <p className="m-0">{t("body")}</p>
        </Reveal>
      </div>
    </section>
  );
}

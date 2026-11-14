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
    <section aria-labelledby="intro-title" className="intro">
      <Reveal className="intro__label">
        <p className="ui-label">{t("label")}</p>
      </Reveal>

      <div className="intro__grid">
        <Reveal>
          <h2 id="intro-title" className="intro__statement">
            {t("statement")}
          </h2>
        </Reveal>
        <Reveal delay={100} className="intro__body">
          <p>{t("body")}</p>
        </Reveal>
      </div>
    </section>
  );
}

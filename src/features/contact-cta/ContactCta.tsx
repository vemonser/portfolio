import { getTranslations } from "next-intl/server";

import { localizedHref } from "@/features/navigation/nav";
import ChapterLabel from "@/features/ui/ChapterLabel";
import LinkLine from "@/features/ui/LinkLine";
import Reveal from "@/features/ui/Reveal";
import RoundButton from "@/features/ui/RoundButton";
import { toLocale } from "@/features/ui/editorial";

type Props = {
  locale: string;
};

/**
 * The closing chapter, present on every route. It is composed like the rest of
 * the site — a label, a display sentence, then the two real ways to reach the
 * owner — rather than a floating pill above the footer.
 */
export default async function ContactCta({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "cta" });
  const typed = toLocale(locale);

  return (
    <section
      aria-labelledby="cta-title"
      data-section="contact-cta"
      className="border-t border-[var(--line-hairline)] px-[var(--inset-edge)] pb-[calc(var(--inset-chapter)+2rem)] pt-[var(--inset-chapter)]"
    >
      <Reveal>
        <ChapterLabel locale={typed} index={5}>
          {t("label")}
        </ChapterLabel>

        <h2
          id="cta-title"
          className="m-0 mt-[var(--space-3)] max-w-[18ch] font-display text-[clamp(2.4rem,6.4vw,6rem)] font-semibold leading-[0.98] tracking-[-0.035em] ar:max-w-[16ch] ar:leading-[1.25] ar:tracking-normal"
        >
          {t("title")}
        </h2>
      </Reveal>

      <div className="mt-[var(--space-6)] grid items-end gap-[var(--space-6)] md:grid-cols-[minmax(0,1fr)_auto]">
        <Reveal delay={80}>
          <dl className="m-0 flex flex-col gap-[var(--space-3)]">
            <div className="flex flex-col gap-[0.35rem] border-t border-[var(--line-hairline)] pt-[var(--space-2)]">
              <dt className="ui-label">{t("emailLabel")}</dt>
              <dd className="m-0 break-words text-[clamp(1.15rem,2vw,1.6rem)] [overflow-wrap:anywhere]">
                <LinkLine
                  href={`mailto:${t("email")}`}
                  className="inline-flex min-h-11 items-center"
                >
                  {t("email")}
                </LinkLine>
              </dd>
            </div>

            <div className="flex flex-col gap-[0.35rem] border-t border-[var(--line-hairline)] pt-[var(--space-2)]">
              <dt className="ui-label">{t("phoneLabel")}</dt>
              <dd
                className="m-0 text-[clamp(1.15rem,2vw,1.6rem)]"
                dir="ltr"
              >
                <LinkLine
                  href={t("phoneHref")}
                  className="inline-flex min-h-11 items-center"
                >
                  {t("phone")}
                </LinkLine>
              </dd>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={140} className="justify-self-start md:justify-self-end">
          <RoundButton
            href={localizedHref(locale, "/contact")}
            label={t("button")}
          />
        </Reveal>
      </div>
    </section>
  );
}

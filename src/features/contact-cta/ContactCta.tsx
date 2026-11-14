import { getTranslations } from "next-intl/server";

import { localizedHref } from "@/features/navigation/nav";
import LinkLine from "@/features/ui/LinkLine";
import Reveal from "@/features/ui/Reveal";
import RoundButton from "@/features/ui/RoundButton";

type Props = {
  locale: string;
};

/**
 * dennissnellenberg's closing section, sized for this site: the statement and
 * the two ways to reach out, in one block above the footer. It lives in the
 * layout, so every page ends the same way.
 */
export default async function ContactCta({ locale }: Props) {
  const t = await getTranslations({ locale, namespace: "cta" });

  return (
    <section
      aria-labelledby="cta-title"
      data-section="contact-cta"
      className="border-t border-bone/10 px-[var(--nav-inset)] py-[clamp(8rem,18vh,14rem)]"
    >
      <div className="grid items-end gap-[clamp(2.5rem,6vw,5rem)] md:grid-cols-[minmax(0,1fr)_auto]">
        <Reveal className="flex max-w-[60rem] flex-col gap-6">
          <p className="ui-label">{t("label")}</p>
          <h2
            id="cta-title"
            className="m-0 font-display text-[clamp(2.4rem,6.6vw,6.5rem)] font-semibold leading-[0.98] tracking-[-0.035em] ar:leading-[1.25] ar:tracking-normal"
          >
            {t("title")}
          </h2>

          <dl className="mt-3 flex flex-col gap-[0.85rem]">
            <div className="m-0 flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <dt className="ui-label">{t("emailLabel")}</dt>
              <dd className="m-0 text-[clamp(1.05rem,1.5vw,1.3rem)]">
                <LinkLine href={`mailto:${t("email")}`}>{t("email")}</LinkLine>
              </dd>
            </div>
            <div className="m-0 flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <dt className="ui-label">{t("phoneLabel")}</dt>
              <dd className="m-0 text-[clamp(1.05rem,1.5vw,1.3rem)]" dir="ltr">
                <LinkLine href={t("phoneHref")}>{t("phone")}</LinkLine>
              </dd>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={120} className="justify-self-start md:justify-self-end">
          <RoundButton
            href={localizedHref(locale, "/contact")}
            label={t("button")}
          />
        </Reveal>
      </div>
    </section>
  );
}

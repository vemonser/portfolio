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
    <section aria-labelledby="cta-title" className="contact-cta">
      <div className="contact-cta__grid">
        <Reveal className="contact-cta__lead">
          <p className="ui-label">{t("label")}</p>
          <h2 id="cta-title" className="contact-cta__title">
            {t("title")}
          </h2>

          <dl className="contact-cta__details">
            <div className="contact-cta__row">
              <dt className="ui-label">{t("emailLabel")}</dt>
              <dd>
                <LinkLine href={`mailto:${t("email")}`}>{t("email")}</LinkLine>
              </dd>
            </div>
            <div className="contact-cta__row">
              <dt className="ui-label">{t("phoneLabel")}</dt>
              <dd dir="ltr">
                <LinkLine href={t("phoneHref")}>{t("phone")}</LinkLine>
              </dd>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={120} className="contact-cta__action">
          <RoundButton
            href={localizedHref(locale, "/contact")}
            label={t("button")}
          />
        </Reveal>
      </div>
    </section>
  );
}

import { getTranslations, setRequestLocale } from "next-intl/server";

import ContactForm from "@/features/contact/ContactForm";
import LinkLine from "@/features/ui/LinkLine";
import Reveal from "@/features/ui/Reveal";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });

  return { title: t("title"), description: t("lede") };
}

export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "contact" });
  const email = t("email");

  return (
    <main className="contact-page">
      <Reveal className="page-intro">
        <p className="ui-label">{t("label")}</p>
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-lede">{t("lede")}</p>
      </Reveal>

      <div className="contact-grid">
        <Reveal className="contact-details">
          <p className="ui-label">{t("detailsLabel")}</p>
          <dl className="contact-details__list">
            <div className="contact-details__row">
              <dt className="ui-label">{t("emailLabel")}</dt>
              <dd>
                <LinkLine href={`mailto:${email}`}>{email}</LinkLine>
              </dd>
            </div>
            <div className="contact-details__row">
              <dt className="ui-label">{t("phoneLabel")}</dt>
              <dd dir="ltr">
                <LinkLine href={t("phoneHref")}>{t("phone")}</LinkLine>
              </dd>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={100} className="contact-form-wrap">
          <ContactForm
            to={email}
            labels={{
              name: t("form.name"),
              email: t("form.email"),
              message: t("form.message"),
              send: t("form.send"),
              hint: t("form.hint"),
              subjectPrefix: t("form.subjectPrefix"),
            }}
          />
        </Reveal>
      </div>
    </main>
  );
}

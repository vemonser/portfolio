import { getTranslations, setRequestLocale } from "next-intl/server";

import ContactForm from "@/features/contact/ContactForm";
import LinkLine from "@/features/ui/LinkLine";
import Reveal from "@/features/ui/Reveal";
import { pageLede, pageShell, pageTitle } from "@/features/ui/styles";

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
    <main className={`${pageShell} pb-[clamp(4rem,9vh,7rem)]`}>
      <Reveal className="max-w-[60rem]">
        <p className="ui-label">{t("label")}</p>
        <h1 className={pageTitle}>{t("title")}</h1>
        <p className={pageLede}>{t("lede")}</p>
      </Reveal>

      <div className="mt-[clamp(3.5rem,8vw,6rem)] grid items-start gap-12 lg:grid-cols-[minmax(14rem,20rem)_minmax(0,1fr)] lg:gap-x-[clamp(2rem,6vw,6rem)]">
        <Reveal>
          <p className="ui-label">{t("detailsLabel")}</p>
          <dl className="m-0 mt-5 flex flex-col gap-[1.35rem]">
            <div className="m-0 flex flex-col gap-[0.4rem]">
              <dt className="ui-label">{t("emailLabel")}</dt>
              <dd className="m-0 text-t-20">
                <LinkLine href={`mailto:${email}`}>{email}</LinkLine>
              </dd>
            </div>
            <div className="m-0 flex flex-col gap-[0.4rem]">
              <dt className="ui-label">{t("phoneLabel")}</dt>
              <dd className="m-0 text-t-20" dir="ltr">
                <LinkLine href={t("phoneHref")}>{t("phone")}</LinkLine>
              </dd>
            </div>
          </dl>
        </Reveal>

        <Reveal delay={100}>
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

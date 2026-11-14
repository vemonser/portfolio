import { getTranslations, setRequestLocale } from "next-intl/server";

import ContactForm from "@/features/contact/ContactForm";
import ChapterLabel from "@/features/ui/ChapterLabel";
import LinkLine from "@/features/ui/LinkLine";
import PageFrame from "@/features/ui/PageFrame";
import Reveal from "@/features/ui/Reveal";
import { toLocale } from "@/features/ui/editorial";
import { bodyMeasure, chapterFrame, displayTitle } from "@/features/ui/styles";

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
  const typed = toLocale(locale);
  const email = t("email");

  return (
    <PageFrame
      locale={typed}
      className={`${chapterFrame} pb-[calc(var(--inset-chapter)+4rem)] pt-[clamp(8rem,22vh,14rem)]`}
    >
      <Reveal className="chapter-open">
        <ChapterLabel locale={typed} index={4}>
          {t("label")}
        </ChapterLabel>

        <h1 className={`${displayTitle} mt-[var(--space-3)]`}>{t("title")}</h1>

        <p
          className={`${bodyMeasure} mt-[var(--space-3)] text-[clamp(1.05rem,1.5vw,1.3rem)]`}
        >
          {t("lede")}
        </p>
      </Reveal>

      <div className="mt-[var(--space-8)] grid items-start gap-[var(--space-7)] lg:grid-cols-12 lg:gap-x-[var(--space-5)]">
        <Reveal className="lg:col-span-4">
          <p className="ui-label m-0">{t("detailsLabel")}</p>

          <dl className="m-0 mt-[var(--space-4)] flex flex-col gap-[var(--space-4)]">
            <div className="flex flex-col gap-[0.4rem] border-t border-[var(--line-hairline)] pt-[var(--space-2)]">
              <dt className="ui-label">{t("emailLabel")}</dt>
              <dd className="m-0 break-words text-[clamp(1.05rem,1.5vw,1.25rem)] [overflow-wrap:anywhere]">
                <LinkLine
                  href={`mailto:${email}`}
                  className="scroll-mt-[8rem]"
                >
                  {email}
                </LinkLine>
              </dd>
            </div>

            <div className="flex flex-col gap-[0.4rem] border-t border-[var(--line-hairline)] pt-[var(--space-2)]">
              <dt className="ui-label">{t("phoneLabel")}</dt>
              <dd
                className="m-0 text-[clamp(1.05rem,1.5vw,1.25rem)]"
                dir="ltr"
              >
                <LinkLine href={t("phoneHref")} className="scroll-mt-[8rem]">
                  {t("phone")}
                </LinkLine>
              </dd>
            </div>
          </dl>
        </Reveal>

        <Reveal
          delay={100}
          className="lg:col-span-7 lg:col-start-6"
        >
          <ContactForm
            to={email}
            endpoint={process.env.NEXT_PUBLIC_CONTACT_ENDPOINT}
            labels={{
              name: t("form.name"),
              email: t("form.email"),
              message: t("form.message"),
              send: t("form.send"),
              hint: t("form.hint"),
              subjectPrefix: t("form.subjectPrefix"),
              requiredName: t("form.requiredName"),
              requiredEmail: t("form.requiredEmail"),
              invalidEmail: t("form.invalidEmail"),
              requiredMessage: t("form.requiredMessage"),
              sending: t("form.sending"),
              sent: t("form.sent"),
              ready: t("form.ready"),
              openMail: t("form.openMail"),
              failed: t("form.failed"),
            }}
          />
        </Reveal>
      </div>
    </PageFrame>
  );
}

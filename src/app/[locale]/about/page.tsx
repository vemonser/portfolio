import { getTranslations, setRequestLocale } from "next-intl/server";

import Reveal from "@/features/ui/Reveal";
import SectionHeading from "@/features/ui/SectionHeading";

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

  return (
    <main className="about-page">
      <Reveal className="page-intro">
        <p className="ui-label">{t("label")}</p>
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-lede">{t("lede")}</p>
      </Reveal>

      <div className="about-grid">
        <Reveal className="about-bio">
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </Reveal>

        <Reveal delay={100} className="about-portrait">
          <div
            className="about-portrait__layer"
            role="img"
            aria-label={t("portraitAlt")}
          />
          <span className="about-portrait__mark" aria-hidden="true">
            A
          </span>
        </Reveal>
      </div>

      <section aria-labelledby="services-title" className="about-services">
        <Reveal>
          <SectionHeading label={t("servicesLabel")} />
        </Reveal>
        <h2 id="services-title" className="sr-only">
          {t("servicesLabel")}
        </h2>

        <ul className="services-grid">
          {services.map((service, index) => (
            <Reveal
              as="li"
              key={service.title}
              className="service"
              delay={index * 60}
            >
              <span className="service__index">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="service__title">{service.title}</h3>
              <p className="service__body">{service.body}</p>
            </Reveal>
          ))}
        </ul>
      </section>
    </main>
  );
}

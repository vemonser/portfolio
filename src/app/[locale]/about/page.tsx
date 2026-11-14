import { getTranslations, setRequestLocale } from "next-intl/server";

import Reveal from "@/features/ui/Reveal";
import SectionHeading from "@/features/ui/SectionHeading";
import { pageLede, pageShell, pageTitle } from "@/features/ui/styles";

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
    <main className={`${pageShell} pb-[clamp(4rem,9vh,7rem)]`}>
      <Reveal className="max-w-[60rem]">
        <p className="ui-label">{t("label")}</p>
        <h1 className={pageTitle}>{t("title")}</h1>
        <p className={pageLede}>{t("lede")}</p>
      </Reveal>

      <div className="mt-[clamp(3.5rem,8vw,6rem)] grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)] lg:gap-x-[clamp(2rem,6vw,6rem)]">
        <Reveal className="flex max-w-[42rem] flex-col gap-5">
          {paragraphs.map((paragraph) => (
            <p
              key={paragraph}
              className="m-0 text-t-20 leading-[1.8] text-bone/70 ar:leading-[2]"
            >
              {paragraph}
            </p>
          ))}
        </Reveal>

        <Reveal
          delay={100}
          className="relative aspect-[4/5] overflow-hidden rounded-[2px] bg-ink"
        >
          <div
            role="img"
            aria-label={t("portraitAlt")}
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(110% 80% at 30% 20%, rgb(198 240 53 / 0.18), transparent 60%), linear-gradient(160deg, #2f4a3c, #171614 55%, #0b0b0a)",
            }}
          />
          <span className="absolute inset-0 grid place-items-center font-display text-[clamp(8rem,20vw,16rem)] font-semibold leading-none text-bone/10">
            {t("initial")}
          </span>
        </Reveal>
      </div>

      <section
        aria-labelledby="services-title"
        className="mt-[clamp(5rem,12vw,9rem)]"
      >
        <Reveal>
          <SectionHeading label={t("servicesLabel")} />
        </Reveal>
        <h2 id="services-title" className="sr-only">
          {t("servicesLabel")}
        </h2>

        <ul className="m-0 mt-14 grid list-none gap-10 p-0 md:grid-cols-2 md:gap-x-16 md:gap-y-14">
          {services.map((service, index) => (
            <Reveal
              as="li"
              key={service.title}
              className="border-t border-bone/15 pt-[1.1rem]"
              delay={index * 60}
            >
              <span className="font-label text-t-14 tracking-[var(--track)] text-lime ar:tracking-normal">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h3 className="mb-2 mt-[0.4rem] font-display text-t-28 font-semibold tracking-[-0.02em] ar:tracking-normal">
                {service.title}
              </h3>
              <p className="m-0 max-w-[38ch] leading-[1.7] text-bone/60 ar:leading-[1.9]">
                {service.body}
              </p>
            </Reveal>
          ))}
        </ul>
      </section>
    </main>
  );
}

import { getTranslations } from "next-intl/server";

import HeroOverlay from "./HeroOverlay";
import HeroStage from "./HeroStage";

export default async function Hero() {
  const t = await getTranslations("hero");

  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100dvh] flex-col justify-end overflow-hidden bg-black"
    >
      <HeroStage />

      {/*
        The overlay owns the entrance: meta labels first, then the wordmark
        rising out of its mask. Both wait for the first rendered frame.
      */}
      <HeroOverlay>
        <div className="hero-meta">
          <p className="ui-label hero-meta__status">
            <span className="hero-meta__dot" aria-hidden="true" />
            {t("available")}
          </p>

          <span className="hero-meta__scroll" aria-hidden="true">
            <span className="ui-label">{t("scroll")}</span>
            <span className="hero-meta__scroll-line" />
          </span>

          <p className="ui-label hero-meta__location">{t("location")}</p>
        </div>

        <h1 id="hero-title" className="hero-wordmark">
          <span className="hero-wordmark__mask">
            <span className="hero-wordmark__line">{t("name")}</span>
          </span>
        </h1>
      </HeroOverlay>
    </section>
  );
}

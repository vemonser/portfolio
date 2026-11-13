import { getTranslations } from "next-intl/server";

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

      <div
        aria-hidden="true"
        data-scrim
        className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[52%] bg-gradient-to-t from-black via-black/80 to-transparent"
      />

      <h1 id="hero-title" className="hero-wordmark relative z-10">
        {t("name")}
      </h1>
    </section>
  );
}

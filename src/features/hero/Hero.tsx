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

      {/*
        Plain HTML text, exactly like the reference hero: the h1 carries the
        word, nothing is applied to it, and hover belongs entirely to the
        surface behind it — pointer moves travel through the text to the
        scene, which is what makes the shape answer the cursor.
      */}
      <h1
        id="hero-title"
        className="hero-wordmark pointer-events-none relative z-10"
      >
        {t("name")}
      </h1>
    </section>
  );
}

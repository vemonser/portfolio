import { copy } from "@/content/copy";

import HeroStage from "./HeroStage";

/**
 * The Hero is the site's signature moment: a centred wordmark over the mercury
 * surface. The wordmark is server-rendered and visible at first paint. It is
 * deliberately not animated in: an entrance that starts hidden makes the first
 * seconds a black screen while a phone downloads the scene, and it delays the
 * page's largest text. The surface carries the motion; the name carries the
 * meaning.
 */
export default function Hero() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100dvh] flex-col justify-end overflow-hidden bg-black"
    >
      <HeroStage />

      <div className="relative z-10">
        <h1
          id="hero-title"
          className="hero-wordmark text-center"
          data-hero-wordmark
        >
          {copy.hero.name}
        </h1>
      </div>
    </section>
  );
}

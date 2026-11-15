import { copy } from "@/content/copy";

import HeroOverlay from "./HeroOverlay";
import HeroStage from "./HeroStage";

/**
 * The Hero is the site's signature moment: a centred wordmark over the mercury
 * surface, with availability, the scroll cue and location on one meta row.
 */
export default function Hero() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[100dvh] flex-col justify-end overflow-hidden bg-black"
    >
      <HeroStage />

      {/*
        The overlay owns the entrance: the wordmark rises out of its mask once
        the first frame lands. The hero carries the wordmark and nothing else —
        availability, location and the scroll cue live in the intro chapter.
      */}
      <HeroOverlay>
        <h1
          id="hero-title"
          className="hero-wordmark text-center"
          data-hero-wordmark
        >
          <span className="block overflow-hidden py-[0.12em] -my-[0.12em]">
            <span className="block translate-y-[115%] transition-transform duration-[1050ms] ease-[var(--ease-editorial)] delay-[150ms] will-change-transform group-data-[in=true]:translate-y-0">
              {copy.hero.name}
            </span>
          </span>
        </h1>
      </HeroOverlay>
    </section>
  );
}

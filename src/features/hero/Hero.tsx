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
        The overlay owns the entrance: meta labels first, then the wordmark
        rising out of its mask. Both wait for the first rendered frame.
      */}
      <HeroOverlay>
        <div
          data-hero-meta
          className="flex flex-wrap items-center justify-between gap-x-5 gap-y-3 px-[var(--inset-edge)] translate-y-3 opacity-0 transition-[opacity,transform] duration-[900ms] ease-[var(--ease-editorial)] delay-[550ms] group-data-[in=true]:translate-y-0 group-data-[in=true]:opacity-100"
        >
          <p className="ui-label inline-flex items-center gap-[0.55rem]">
            <span
              className="h-[7px] w-[7px] rounded-full bg-lime animate-hero-pulse"
              aria-hidden="true"
            />
            {copy.hero.available}
          </p>

          <span
            className="hidden flex-col items-center gap-2 sm:flex"
            aria-hidden="true"
          >
            <span className="ui-label">{copy.hero.scroll}</span>
            <span className="block h-[clamp(1.5rem,4vh,2.5rem)] w-px origin-top bg-gradient-to-b from-warm to-transparent animate-hero-scroll" />
          </span>

          <p className="ui-label m-0 ms-auto text-end">{copy.hero.location}</p>
        </div>

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

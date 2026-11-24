import { copy } from "@/content/copy";
import { ArrowDown } from "@/features/ui/Arrow";
import PageTitle from "@/features/motion/PageTitle";

import HeroCanvas from "./HeroCanvas";
import "./hero.css";

const HEADLINE = ["MULTI-", "DISCIPLINARY", "DEVELOPER"] as const;

/**
 * The note is the composition's right-hand column. The words are the lab's
 * existing sentence, untouched; only the line breaks are gone, because a real
 * column must be allowed to set its own measure.
 */
const NOTE =
  "Abdelrhman Samy is a software developer building fast, precise interfaces for the web. Based in Cairo.";

/**
 * Home hero. The scene is a single transparent canvas; the headline and the
 * note are real DOM above it, so the name is selectable, searchable and painted
 * at first paint. The headline is anchored to the lower part of the first
 * screen and shares one left edge across its three lines.
 */
export default function Hero() {
  return (
    <section id="hero" className="hero-home" aria-labelledby="hero-title">
      <HeroCanvas />

      <div className="hero-home__inner page-shell">
        <div className="hero-home__content">
          <PageTitle>
            <h1
              id="hero-title"
              className="hero-home__title"
              aria-label="Multi-disciplinary developer"
            >
              {HEADLINE.map((line) => (
                <span key={line} className="hero-home__line">
                  {line}
                </span>
              ))}
            </h1>
          </PageTitle>

          <p className="hero-home__note">{NOTE}</p>
        </div>

        <div className="hero-home__meta">
          <span>{copy.hero.location}</span>
          <span className="hero-home__status">{copy.hero.available}</span>
          <a href="#intro" className="hero-home__scroll">
            Scroll
            <ArrowDown />
          </a>
        </div>
      </div>
    </section>
  );
}

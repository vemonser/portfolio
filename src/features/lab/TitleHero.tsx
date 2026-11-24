import Link from "next/link";

import { copy } from "@/content/copy";
import LocalTime from "@/features/footer/LocalTime";
import TitleCounter from "@/features/lab/TitleCounter";

import "./title.css";

/**
 * The home hero as a title card: a cinematic field, the name at poster scale,
 * a real progress count for the opening, and one line of facts. No scene, no
 * sample, no grid. The typography carries the screen; the monogram gives it a
 * mark; the light gives it depth.
 */
export default function TitleHero() {
  return (
    <section id="hero" className="title-card" aria-labelledby="title-name">
      <div className="title-card__glow" aria-hidden="true" />
      <div className="title-card__watermark" aria-hidden="true">
        AS
      </div>

      <div className="title-card__top" aria-hidden="true">
        <p className="title-card__eyebrow">Portfolio — 2026</p>
        <p className="title-card__eyebrow title-card__eyebrow--end">
          00 / Title
        </p>
      </div>

      <div className="title-card__counter-wrap" aria-hidden="true">
        <span className="title-card__counter-label">Opening</span>
        <TitleCounter />
      </div>

      <div className="title-card__body">
        <p className="title-card__role">Software developer</p>

        <h1
          id="title-name"
          className="title-card__name"
          aria-label="Abdelrhman Samy"
        >
          <span aria-hidden="true">
            <i>Abdelrhman</i>
          </span>
          <span aria-hidden="true">
            <i>Samy</i>
          </span>
        </h1>

        <p className="title-card__statement">
          Building fast, precise interfaces for the web.
        </p>
      </div>

      <div className="title-card__bottom">
        <p className="title-card__meta">
          <span>{copy.hero.location}</span>
          <span className="title-card__sep" aria-hidden="true">
            ·
          </span>
          <LocalTime className="title-card__time" />
          <span className="title-card__sep" aria-hidden="true">
            ·
          </span>
          <span className="title-card__status">
            <span className="title-card__dot" aria-hidden="true" />
            Available
          </span>
        </p>

        <Link href="/work" className="title-card__link link-line">
          Selected work
          <span aria-hidden="true">↘</span>
        </Link>
      </div>
    </section>
  );
}

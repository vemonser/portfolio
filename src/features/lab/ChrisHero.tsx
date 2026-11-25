"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import gsap from "gsap";

import HeroCircle from "@/features/lab/HeroCircle";
import { markHeroReady } from "@/features/hero/scene-ready";
import { onPhase, setPhase } from "./heroPhase";

import "./chris-hero.css";

/*
 * three.js is ~129 KB and the home page's only reason to ship it. It sits
 * behind a dynamic import so the hero text, poster and loader paint from the
 * server HTML first; the WebGL field streams in right after. The loader waits
 * on markHeroReady(), which the scene fires on its first frame — and the
 * `loading` fallback below fires it too, so a slow or blocked three.js download
 * can never strand the loader on the plate.
 */
const HeroScene = dynamic(() => import("@/features/hero/HeroScene"), {
  ssr: false,
  loading: () => {
    if (typeof window !== "undefined") markHeroReady();
    return null;
  },
});

const HEADLINE = ["MULTI-", "DISCIPLINARY", "DEVELOPER"] as const;

const NOTE = [
  "ABDELRHMAN SAMY IS A SOFTWARE",
  "DEVELOPER BUILDING FAST, PRECISE",
  "INTERFACES FOR THE WEB. BASED",
  "IN CAIRO.",
] as const;

/*
 * The stagger is one continuous run down the whole headline, not one run per
 * line: the reference delays every character by the same step, so line two
 * begins as line one's last character leaves and line three follows line two.
 * `--i` is therefore the character's index in the entire title.
 */
const LINE_OFFSETS: number[] = [];
HEADLINE.reduce((offset, line) => {
  LINE_OFFSETS.push(offset);
  return offset + [...line].length;
}, 0);

/**
 * One row of a line. Two of these sit stacked inside the same clipping band:
 * the outgoing row travels up a full line, the incoming row arrives from
 * below, and each character is 25ms behind the one before it. That staggered
 * swap is the "glitch" — two identical layers trading places, not a filter.
 */
function Row({
  text,
  layer,
  offset,
}: {
  text: string;
  layer: "from" | "to";
  offset: number;
}) {
  return (
    <span className={`hero-line__row hero-line__row--${layer}`} aria-hidden="true">
      {[...text].map((char, index) => (
        <span
          key={`${layer}-${char}-${index}`}
          className="hero-line__char"
          style={{ "--i": offset + index } as CSSProperties}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
}

function Line({
  text,
  index,
  offset,
}: {
  text: string;
  index: number;
  offset: number;
}) {
  return (
    <span className="hero-line" data-line={index + 1}>
      <Row text={text} layer="from" offset={offset} />
      <Row text={text} layer="to" offset={offset} />
    </span>
  );
}

/**
 * Promote `ready` to `reveal`, but only while the hero is actually on screen.
 * Until then the title sits in its parked state, so a visitor never sees the
 * roll happen underneath the plate.
 */
function useRevealOnScreen() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = sectionRef.current;
    if (!root) return;

    const promote = () => {
      const pl = document.documentElement.dataset.pageLoader;
      // No loader (reduced motion, hash deep link): settle immediately.
      if (pl === "skip") {
        if (document.documentElement.dataset.heroPhase !== "done") {
          setPhase("done");
        }
        return;
      }
      if (pl !== "done") return; // still loading
      if (
        document.documentElement.dataset.heroPhase === "reveal" ||
        document.documentElement.dataset.heroPhase === "done"
      ) {
        return;
      }
      const rect = root.getBoundingClientRect();
      const onScreen = rect.bottom > 0 && rect.top < window.innerHeight;
      if (onScreen) setPhase("reveal");
    };

    const unsubscribe = onPhase(promote);
    promote();

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) promote();
      },
      { threshold: 0.05 },
    );
    observer.observe(root);

    const mutationObserver = new MutationObserver(promote);
    mutationObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-page-loader", "data-hero-phase"],
    });

    return () => {
      unsubscribe();
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return sectionRef;
}

/**
 * The hero, rebuilt against the live reference.
 *
 * The headline is three lines of one optical block: each line is centred on
 * its own width, then shifted — the first left, the third right — so the block
 * reads as a shape rather than a paragraph. The note is not a column beside
 * the headline: it hangs off the right end of the third line, top-aligned with
 * it, with its first line indented. The circle sits below, on the page axis.
 */
export default function ChrisHero() {
  const sectionRef = useRevealOnScreen();
  const [paused, setPaused] = useState(false);

  // On a client-nav return the loader has already run and the title sits in its
  // final state; fade the stage in gently instead of replaying the title roll.
  useEffect(() => {
    if (document.documentElement.dataset.pageLoader !== "done") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const stage = sectionRef.current?.querySelector<HTMLElement>(".hero-chris__stage");
    if (!stage) return;
    const tween = gsap.fromTo(
      stage,
      { opacity: 0 },
      { opacity: 1, duration: 0.8, ease: "power2.out" },
    );
    return () => {
      tween.kill();
    };
  }, [sectionRef]);

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="hero-chris"
      aria-labelledby="hero-title"
    >
      <span className="hero-chris__paper" aria-hidden="true" />
      <HeroScene paused={paused} />

      <div className="hero-chris__stage">
        <h1
          id="hero-title"
          className="hero-title"
          aria-label="Multi-disciplinary developer"
        >
          {HEADLINE.map((line, index) => (
            <span
              key={line}
              className="hero-line-block"
              data-line={index + 1}
            >
              <Line
                text={line}
                index={index}
                offset={LINE_OFFSETS[index] ?? 0}
              />
              {index === 2 ? (
                <p className="hero-note" aria-hidden="true">
                  {NOTE.map((row, rowIndex) => (
                    <span key={row} className="hero-note__line">
                      <span
                        className="hero-note__inner"
                        style={{ "--i": rowIndex } as CSSProperties}
                      >
                        {row}
                      </span>
                    </span>
                  ))}
                </p>
              ) : null}
            </span>
          ))}
        </h1>

        {/* The note is laid out inside the headline for the composition; this
            is the copy screen readers actually get, once, in reading order. */}
        <p className="hero-sr">{NOTE.join(" ")}</p>

        <HeroCircle label="Scroll to introduction" />

        <button
          type="button"
          className="hero-motion-toggle"
          aria-pressed={paused}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? "Play motion" : "Pause motion"}
        </button>
      </div>
    </section>
  );
}
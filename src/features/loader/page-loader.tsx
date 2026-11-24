"use client";

import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { PAGE_LOADER_SEEN_KEY } from "./gate";
import { fitWordmark } from "./fit-wordmark";
import { waitForLoaderReady } from "./ready";
import { createLoaderTimeline } from "./timeline";
import "./loader.css";

gsap.registerPlugin(useGSAP);

const WORD = "ABDELRHMAN";
const CHARS = [...WORD];

const FIRST_VISIT_MS = 2800;
const REPEAT_VISIT_MS = 2000;

export default function PageLoader() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = document.documentElement;
      if (root.dataset.pageLoader !== "run") return;

      const scope = rootRef.current;
      if (!scope) return;

      const q = <T extends HTMLElement>(sel: string) =>
        scope.querySelector<T>(sel);

      const plate = q(".page-loader__plate--black");
      const limePlate = q(".page-loader__plate--lime");
      const word = q(".page-loader__word");
      const line = q(".page-loader__line");
      const countBox = q(".page-loader__count");
      const count = q(".page-loader__count p");
      const measure = q(".page-loader__measure");
      const letters = gsap.utils.toArray<HTMLElement>(
        ".page-loader__letter",
        scope,
      );

      if (
        !plate ||
        !limePlate ||
        !word ||
        !line ||
        !countBox ||
        !count ||
        !measure ||
        letters.length !== CHARS.length
      ) {
        root.dataset.pageLoader = "skip";
        return;
      }

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        root.dataset.pageLoader = "skip";
        return;
      }

      let seen = false;
      try {
        seen = sessionStorage.getItem(PAGE_LOADER_SEEN_KEY) === "1";
      } catch {
        // Private mode: the long version is harmless.
      }

      const isHome = window.location.pathname === "/";
      const minMs = seen ? REPEAT_VISIT_MS : FIRST_VISIT_MS;

      const main = document.querySelector<HTMLElement>("main");
      if (main) main.style.overflow = "hidden";

      let dead = false;

      const stopFit = fitWordmark({ word, line, measure, countBox, letters });
      const readiness = waitForLoaderReady({ isHome });

      const finish = () => {
        root.dataset.pageLoader = "done";
        try {
          sessionStorage.setItem(PAGE_LOADER_SEEN_KEY, "1");
        } catch {
          // Gate simply runs long again next time.
        }
        if ("scrollRestoration" in history) history.scrollRestoration = "auto";
        if (main) {
          main.style.transform = "";
          main.style.overflow = "";
        }
        stopFit();
        readiness.dispose();
        window.dispatchEvent(new Event("resize"));
      };

      createLoaderTimeline({
        els: { plate, limePlate, line, count, letters },
        minMs,
        ready: readiness.ready,
        isDead: () => dead,
        onDone: finish,
      });

      // Runs on unmount; useGSAP kills every tween/timeline above by itself.
      return () => {
        dead = true;
        stopFit();
        readiness.dispose();
        if (main) {
          main.style.transform = "";
          main.style.overflow = "";
        }
      };
    },
    { scope: rootRef, dependencies: [] },
  );

  return (
    <div
      className="page-loader"
      role="status"
      aria-label="Loading Abdelrhman"
      ref={rootRef}
    >
      <div
        className="page-loader__plate page-loader__plate--lime"
        aria-hidden="true"
      />
      <div
        className="page-loader__plate page-loader__plate--black"
        aria-hidden="true"
      >
        <div className="page-loader__word" aria-hidden="true">
          <div className="page-loader__line">
            {CHARS.map((char, index) => (
              <span key={`letter-${index}`} className="page-loader__letter">
                {char}
              </span>
            ))}
          </div>
          <div className="page-loader__count">
            <p>0%</p>
          </div>
          <span className="page-loader__measure">
            {CHARS.map((char, index) => (
              <span key={`measure-${index}`}>{char}</span>
            ))}
          </span>
        </div>
      </div>
    </div>
  );
}
/**
 * The hero opens on a white plate. The gate runs during HTML parse so the very
 * first paint is already correct: no dark flash, no white flash on a return.
 */
export const GATE_SCRIPT = `
(function () {
  var root = document.documentElement;
  try {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var forced = new URLSearchParams(location.search).get("loader") === "1";
    var seen = sessionStorage.getItem("hero-loader-seen") === "1";
    if (reduced || (!forced && seen)) {
      root.dataset.heroLoader = "skip";
      root.dataset.heroPhase = "done";
    } else {
      root.dataset.heroLoader = "run";
      root.dataset.heroPhase = "loading";
      root.style.overflow = "hidden";
      if ("scrollRestoration" in history) history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
    }
  } catch (event) {
    root.dataset.heroLoader = "skip";
    root.dataset.heroPhase = "done";
  }
})();
`;

export type HeroPhase = "loading" | "ready" | "reveal" | "done";

export const HERO_PHASE_EVENT = "hero:phase";
export const HERO_SCENE_READY = "hero:scene-ready";

export const LOADER_SEEN_KEY = "hero-loader-seen";

export function gateMode(): "run" | "skip" {
  if (typeof document === "undefined") return "skip";
  return document.documentElement.dataset.heroLoader === "run" ? "run" : "skip";
}

export function getPhase(): HeroPhase {
  if (typeof document === "undefined") return "done";
  const value = document.documentElement.dataset.heroPhase;
  return value === "reveal" || value === "done" || value === "ready"
    ? value
    : "loading";
}

export function setPhase(phase: HeroPhase) {
  document.documentElement.dataset.heroPhase = phase;
  window.dispatchEvent(new CustomEvent<HeroPhase>(HERO_PHASE_EVENT, { detail: phase }));
}

export function onPhase(listener: (phase: HeroPhase) => void) {
  const handler = (event: Event) => {
    listener((event as CustomEvent<HeroPhase>).detail);
  };
  window.addEventListener(HERO_PHASE_EVENT, handler);
  return () => window.removeEventListener(HERO_PHASE_EVENT, handler);
}

export function signalSceneReady() {
  window.dispatchEvent(new Event(HERO_SCENE_READY));
}

export function onSceneReady(listener: () => void) {
  window.addEventListener(HERO_SCENE_READY, listener, { once: true });
  return () => window.removeEventListener(HERO_SCENE_READY, listener);
}

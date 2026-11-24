export const HERO_READY_EVENT = "hero:ready";

type ReadyWindow = Window & { __heroReady?: boolean };

/** HeroScene calls this after its first painted frame, or if WebGL fails. */
export function markHeroReady() {
  const readyWindow = window as ReadyWindow;
  readyWindow.__heroReady = true;
  window.dispatchEvent(new Event(HERO_READY_EVENT));
}

export function isHeroReady(): boolean {
  return (window as ReadyWindow).__heroReady === true;
}

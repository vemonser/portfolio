/**
 * The intro is a session decoration, not a gate. These helpers keep the three
 * decisions in one place: whether the session has already seen it, whether
 * motion is allowed, and the tiny pre-paint script that must make the same
 * decision before React hydrates.
 *
 * Storage is injectable so the rules are unit-testable; the browser always
 * passes `window.sessionStorage`.
 */

export const INTRO_KEY = "site-intro-seen-v1";

type Readable = Pick<Storage, "getItem">;
type Writable = Pick<Storage, "setItem">;

export function hasSeenIntro(storage: Readable): boolean {
  try {
    return storage.getItem(INTRO_KEY) === "1";
  } catch {
    // Private mode or a blocked cookie partition: show it rather than crash.
    return false;
  }
}

export function markIntroSeen(storage: Writable): void {
  try {
    storage.setItem(INTRO_KEY, "1");
  } catch {
    // A blocked write only means a reload may replay the intro.
  }
}

export function shouldShowIntro(
  storage: Readable,
  reducedMotion: boolean,
): boolean {
  return !reducedMotion && !hasSeenIntro(storage);
}

/**
 * Runs as the first node in <body>, during HTML parse. It must never throw:
 * a JavaScript failure would otherwise leave the cover painted forever.
 */
export function introGateScript(): string {
  return `(function(){try{if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;if(!sessionStorage.getItem(${JSON.stringify(INTRO_KEY)})){document.documentElement.dataset.intro="run"}}catch(e){}})()`;
}

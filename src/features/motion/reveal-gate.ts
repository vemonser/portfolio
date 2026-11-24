/**
 * One gate for every entrance animation on the site.
 *
 * The page loader and the route curtain both cover the page, so a reveal that
 * runs while either is on screen is wasted — the visitor never sees it. This
 * module keeps every reveal parked until the page is actually visible, then
 * holds for a beat so the empty space registers before the first line or image
 * arrives.
 *
 * The gate is intentionally module-level: `TextReveal`, `ImageReveal` and
 * `Prose` all await the same promise, so a page can never have two different
 * opinions about when it is allowed to animate.
 */
const HOLD_MS = 200;
/** Loader and curtain both have their own safety nets; this is the last one. */
const MAX_WAIT_MS = 12_000;
const CURTAIN_SELECTOR = ".route-curtain";

let open = false;
let openPromise: Promise<void> | null = null;
let resolveOpen: (() => void) | null = null;
let holdTimer = 0;
let waitTimer = 0;
let started = false;

function pageLoading(): boolean {
  return document.documentElement.dataset.pageLoader === "run";
}

function curtainActive(): boolean {
  const curtain = document.querySelector<HTMLElement>(CURTAIN_SELECTOR);
  return curtain?.dataset.active === "true";
}

function blocked(): boolean {
  return pageLoading() || curtainActive();
}

function settleOpen() {
  if (holdTimer) {
    window.clearTimeout(holdTimer);
    holdTimer = 0;
  }
  if (waitTimer) {
    window.clearTimeout(waitTimer);
    waitTimer = 0;
  }
  open = true;
  const resolve = resolveOpen;
  resolveOpen = null;
  openPromise = null;
  resolve?.();
}

function closeGate() {
  open = false;
  if (holdTimer) {
    window.clearTimeout(holdTimer);
    holdTimer = 0;
  }
}

function scheduleOpen() {
  if (open || holdTimer || blocked()) return;

  holdTimer = window.setTimeout(() => {
    holdTimer = 0;
    if (blocked()) {
      closeGate();
      return;
    }
    settleOpen();
  }, HOLD_MS);
}

function evaluate() {
  if (blocked()) {
    closeGate();
    return;
  }
  scheduleOpen();
}

function start() {
  if (started || typeof window === "undefined") return;
  started = true;

  evaluate();

  new MutationObserver(evaluate).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-page-loader"],
  });

  // The curtain is rendered by the root layout, but never assume it is there
  // on the first effect: watch for it and attach the moment it appears, so a
  // navigation that starts before hydration is still gated.
  let curtainObserver: MutationObserver | null = null;
  const watchCurtain = () => {
    if (curtainObserver) return;
    const curtain = document.querySelector<HTMLElement>(CURTAIN_SELECTOR);
    if (!curtain) return;
    curtainObserver = new MutationObserver(evaluate);
    curtainObserver.observe(curtain, {
      attributes: true,
      attributeFilter: ["data-active"],
    });
    evaluate();
  };

  watchCurtain();
  new MutationObserver(watchCurtain).observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  // A stuck loader or curtain must never leave the content invisible.
  waitTimer = window.setTimeout(() => {
    waitTimer = 0;
    if (!open) settleOpen();
  }, MAX_WAIT_MS);
}

/**
 * Resolves once the loader/curtain are gone and the empty beat has passed.
 * Safe to call from every reveal; the work is shared.
 */
export function whenRevealGateOpen(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();

  start();

  if (open) return Promise.resolve();
  if (!openPromise) {
    openPromise = new Promise<void>((resolve) => {
      resolveOpen = resolve;
    });
  }
  return openPromise;
}

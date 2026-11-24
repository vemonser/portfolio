/**
 * Per-project capture overrides. The URL comes from the project data; only
 * behaviour that is specific to a site lives here.
 *
 * extraDelay: ms after images/fonts are settled before the viewport shot.
 * waitForSelector: an element that only exists once the intro has finished.
 * scrollY: fixed scroll position (default 0).
 * click: selector to dismiss an intro/overlay before the shot.
 * css: extra page CSS (cursor followers, chat widgets, ...).
 */
export type ThumbnailOverride = {
  extraDelay?: number;
  waitForSelector?: string;
  scrollY?: number;
  click?: string;
  css?: string;
  /** Normalised crop of the screenshot before the 16:10 resize. */
  crop?: { left: number; top: number; width: number; height: number };
};

export const thumbnailOverrides: Record<string, ThumbnailOverride> = {
  "anom-creative": {
    extraDelay: 5000,
    waitForSelector: "main",
  },
  fambam: {
    extraDelay: 5000,
    waitForSelector: "main",
  },
  advrt: {
    extraDelay: 4500,
    waitForSelector: "main",
  },
  "al-ghaith": {
    // The site runs a ~9s intro; the viewport is still the logo before that.
    extraDelay: 11000,
    waitForSelector: "main",
    // The site frames its hero inside a light page margin. Crop to the scene
    // itself so the card has the same edge-to-edge capture as the others.
    crop: { left: 0.1, top: 0.12, width: 0.8, height: 0.8 },
  },
};

export const DEFAULT_EXTRA_DELAY = 4500;

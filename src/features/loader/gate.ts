/**
 * The loader gate. It runs during HTML parse, before the page paints, so the
 * first frame is the plate rather than the page it covers.
 *
 * The loader plays on every document load, the way the reference does; a
 * repeat load in the same tab only shortens it. Three cases still opt out
 * entirely: the lab prototypes, hash deep links (the plate would hide the
 * anchor the browser is scrolling to), and reduced motion.
 */
export const PAGE_LOADER_SEEN_KEY = "pf-loader-seen";

/**
 * Test-only escape hatch. The behavioural suite drives real pages and should
 * not spend four seconds per document on a loader it is not asserting. It is
 * compiled out of production builds.
 */
export const PAGE_LOADER_OFF_KEY = "pf-loader-off";

const OFF_CHECK =
  process.env.NODE_ENV === "production"
    ? ""
    : `
    if (sessionStorage.getItem("${PAGE_LOADER_OFF_KEY}") === "1") {
      root.dataset.pageLoader = "skip";
      return;
    }`;

export const PAGE_LOADER_GATE = `
(function () {
  var root = document.documentElement;
  try {
    if (
      (location.pathname.indexOf("/lab") === 0 &&
        location.pathname !== "/lab/hero") ||
      location.hash
    ) {
      root.dataset.pageLoader = "skip";
      return;
    }${OFF_CHECK}
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.dataset.pageLoader = "skip";
      return;
    }
    root.dataset.pageLoader = "run";
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    scrollTo(0, 0);
  } catch (event) {
    root.dataset.pageLoader = "skip";
  }
})();
`;

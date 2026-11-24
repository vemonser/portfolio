/**
 * The single source of truth for the showcase pipeline.
 *
 * Adding a project is one entry here: capture, compositions and render all
 * derive from it. Types are deliberately self-contained (no imports) so this
 * file can be imported by both the Remotion bundle and the plain-Node capture
 * script without a TypeScript loader.
 */

export type StopOverride =
  | number
  | {
      /** CSS selector for a section; the capture resolves its top edge. */
      selector: string;
      /** Zero-based match when the selector hits several elements. */
      index?: number;
      /** Added to the resolved offset, in CSS px. */
      offsetPx?: number;
    };

export type ShowcaseRoute = {
  /** Must start with "/". */
  path: string;
  /** Output slug. Defaults to the path: "/" -> "home", "/about/" -> "about". */
  key?: string;
  /** Human label used in reports. */
  label?: string;
  /** Replaces auto-detected desktop stops. */
  stops?: StopOverride[];
  /** Replaces auto-detected mobile stops. */
  mobileStops?: StopOverride[];
  /**
   * Record the real page scrolling and use it for the desktop video. The
   * site's on-view animations play; no tall screenshot involved.
   */
  liveScroll?: boolean;
  /** Also save a real screen recording for this route. */
  record?: boolean;
};

export type ShowcaseProject = {
  slug: string;
  name: string;
  /** Origin used for the address bar; no trailing slash. */
  url: string;
  /** Six-digit hex. Drives the backdrop glow. */
  accent: string;
  /** Exactly two desktop videos. */
  routes: [ShowcaseRoute, ShowcaseRoute];
  /** Which route the mobile video and the phone stills use. Defaults to routes[0]. */
  mobile?: { route?: string };
  stills?: {
    /** CSS-px offsets into the mobile capture. Defaults to top / middle / bottom. */
    offsets?: number[];
  };
  motion?: {
    holdFrames?: number;
    moveFrames?: number;
    returnFrames?: number;
  };
  capture?: {
    /** Hard cap on auto-detected stops; the furthest-apart stay. Default 9. */
    maxStops?: number;
    /** Hide fixed/sticky chrome before the full-page shot. Default true. */
    hideFixed?: boolean;
  };
};

export const PROJECTS: ShowcaseProject[] = [
  {
    slug: "anom-creative",
    name: "Anom Creative",
    url: "https://anomcreative.com",
    accent: "#b4472a",
    routes: [
      {
        path: "/",
        key: "home",
        label: "Home",
        liveScroll: true,
        /**
         * Still used by the mobile composition and as the fallback source
         * for metadata. The desktop home video uses the real scroll clip.
         */
        stops: [0, 900, 2518, 4000, 5519, 9007],
        /** End on the CTA, not on the copyright strip below it. */
        mobileStops: [0, 844, 2353, 3407, 4092, 5568, 6900],
      },
      {
        path: "/about/",
        key: "about",
        label: "About",
      },
    ],
    mobile: { route: "home" },
    stills: { offsets: [0, 2353, 6900] },
    motion: { holdFrames: 24, moveFrames: 18, returnFrames: 16 },
  },
];

export const DEFAULT_HOLD_FRAMES = 30;
export const DEFAULT_MOVE_FRAMES = 22;
export const DEFAULT_RETURN_FRAMES = 18;
export const DEFAULT_MAX_STOPS = 9;

export function routeKey(route: ShowcaseRoute): string {
  if (route.key) return route.key;
  const cleaned = route.path.replace(/^\/+|\/+$/g, "");
  return cleaned.length === 0 ? "home" : cleaned.replace(/\//g, "-");
}

export function projectBySlug(slug: string): ShowcaseProject | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}

export function routePath(project: ShowcaseProject, route: ShowcaseRoute): string {
  return `${project.url.replace(/\/+$/, "")}${route.path.startsWith("/") ? route.path : `/${route.path}`}`;
}

export function displayUrl(project: ShowcaseProject, route: ShowcaseRoute): string {
  const u = new URL(routePath(project, route));
  return `${u.host}${u.pathname === "/" ? "" : u.pathname.replace(/\/$/, "")}`;
}

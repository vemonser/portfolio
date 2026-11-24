import capturesFile from "./captures.generated.json";
import { PROJECTS, routeKey } from "./projects";
import type { ShowcaseProject, ShowcaseRoute } from "./projects";
import { buildTimeline, scaleStops, type Timeline } from "./timeline";

export type Capture = {
  png: string;
  image: string;
  cssWidth: number;
  cssHeight: number;
  intrinsicWidth: number;
  intrinsicHeight: number;
  viewportHeight: number;
  dpr: number;
  stops: number[];
  override: boolean;
  mode: "fullpage" | "stitched";
  capturedAt: string;
};

export type ScrollCapture = {
  src: string;
  width: number;
  height: number;
  duration: number;
  frames: number;
  fps: number;
  capturedAt?: string;
};

type RouteCapture = {
  path: string;
  label: string;
  url: string;
  displayUrl: string;
  desktop?: Capture;
  mobile?: Capture;
  scroll?: ScrollCapture;
  recording?: string;
};

type CapturesFile = {
  generatedAt: string | null;
  projects: Record<
    string,
    {
      slug: string;
      name: string;
      accent: string;
      routes: Record<string, RouteCapture>;
    }
  >;
};

const CAPTURES = capturesFile as CapturesFile;

/** Desktop frame: 1400 wide, 16:10 content, 52px chrome, centred in 1600x1000. */
export const DESKTOP = {
  width: 1600,
  height: 1000,
  frameWidth: 1400,
  contentHeight: 875,
};

/** Live scroll: the recording is the content area under a 52px toolbar. */
export const SCROLL_LAYOUT = {
  width: 1600,
  height: 1000,
  toolbar: 52,
  contentHeight: 948,
};

/** Phone screen is 390:844 scaled to 536 wide. */
export const MOBILE = {
  width: 720,
  height: 1280,
  screenWidth: 536,
  screenHeight: 1160,
};

/** Three phones at poster size. */
export const STILLS = {
  width: 2400,
  height: 1500,
  screenWidth: 520,
  screenHeight: 1125,
  gap: 90,
  sideDrop: 70,
};

export const FIRST_PROJECT = PROJECTS[0];
export const FIRST_ROUTE = FIRST_PROJECT?.routes[0];

export function getProject(slug: string): ShowcaseProject | undefined {
  return PROJECTS.find((project) => project.slug === slug);
}

export function getRoute(
  project: ShowcaseProject,
  key: string,
): ShowcaseRoute | undefined {
  return project.routes.find((route) => routeKey(route) === key);
}

export function getRouteCapture(
  slug: string,
  key: string,
): RouteCapture | undefined {
  return CAPTURES.projects[slug]?.routes[key];
}

export function getCapture(
  slug: string,
  key: string,
  viewport: "desktop" | "mobile",
): Capture | undefined {
  return getRouteCapture(slug, key)?.[viewport];
}

export function getDisplayUrl(slug: string, key: string): string {
  const route = getRouteCapture(slug, key);
  if (route?.displayUrl) return route.displayUrl;
  return getProject(slug)?.url.replace(/^https?:\/\//, "") ?? "";
}

export function getScroll(
  slug: string,
  key: string,
): ScrollCapture | undefined {
  return getRouteCapture(slug, key)?.scroll;
}

export function getRecording(slug: string, key: string): string | undefined {
  return getRouteCapture(slug, key)?.recording;
}

export function desktopTimeline(
  slug: string,
  key: string,
): Timeline | null {
  const project = getProject(slug);
  const capture = getCapture(slug, key, "desktop");
  if (!project || !capture) return null;
  const scale = DESKTOP.frameWidth / capture.cssWidth;
  return buildTimeline(scaleStops(capture.stops, scale), {
    viewportHeight: DESKTOP.contentHeight,
    imageHeight: capture.cssHeight * scale,
    holdFrames: project.motion?.holdFrames,
    moveFrames: project.motion?.moveFrames,
    returnFrames: project.motion?.returnFrames,
  });
}

export function mobileTimeline(slug: string): Timeline | null {
  const project = getProject(slug);
  if (!project) return null;
  const key = project.mobile?.route
    ? project.mobile.route
    : routeKey(project.routes[0]);
  const capture = getCapture(slug, key, "mobile");
  if (!capture) return null;
  const scale = MOBILE.screenWidth / capture.cssWidth;
  return buildTimeline(scaleStops(capture.stops, scale), {
    viewportHeight: MOBILE.screenHeight,
    imageHeight: capture.cssHeight * scale,
    holdFrames: project.motion?.holdFrames,
    moveFrames: project.motion?.moveFrames,
    returnFrames: project.motion?.returnFrames,
  });
}

export function mobileCaptureForProject(
  project: ShowcaseProject,
): { key: string; capture: Capture } | null {
  const key = project.mobile?.route
    ? project.mobile.route
    : routeKey(project.routes[0]);
  const capture = getCapture(project.slug, key, "mobile");
  return capture ? { key, capture } : null;
}

/**
 * Top / a middle project / the footer, unless the config pins three offsets.
 * The middle is rounded to the nearest captured stop so it lands on a section.
 */
export function stillsOffsets(project: ShowcaseProject, capture: Capture): number[] {
  const configured = project.stills?.offsets;
  if (configured && configured.length >= 3) return configured.slice(0, 3);

  const max = Math.max(0, capture.cssHeight - capture.viewportHeight);
  const middle = Math.round(max / 2);
  const nearest =
    capture.stops.length > 0
      ? capture.stops.reduce((best, stop) =>
          Math.abs(stop - middle) < Math.abs(best - middle) ? stop : best,
        )
      : middle;

  return [0, Math.min(max, nearest), max];
}

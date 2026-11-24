/**
 * Pure timeline math for SteppedScroll.
 *
 * The motion model is deliberately not a constant-speed scroll:
 *
 *   hold(30) ─ move(22) ─ hold(30) ─ move(22) ─ … ─ hold(30) ─ return(18)
 *
 * Every move is one eased interpolation, so velocity is zero at both ends.
 * A gap longer than 1.2 viewports keeps a single ease but its duration is
 * multiplied by the number of ~0.8-viewport steps it spans — content is
 * traversed, not skipped, without the stutter of re-easing every screen.
 *
 * No Remotion imports here: the component passes Easing.bezier in, and the
 * unit tests pass a linear ease.
 */

export type EaseFn = (t: number) => number;

export type StopInput = {
  offsetY: number;
  /** Frames to stay at this stop. */
  holdFrames?: number;
  /** Base frames for the move that leaves this stop. */
  moveFrames?: number;
};

export type HoldSegment = {
  kind: "hold";
  startFrame: number;
  endFrame: number;
  offsetY: number;
};

export type MoveSegment = {
  kind: "move";
  startFrame: number;
  endFrame: number;
  from: number;
  to: number;
  /** 1 for a normal gap; >1 when the move spans several viewport heights. */
  steps: number;
};

export type Segment = HoldSegment | MoveSegment;

export type Timeline = {
  stops: number[];
  segments: Segment[];
  totalFrames: number;
  maxOffset: number;
  /** Offsets the long-gap expansion passes through (for reports/tests). */
  waypoints: number[];
};

export type TimelineOptions = {
  /** Composition-space height of the visible window. */
  viewportHeight: number;
  /** Composition-space height of the whole page image. */
  imageHeight: number;
  holdFrames?: number;
  moveFrames?: number;
  returnFrames?: number;
  /** Safety cap. Stops beyond it are sampled evenly. Default 12. */
  maxStops?: number;
};

export const DEFAULT_HOLD = 30;
export const DEFAULT_MOVE = 22;
export const DEFAULT_RETURN = 18;
export const DEFAULT_MAX_STOPS = 12;
export const LONG_GAP_RATIO = 1.2;
export const STEP_RATIO = 0.8;

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * Captures measure stops in CSS px; the composition lays the image out at a
 * different width. Every caller must convert before building a timeline.
 * Desktop's ~0.97 scale hides a missed conversion; a phone's ~1.37 does not.
 */
export function scaleStops(stops: number[], scale: number): number[] {
  return stops.map((stop) => stop * scale);
}

/** Evenly samples by index, always keeping the first and last stop. */
export function capStops(stops: number[], maxStops: number): number[] {
  if (maxStops < 2 || stops.length <= maxStops) return stops;
  const kept = new Set<number>([0, stops.length - 1]);
  for (let i = 1; i < maxStops - 1; i += 1) {
    kept.add(Math.round((i * (stops.length - 1)) / (maxStops - 1)));
  }
  return [...kept].sort((a, b) => a - b).map((i) => stops[i]);
}

/**
 * Clamps, sorts, removes duplicates and optionally caps the list. The first
 * stop is always 0 so the video opens on the top of the page.
 */
export function normalizeStops(
  raw: number[],
  imageHeight: number,
  viewportHeight: number,
  maxStops = DEFAULT_MAX_STOPS,
): number[] {
  const maxOffset = Math.max(0, imageHeight - viewportHeight);
  const clamped = raw
    .filter((value) => Number.isFinite(value))
    .map((value) => Math.round(clamp(value, 0, maxOffset)))
    .sort((a, b) => a - b);

  const unique: number[] = [];
  for (const value of clamped) {
    if (unique.length === 0 || value - unique[unique.length - 1] > 1) {
      unique.push(value);
    }
  }

  if (unique.length === 0 || unique[0] !== 0) unique.unshift(0);
  return capStops(unique, maxStops);
}

/**
 * Builds inclusive frame ranges. Frame `endFrame` of a move already sits on
 * the destination offset, and the following hold starts there — so a move
 * lands exactly, with no half-frame offset.
 */
export function buildTimeline(
  rawStops: number[],
  options: TimelineOptions,
): Timeline {
  const {
    viewportHeight,
    imageHeight,
    holdFrames = DEFAULT_HOLD,
    moveFrames = DEFAULT_MOVE,
    returnFrames = DEFAULT_RETURN,
    maxStops = DEFAULT_MAX_STOPS,
  } = options;

  const maxOffset = Math.max(0, imageHeight - viewportHeight);
  const stops = normalizeStops(rawStops, imageHeight, viewportHeight, maxStops);
  const segments: Segment[] = [];
  const waypoints: number[] = [];

  let cursor = 0;
  for (let i = 0; i < stops.length; i += 1) {
    const stop = stops[i];
    const isLast = i === stops.length - 1;

    const holdLength = Math.max(0, Math.round(holdFrames));
    if (holdLength > 0) {
      segments.push({
        kind: "hold",
        startFrame: cursor,
        endFrame: cursor + holdLength - 1,
        offsetY: stop,
      });
      cursor += holdLength;
    }

    const to = isLast ? 0 : stops[i + 1];
    const distance = Math.abs(to - stop);
    let steps = 1;
    if (
      !isLast &&
      distance > viewportHeight * LONG_GAP_RATIO &&
      viewportHeight > 0
    ) {
      steps = Math.max(2, Math.ceil(distance / (viewportHeight * STEP_RATIO)));
    }

    const base = isLast ? returnFrames : moveFrames;
    const duration = Math.max(1, Math.round(base * (isLast ? 1 : steps)));

    if (steps > 1) {
      for (let s = 1; s < steps; s += 1) {
        waypoints.push(Math.round(stop + ((to - stop) * s) / steps));
      }
    }

    segments.push({
      kind: "move",
      startFrame: cursor,
      endFrame: cursor + duration - 1,
      from: stop,
      to,
      steps,
    });
    cursor += duration;
  }

  return {
    stops,
    segments,
    totalFrames: cursor,
    maxOffset,
    waypoints,
  };
}

/** The scroll offset at a frame, in composition px. */
export function offsetAtFrame(
  timeline: Timeline,
  frame: number,
  ease: EaseFn,
): number {
  const { segments, totalFrames, maxOffset } = timeline;
  if (totalFrames <= 0) return 0;
  if (frame <= 0) return segments[0]?.kind === "hold" ? segments[0].offsetY : 0;
  if (frame >= totalFrames - 1) {
    // The return move ends on 0, so the last frame equals the first frame.
    return 0;
  }

  for (const segment of segments) {
    if (frame < segment.startFrame || frame > segment.endFrame) continue;
    if (segment.kind === "hold") return clamp(segment.offsetY, 0, maxOffset);
    const span = segment.endFrame - segment.startFrame;
    const t = span <= 0 ? 1 : (frame - segment.startFrame) / span;
    return clamp(
      segment.from + (segment.to - segment.from) * ease(clamp(t, 0, 1)),
      0,
      maxOffset,
    );
  }

  return 0;
}

export function framesAtStops(timeline: Timeline): number[] {
  return timeline.segments
    .filter((segment): segment is HoldSegment => segment.kind === "hold")
    .map((segment) => segment.startFrame);
}

export type TimelineRow = {
  kind: "hold" | "move" | "return";
  startFrame: number;
  endFrame: number;
  frames: number;
  from: number;
  to: number;
  steps: number;
};

/** A printable table, used by the preview composition and the tests. */
export function describeTimeline(timeline: Timeline): TimelineRow[] {
  return timeline.segments.map((segment, index) => {
    const isReturn = index === timeline.segments.length - 1;
    return {
      kind:
        segment.kind === "hold"
          ? "hold"
          : isReturn
            ? "return"
            : "move",
      startFrame: segment.startFrame,
      endFrame: segment.endFrame,
      frames: segment.endFrame - segment.startFrame + 1,
      from: segment.kind === "hold" ? segment.offsetY : segment.from,
      to: segment.kind === "hold" ? segment.offsetY : segment.to,
      steps: segment.kind === "hold" ? 1 : segment.steps,
    };
  });
}

import { describe, expect, it } from "vitest";

import {
  buildTimeline,
  capStops,
  normalizeStops,
  offsetAtFrame,
  scaleStops,
  type Timeline,
} from "./timeline";

const linear = (t: number) => t;

function timeline(stops: number[], overrides: Partial<Parameters<typeof buildTimeline>[1]> = {}): Timeline {
  return buildTimeline(stops, {
    viewportHeight: 856,
    imageHeight: 10_000,
    holdFrames: 30,
    moveFrames: 22,
    returnFrames: 18,
    ...overrides,
  });
}

describe("normalizeStops", () => {
  it("clamps, sorts, dedupes and always starts at 0", () => {
    expect(normalizeStops([500, -20, 500, 300], 10_000, 856)).toEqual([
      0, 300, 500,
    ]);
  });

  it("clamps the tail to imageHeight - viewportHeight", () => {
    expect(normalizeStops([0, 99_999], 10_000, 856)).toEqual([0, 9144]);
  });

  it("caps the count while keeping the first and last stop", () => {
    const raw = [0, 100, 200, 300, 400, 500, 600];
    const capped = capStops(raw, 4);
    expect(capped).toHaveLength(4);
    expect(capped[0]).toBe(0);
    expect(capped[capped.length - 1]).toBe(600);
  });
});

describe("scaleStops", () => {
  it("converts CSS capture offsets into composition px", () => {
    const scaled = scaleStops([0, 844, 7236], 536 / 390);
    expect(scaled[0]).toBe(0);
    expect(scaled[1]).toBeCloseTo(1159.96, 1);
    expect(scaled[2]).toBeCloseTo(9944.86, 1);
  });
});

describe("buildTimeline", () => {
  it("computes the duration from holds, moves and the return", () => {
    const t = timeline([0, 900]);
    // 30 hold + 22 move + 30 hold + 18 return
    expect(t.totalFrames).toBe(100);
    expect(t.segments[0]).toMatchObject({ kind: "hold", startFrame: 0, endFrame: 29 });
    expect(t.segments[1]).toMatchObject({ kind: "move", startFrame: 30, endFrame: 51 });
    expect(t.segments[2]).toMatchObject({ kind: "hold", startFrame: 52, endFrame: 81 });
    expect(t.segments[3]).toMatchObject({ kind: "move", startFrame: 82, endFrame: 99, to: 0 });
  });

  it("holds perfectly still at every stop", () => {
    const t = timeline([0, 900]);
    for (let frame = 0; frame <= 29; frame += 1) {
      expect(offsetAtFrame(t, frame, linear)).toBe(0);
    }
    for (let frame = 52; frame <= 81; frame += 1) {
      expect(offsetAtFrame(t, frame, linear)).toBe(900);
    }
  });

  it("starts and lands every move on its exact offsets", () => {
    const t = timeline([0, 900]);
    expect(offsetAtFrame(t, 30, linear)).toBe(0);
    expect(offsetAtFrame(t, 51, linear)).toBe(900);
  });

  it("ends on the same frame as it starts, so the loop is seamless", () => {
    const t = timeline([0, 900, 2400]);
    expect(offsetAtFrame(t, 0, linear)).toBe(0);
    expect(offsetAtFrame(t, t.totalFrames - 1, linear)).toBe(0);
  });

  it("stretches a long gap instead of skipping it", () => {
    const t = timeline([0, 3000], { viewportHeight: 800, moveFrames: 22 });
    const move = t.segments[1];
    expect(move.kind).toBe("move");
    // ceil(3000 / 640) = 5 steps
    expect(move.kind === "move" && move.steps).toBe(5);
    expect(move.endFrame - move.startFrame + 1).toBe(110);
    expect(t.waypoints).toEqual([600, 1200, 1800, 2400]);
  });

  it("leaves a normal gap at its base move duration", () => {
    const t = timeline([0, 900], { viewportHeight: 800 });
    expect(t.segments[1].endFrame - t.segments[1].startFrame + 1).toBe(22);
  });

  it("never moves past the clamped maximum", () => {
    const t = timeline([0, 20_000], { imageHeight: 5_000, viewportHeight: 1_000 });
    expect(t.stops).toEqual([0, 4000]);
    for (let frame = 0; frame < t.totalFrames; frame += 1) {
      expect(offsetAtFrame(t, frame, linear)).toBeLessThanOrEqual(4000);
      expect(offsetAtFrame(t, frame, linear)).toBeGreaterThanOrEqual(0);
    }
  });
});

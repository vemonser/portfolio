import { describe, expect, it } from "vitest";

import {
  activeCompressionZone,
  compressionZone,
  type CompressionTarget,
} from "./compression";

const VIEWPORT = { width: 1000, height: 500 };

const title: CompressionTarget = {
  rect: { left: 100, top: 50, width: 800, height: 100 },
};

const project: CompressionTarget = {
  rect: { left: 40, top: 300, width: 300, height: 150 },
};

describe("compressionZone", () => {
  it("normalizes a title rectangle into centred, GL-oriented space", () => {
    expect(compressionZone(title, VIEWPORT, 0.8)).toEqual({
      center: [0.5, 0.8],
      halfSize: [0.4, 0.1],
      strength: 0.8,
    });
  });

  it("clamps strength into the shader's 0–1 range", () => {
    expect(compressionZone(title, VIEWPORT, 2)?.strength).toBe(1);
  });

  it("returns null when strength collapses to zero", () => {
    expect(compressionZone(title, VIEWPORT, -0.5)).toBeNull();
    expect(compressionZone(title, VIEWPORT, 0)).toBeNull();
  });

  it("returns null for a zero-sized viewport", () => {
    expect(compressionZone(title, { width: 0, height: 500 }, 0.5)).toBeNull();
    expect(compressionZone(title, { width: 1000, height: 0 }, 0.5)).toBeNull();
  });

  it("returns null for an empty target rectangle", () => {
    expect(
      compressionZone(
        { rect: { left: 10, top: 10, width: 0, height: 100 } },
        VIEWPORT,
        0.5,
      ),
    ).toBeNull();
    expect(
      compressionZone(
        { rect: { left: 10, top: 10, width: 100, height: 0 } },
        VIEWPORT,
        0.5,
      ),
    ).toBeNull();
  });

  it("rejects a target that is entirely off-screen", () => {
    const offRight: CompressionTarget = {
      rect: { left: 1200, top: 50, width: 300, height: 100 },
    };
    const offAbove: CompressionTarget = {
      rect: { left: 100, top: -400, width: 300, height: 100 },
    };

    expect(compressionZone(offRight, VIEWPORT, 0.5)).toBeNull();
    expect(compressionZone(offAbove, VIEWPORT, 0.5)).toBeNull();
  });

  it("keeps a partially visible target", () => {
    const clipped: CompressionTarget = {
      rect: { left: -50, top: 400, width: 200, height: 200 },
    };

    expect(compressionZone(clipped, VIEWPORT, 0.5)).not.toBeNull();
  });
});

describe("activeCompressionZone", () => {
  it("activates only the target under the pointer", () => {
    const zone = activeCompressionZone(
      [title, project],
      [150, 350],
      VIEWPORT,
      0.6,
    );

    expect(zone?.center).toEqual([(40 + 150) / 1000, 1 - (300 + 75) / 500]);
  });

  it("returns null when the pointer is over no target", () => {
    expect(
      activeCompressionZone([title, project], [900, 480], VIEWPORT, 0.6),
    ).toBeNull();
  });

  it("prefers the target whose centre is nearest when rectangles overlap", () => {
    const wide: CompressionTarget = {
      rect: { left: 0, top: 0, width: 900, height: 500 },
    };
    const small: CompressionTarget = {
      rect: { left: 500, top: 0, width: 200, height: 200 },
    };

    // The pointer is inside both; the small rect's centre (600, 100) is closer
    // than the wide rect's centre (450, 250).
    const zone = activeCompressionZone([wide, small], [600, 100], VIEWPORT, 1);

    expect(zone).toEqual({
      center: [0.6, 0.8],
      halfSize: [0.1, 0.2],
      strength: 1,
    });
  });

  it("keeps catalogue order on an exact distance tie", () => {
    const left: CompressionTarget = {
      rect: { left: 300, top: 0, width: 200, height: 100 },
    };
    const right: CompressionTarget = {
      rect: { left: 400, top: 0, width: 200, height: 100 },
    };

    // Pointer (450, 50) sits exactly between both centres and inside both.
    const zone = activeCompressionZone([left, right], [450, 50], VIEWPORT, 1);

    expect(zone?.center).toEqual([0.4, 0.9]);
  });

  it("ignores an off-screen target even when the pointer math hits it", () => {
    const offRight: CompressionTarget = {
      rect: { left: 1000, top: 0, width: 400, height: 500 },
    };

    expect(
      activeCompressionZone([offRight], [1100, 100], VIEWPORT, 1),
    ).toBeNull();
  });

  it("does nothing without targets or a valid viewport", () => {
    expect(activeCompressionZone([], [10, 10], VIEWPORT, 1)).toBeNull();
    expect(
      activeCompressionZone([title], [10, 10], { width: 0, height: 0 }, 1),
    ).toBeNull();
  });
});

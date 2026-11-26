import { describe, expect, it, vi } from "vitest";

vi.mock("../../content/blog/posts", () => ({
  getPosts: () => [
    { slug: "two-directions", title: "Designing for two directions at once" },
    { slug: "calm-motion", title: "Motion that settles" },
  ],
}));

import {
  BULGE_RATIO,
  COVER_S,
  CTRL_X_RATIO,
  LABEL_IN_S,
  LABEL_OUT_S,
  LABEL_START_AT,
  MAX_HOLD_S,
  PUSH_AT,
  REVEAL_S,
  TRAIL_LAG,
  coverPath,
  easeOutExpo,
  labelFor,
  revealPath,
  trailProgress,
} from "./route-curtain-geometry";

describe("route curtain constants", () => {
  it("keeps the original timing values", () => {
    expect(COVER_S).toBe(1.0);
    expect(REVEAL_S).toBe(1.1);
    expect(LABEL_IN_S).toBe(0.4);
    expect(LABEL_OUT_S).toBe(0.4);
    expect(PUSH_AT).toBe(0.5);
    expect(LABEL_START_AT).toBe(0.35);
    expect(TRAIL_LAG).toBe(0.1);
    expect(BULGE_RATIO).toBe(0.6);
    expect(CTRL_X_RATIO).toBe(0.27);
    expect(MAX_HOLD_S).toBe(1.4);
  });
});

describe("easeOutExpo", () => {
  it("returns 0 at 0", () => {
    expect(easeOutExpo(0)).toBe(0);
  });

  it("returns 1 at and above 1", () => {
    expect(easeOutExpo(1)).toBe(1);
    expect(easeOutExpo(1.5)).toBe(1);
  });

  it("is monotonically increasing", () => {
    expect(easeOutExpo(0.5)).toBeGreaterThan(easeOutExpo(0.25));
  });
});

describe("trailProgress", () => {
  it("stays at 0 until the lag", () => {
    expect(trailProgress(0)).toBe(0);
    expect(trailProgress(0.1)).toBe(0);
  });

  it("reaches 1 at the end", () => {
    expect(trailProgress(1)).toBe(1);
  });

  it("maps the remaining range linearly", () => {
    expect(trailProgress(0.5)).toBeCloseTo((0.5 - 0.1) / (1 - 0.1));
  });
});

describe("coverPath", () => {
  it("builds the rising sheet path", () => {
    expect(coverPath(100, 200, 50, 10)).toBe(
      "M0 200 L0 50 Q27 40 100 50 L100 200 Z",
    );
  });
});

describe("revealPath", () => {
  it("builds the retracting sheet path", () => {
    expect(revealPath(100, 200, 50, 10)).toBe(
      "M0 0 L100 0 L100 50 Q27 60 0 50 Z",
    );
  });
});

describe("labelFor", () => {
  it("returns the meta title for home", () => {
    expect(labelFor("/")).toBe("Abdelrhman");
    expect(labelFor("")).toBe("Abdelrhman");
  });

  it("resolves a project title", () => {
    expect(labelFor("/work/anom-creative")).toBe("Anom Creative");
  });

  it("resolves a post title", () => {
    expect(labelFor("/blog/two-directions")).toBe(
      "Designing for two directions at once",
    );
  });

  it("resolves nav labels", () => {
    expect(labelFor("/about")).toBe("About");
    expect(labelFor("/contact")).toBe("Contact");
    expect(labelFor("/work")).toBe("Work");
    expect(labelFor("/blog")).toBe("Blog");
  });

  it("falls back to the first segment", () => {
    expect(labelFor("/unknown")).toBe("unknown");
  });

  it("strips trailing slashes", () => {
    expect(labelFor("/about/")).toBe("About");
  });
});
import { describe, expect, it } from "vitest";

import { clamp, heroScrollProgress } from "./math";

describe("clamp", () => {
  it("keeps values inside the range", () => {
    expect(clamp(0.5, -1, 1)).toBe(0.5);
  });

  it("pins values outside the range", () => {
    expect(clamp(-4, -1, 1)).toBe(-1);
    expect(clamp(9, -1, 1)).toBe(1);
  });
});

describe("heroScrollProgress", () => {
  it("is zero while the hero is pinned at the top", () => {
    expect(heroScrollProgress(0, 800, 900)).toBe(0);
  });

  it("reports the fraction of the hero that has scrolled past", () => {
    expect(heroScrollProgress(-200, 800, 900)).toBeCloseTo(0.25);
    expect(heroScrollProgress(-400, 800, 900)).toBeCloseTo(0.5);
  });

  it("never exceeds one", () => {
    expect(heroScrollProgress(-5000, 800, 900)).toBe(1);
  });

  it("never goes below zero", () => {
    expect(heroScrollProgress(120, 800, 900)).toBe(0);
  });

  it("treats a collapsed hero as zero rather than dividing by zero", () => {
    expect(heroScrollProgress(-100, 0, 900)).toBe(0);
    expect(heroScrollProgress(-100, 800, 0)).toBe(0);
  });

  it("uses the viewport height when the hero is taller than the screen", () => {
    // 1200px hero on a 600px screen: progress reaches 1 twice as fast.
    expect(heroScrollProgress(-300, 1200, 600)).toBeCloseTo(0.5);
  });
});

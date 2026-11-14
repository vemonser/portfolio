import { describe, expect, it } from "vitest";

import {
  chapterNumber,
  editorialSpace,
  editorialType,
  formatNumber,
} from "./editorial";

describe("editorialType", () => {
  it("locks the composition values", () => {
    expect(editorialType()).toEqual({
      ratio: 1.25,
      displayMax: "8.5rem",
      bodyMeasure: "68ch",
    });
  });
});

describe("chapterNumber", () => {
  it("pads a zero-based chapter index to two digits", () => {
    expect(chapterNumber(0)).toBe("01");
    expect(chapterNumber(9)).toBe("10");
  });
});

describe("formatNumber", () => {
  it("keeps digits as they are when no padding is asked for", () => {
    expect(formatNumber(2026)).toBe("2026");
  });

  it("pads counters", () => {
    expect(formatNumber(9, { pad: 2 })).toBe("09");
  });
});

describe("editorialSpace", () => {
  it("returns only values from the approved scale", () => {
    expect(editorialSpace(0)).toBe("0.5rem");
    expect(editorialSpace(2)).toBe("1rem");
    expect(editorialSpace(8)).toBe("10rem");
  });

  it("throws on a step outside the scale", () => {
    expect(() => editorialSpace(9)).toThrow();
    expect(() => editorialSpace(-1)).toThrow();
    expect(() => editorialSpace(1.5)).toThrow();
  });
});

import { describe, expect, it } from "vitest";

import {
  chapterNumber,
  editorialSpace,
  editorialType,
  formatNumber,
  toLocale,
} from "./editorial";

describe("editorialType", () => {
  it("locks the English composition values", () => {
    expect(editorialType("en")).toEqual({
      ratio: 1.25,
      displayMax: "8.5rem",
      bodyMeasure: "68ch",
      arabicLeading: 1.55,
    });
  });

  it("locks the Arabic composition values", () => {
    expect(editorialType("ar")).toEqual({
      ratio: 1.25,
      displayMax: "9rem",
      bodyMeasure: "58ch",
      arabicLeading: 1.8,
    });
  });
});

describe("chapterNumber", () => {
  it("pads a zero-based chapter index to two Latin digits", () => {
    expect(chapterNumber(0)).toBe("01");
    expect(chapterNumber(9)).toBe("10");
  });
});

describe("formatNumber", () => {
  it("keeps Latin digits for English years", () => {
    expect(formatNumber(2026, "en")).toBe("2026");
  });

  it("renders Arabic years with Arabic-Indic digits", () => {
    const value = formatNumber(2026, "ar");

    expect(value).toMatch(/^[\u0660-\u0669]+$/);
    expect(value).not.toMatch(/[0-9]/);
  });

  it("pads counters in Arabic-Indic digits", () => {
    expect(formatNumber(9, "ar", { pad: 2 })).toBe("٠٩");
    expect(formatNumber(9, "en", { pad: 2 })).toBe("09");
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

describe("toLocale", () => {
  it("accepts the two supported locales", () => {
    expect(toLocale("ar")).toBe("ar");
    expect(toLocale("en")).toBe("en");
  });

  it("falls back to English for anything else", () => {
    expect(toLocale("fr")).toBe("en");
    expect(toLocale(undefined)).toBe("en");
  });
});

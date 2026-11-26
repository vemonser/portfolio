import { describe, expect, it } from "vitest";

import {
  CURSOR_VARIANTS,
  DEFAULT_CURSOR_VARIANT,
  isCursorVariant,
} from "./cursor-variants";

describe("cursor variants", () => {
  it("defaults to Lime", () => {
    expect(DEFAULT_CURSOR_VARIANT).toBe("magnetic-lime");
  });

  it("contains exactly Lime and Bone", () => {
    expect(CURSOR_VARIANTS).toHaveLength(2);
    expect(CURSOR_VARIANTS.map((variant) => variant.id)).toEqual([
      "magnetic-lime",
      "magnetic-bone",
    ]);
    expect(CURSOR_VARIANTS.map((variant) => variant.label)).toEqual([
      "Lime",
      "Bone",
    ]);
  });

  it("rejects invalid values", () => {
    expect(isCursorVariant("magnetic-lime")).toBe(true);
    expect(isCursorVariant("magnetic-bone")).toBe(true);
    expect(isCursorVariant("magnetic-orbit")).toBe(false);
    expect(isCursorVariant(undefined)).toBe(false);
    expect(isCursorVariant("")).toBe(false);
  });
});
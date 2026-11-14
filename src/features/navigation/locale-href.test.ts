import { describe, expect, it } from "vitest";

import { normalizePath, switchLocalePath } from "./locale-href";

const locales = ["ar", "en"] as const;

describe("switchLocalePath", () => {
  it("swaps the locale on the home path", () => {
    expect(switchLocalePath("/ar", "en", locales)).toBe("/en");
    expect(switchLocalePath("/en", "ar", locales)).toBe("/ar");
  });

  it("keeps the rest of the path", () => {
    expect(switchLocalePath("/ar/work", "en", locales)).toBe("/en/work");
    expect(switchLocalePath("/en/about", "ar", locales)).toBe("/ar/about");
  });

  it("keeps deeper paths", () => {
    expect(switchLocalePath("/en/work/twice", "ar", locales)).toBe(
      "/ar/work/twice",
    );
  });

  it("adds a locale to an unprefixed path", () => {
    expect(switchLocalePath("/work", "ar", locales)).toBe("/ar/work");
  });

  it("never produces a double slash or a trailing one", () => {
    expect(switchLocalePath("/ar/", "en", locales)).toBe("/en");
    expect(switchLocalePath("/", "ar", locales)).toBe("/ar");
  });
});

describe("normalizePath", () => {
  it("drops a single trailing slash", () => {
    expect(normalizePath("/ar/work/")).toBe("/ar/work");
  });

  it("leaves the home path alone", () => {
    expect(normalizePath("/ar")).toBe("/ar");
    expect(normalizePath("/")).toBe("/");
  });
});

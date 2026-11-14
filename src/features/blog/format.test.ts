import { describe, expect, it } from "vitest";

import { formatPostDate } from "./format";

describe("formatPostDate", () => {
  it("keeps the year visible in English", () => {
    expect(formatPostDate("2026-06-12", "en")).toContain("2026");
  });

  it("localizes the month and digits for Arabic", () => {
    expect(formatPostDate("2026-06-12", "ar")).not.toBe(
      formatPostDate("2026-06-12", "en"),
    );
  });

  it("treats an unknown locale as English", () => {
    expect(formatPostDate("2026-06-12", "fr")).toBe(
      formatPostDate("2026-06-12", "en"),
    );
  });
});

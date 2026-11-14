import { describe, expect, it } from "vitest";

import { formatPostDate } from "./format";

describe("formatPostDate", () => {
  it("renders the day, month and year for an English reader", () => {
    expect(formatPostDate("2026-06-12")).toBe("12 June 2026");
  });

  it("keeps Latin digits", () => {
    const value = formatPostDate("2026-06-12");

    expect(value).toMatch(/[0-9]/);
    expect(value).toContain("2026");
  });

  it("leaves the stored ISO date untouched", () => {
    const date = "2026-06-12";

    formatPostDate(date);

    expect(date).toBe("2026-06-12");
    expect(Number.isNaN(Date.parse(`${date}T00:00:00Z`))).toBe(false);
  });
});

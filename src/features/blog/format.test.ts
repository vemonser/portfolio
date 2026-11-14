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

  it("renders Arabic-Indic digits for Arabic and Latin digits for English", () => {
    const arabic = formatPostDate("2026-06-12", "ar");
    const english = formatPostDate("2026-06-12", "en");

    expect(arabic).toMatch(/^[\u0600-\u06FF\s\u0660-\u0669]+$/);
    expect(arabic).toMatch(/[\u0660-\u0669]/);
    expect(arabic).not.toMatch(/[0-9]/);

    expect(english).toMatch(/[0-9]/);
    expect(english).not.toMatch(/[\u0660-\u0669]/);
    expect(english).toContain("2026");
  });

  it("leaves the stored ISO date untouched", () => {
    const date = "2026-06-12";

    formatPostDate(date, "ar");
    formatPostDate(date, "en");

    expect(date).toBe("2026-06-12");
    expect(Number.isNaN(Date.parse(`${date}T00:00:00Z`))).toBe(false);
  });
});

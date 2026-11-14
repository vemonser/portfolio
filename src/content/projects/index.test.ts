import { describe, expect, it } from "vitest";

import { getNextProject, getProject, getProjects } from "./index";

describe("project catalogue", () => {
  it("holds the same six slugs in both locales, in the same order", () => {
    const en = getProjects("en").map((project) => project.slug);
    const ar = getProjects("ar").map((project) => project.slug);

    expect(en).toHaveLength(6);
    expect(ar).toEqual(en);
  });

  it("falls back to English for an unknown locale", () => {
    expect(getProjects("fr")[0].title).toBe(getProjects("en")[0].title);
  });

  it("localizes the title", () => {
    expect(getProject("ar", "nimbus")?.title).not.toBe(
      getProject("en", "nimbus")?.title,
    );
  });

  it("advances along the catalogue", () => {
    const list = getProjects("en");
    expect(getNextProject("en", list[0].slug).slug).toBe(list[1].slug);
  });

  it("wraps the next-project chain", () => {
    const list = getProjects("en");
    const last = list[list.length - 1];
    expect(getNextProject("en", last.slug).slug).toBe(list[0].slug);
  });

  it("returns undefined for an unknown slug", () => {
    expect(getProject("en", "does-not-exist")).toBeUndefined();
  });
});

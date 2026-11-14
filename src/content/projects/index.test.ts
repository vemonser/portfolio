import { describe, expect, it } from "vitest";

import { getNextProject, getProject, getProjects } from "./index";

describe("project catalogue", () => {
  it("holds six projects in order", () => {
    const slugs = getProjects().map((project) => project.slug);

    expect(slugs).toHaveLength(4);
    expect(slugs).toEqual([
      "anom-creative",
      "fambam",
      "advrt",
      "al-ghaith",
    ]);
  });

  it("finds a project by slug", () => {
    expect(getProject("anom-creative")?.title).toBe("Anom Creative");
  });

  it("advances along the catalogue", () => {
    const list = getProjects();
    expect(getNextProject(list[0].slug).slug).toBe(list[1].slug);
  });

  it("wraps the next-project chain", () => {
    const list = getProjects();
    const last = list[list.length - 1];
    expect(getNextProject(last.slug).slug).toBe(list[0].slug);
  });

  it("returns undefined for an unknown slug", () => {
    expect(getProject("does-not-exist")).toBeUndefined();
  });
});

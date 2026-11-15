import { describe, expect, it } from "vitest";

import { CAPTURE_TARGETS } from "../../../scripts/capture-work.mjs";
import { projects } from "./projects";

describe("capture targets", () => {
  it("match the catalogue slug-for-slug and url-for-url", () => {
    expect(CAPTURE_TARGETS.map((t) => t.slug)).toEqual(
      projects.map((p) => p.slug),
    );
    for (const target of CAPTURE_TARGETS) {
      const project = projects.find((p) => p.slug === target.slug);
      expect(project?.url).toBe(target.url);
    }
  });
});

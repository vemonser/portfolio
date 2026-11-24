import { describe, expect, it } from "vitest";

import { HOME_COUNT, PROJECT_GRID } from "./home-layout";

describe("project grid", () => {
  it("shows four projects on Home", () => {
    expect(HOME_COUNT).toBe(4);
  });

  it("uses one shared grid class for both surfaces", () => {
    expect(PROJECT_GRID).toBe("project-grid");
  });
});

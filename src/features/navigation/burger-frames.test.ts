import { describe, expect, it } from "vitest";

import {
  BURGER_OPEN_FRAME,
  BURGER_REST_FRAME,
  burgerMotion,
} from "./burger-frames";

describe("burger motion", () => {
  it("stays at rest while the menu is closed", () => {
    expect(burgerMotion("closed")).toBe("rest");
  });

  it("plays open while the panel enters and holds the mark once open", () => {
    expect(burgerMotion("entering")).toBe("open");
    expect(burgerMotion("open")).toBe("open");
  });

  it("plays closed while the panel leaves", () => {
    expect(burgerMotion("closing")).toBe("close");
  });

  it("uses the authored rest and settle frames", () => {
    expect(BURGER_REST_FRAME).toBe(0);
    expect(BURGER_OPEN_FRAME).toBe(25);
  });
});

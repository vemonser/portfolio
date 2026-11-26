import { describe, expect, it } from "vitest";

import { ROLE_LABELS, roleFromDataset } from "./cursor-roles";

describe("cursor roles", () => {
  it("labels close as CLOSE", () => {
    expect(ROLE_LABELS.close).toBe("CLOSE");
  });

  it("maps explicit dataset roles", () => {
    expect(roleFromDataset("view")).toBe("view");
    expect(roleFromDataset("play")).toBe("play");
    expect(roleFromDataset("hello")).toBe("hello");
    expect(roleFromDataset("visit")).toBe("visit");
    expect(roleFromDataset("emphasis")).toBe("emphasis");
    expect(roleFromDataset("text")).toBe("text");
    expect(roleFromDataset("disabled")).toBe("disabled");
    expect(roleFromDataset("close")).toBe("close");
  });

  it("returns null for unknown or missing values", () => {
    expect(roleFromDataset(undefined)).toBeNull();
    expect(roleFromDataset("")).toBeNull();
    expect(roleFromDataset("link")).toBeNull();
    expect(roleFromDataset("default")).toBeNull();
    expect(roleFromDataset("nope")).toBeNull();
  });

  it("keeps the standard role labels", () => {
    expect(ROLE_LABELS.link).toBe("OPEN");
    expect(ROLE_LABELS.view).toBe("VIEW");
    expect(ROLE_LABELS.play).toBe("PLAY");
    expect(ROLE_LABELS.hello).toBe("HELLO");
    expect(ROLE_LABELS.visit).toBe("VISIT");
  });
});
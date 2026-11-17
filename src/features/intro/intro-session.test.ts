import { describe, expect, it } from "vitest";

import {
  INTRO_KEY,
  hasSeenIntro,
  introGateScript,
  markIntroSeen,
  shouldShowIntro,
} from "./intro-session";

function memoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));

  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

const blockedRead = {
  getItem: () => {
    throw new Error("storage is blocked");
  },
};

const blockedWrite = {
  setItem: () => {
    throw new Error("storage is blocked");
  },
};

describe("intro session gate", () => {
  it("is unseen when the session has no key", () => {
    expect(hasSeenIntro(memoryStorage())).toBe(false);
  });

  it("is seen after it is marked", () => {
    const storage = memoryStorage();
    markIntroSeen(storage);

    expect(storage.getItem(INTRO_KEY)).toBe("1");
    expect(hasSeenIntro(storage)).toBe(true);
  });

  it("does not show again once the session has seen it", () => {
    expect(shouldShowIntro(memoryStorage({ [INTRO_KEY]: "1" }), false)).toBe(
      false,
    );
  });

  it("shows on an unseen session when motion is allowed", () => {
    expect(shouldShowIntro(memoryStorage(), false)).toBe(true);
  });

  it("never shows when the visitor prefers reduced motion", () => {
    expect(shouldShowIntro(memoryStorage(), true)).toBe(false);
  });

  it("treats a blocked read as unseen rather than throwing", () => {
    expect(hasSeenIntro(blockedRead)).toBe(false);
  });

  it("swallows a blocked write", () => {
    expect(() => markIntroSeen(blockedWrite)).not.toThrow();
  });

  it("emits a pre-paint gate that respects the key and reduced motion", () => {
    const script = introGateScript();

    expect(script).toContain(INTRO_KEY);
    expect(script).toContain("prefers-reduced-motion");
    expect(script).toContain('dataset.intro="run"');
  });
});

import { describe, expect, it } from "vitest";

import { HOME_COUNT, HOME_LAYOUT } from "./home-layout";

/**
 * The Home sequence places cards with explicit column spans, and the section
 * asks for up to six projects. A layout shorter than that would cycle the
 * classes and put two cards in the same cells, so the shape is checked here
 * rather than discovered on the day a fifth project is added.
 */

type Placement = { start: number; span: number };

function placement(className: string): Placement {
  const span = Number(className.match(/col-span-(\d+)/)?.[1] ?? 14);
  const start = Number(className.match(/col-start-(\d+)/)?.[1] ?? 1);

  return { start, span };
}

describe("HOME_LAYOUT", () => {
  it("has a slot for every project the section shows", () => {
    expect(HOME_LAYOUT.length).toBeGreaterThanOrEqual(HOME_COUNT);
  });

  it("keeps every card inside the twelve-column grid", () => {
    for (const className of HOME_LAYOUT.slice(0, HOME_COUNT)) {
      const { start, span } = placement(className);

      expect(start, className).toBeGreaterThanOrEqual(1);
      expect(start + span - 1, className).toBeLessThanOrEqual(12);
    }
  });

  it("does not overlap the two cards that share a row", () => {
    for (let row = 0; row < HOME_COUNT / 2; row += 1) {
      const left = placement(HOME_LAYOUT[row * 2]);
      const right = placement(HOME_LAYOUT[row * 2 + 1]);
      const leftEnd = left.start + left.span - 1;
      const rightEnd = right.start + right.span - 1;

      const overlaps = left.start <= rightEnd && right.start <= leftEnd;
      expect(overlaps, `row ${row + 1}`).toBe(false);
    }
  });
});

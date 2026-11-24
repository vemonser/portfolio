import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";

import { projects } from "./projects";

const publicRoot = fileURLToPath(new URL("../../../public", import.meta.url));

describe("project media", () => {
  it("gives every project a media stream of the agreed shape", () => {
    for (const project of projects) {
      expect(Array.isArray(project.media)).toBe(true);

      for (const block of project.media) {
        if (block.kind === "browser") {
          expect(block.src).toMatch(/^\/work\/[a-z-]+\/[a-z0-9-]+\.webp$/);
          expect(block.alt.length).toBeGreaterThan(0);
        } else if (block.kind === "phones") {
          expect(block.srcs).toHaveLength(3);
          expect(block.alts).toHaveLength(3);
          for (const alt of block.alts) expect(alt.length).toBeGreaterThan(0);
        } else if (block.kind === "video") {
          expect(block.src).toMatch(/\.(webm|mp4)$/);
          expect(block.poster).toMatch(/\.webp$/);
        } else {
          throw new Error(`unknown media kind: ${JSON.stringify(block)}`);
        }
      }
    }
  });

  it("references only files that exist in public/", () => {
    const paths: string[] = [];
    for (const project of projects) {
      if (project.image) paths.push(project.image);
      if (project.imageHover) paths.push(project.imageHover);
      for (const block of project.media) {
        if (block.kind === "browser") paths.push(block.src);
        if (block.kind === "phones") paths.push(...block.srcs);
        if (block.kind === "video") paths.push(block.src, block.poster);
      }
    }
    for (const p of paths) {
      expect(existsSync(`${publicRoot}${p}`), `missing ${p}`).toBe(true);
    }
  });

  it("uses the hero as the card image and a second capture on hover", () => {
    for (const project of projects) {
      expect(project.image).toMatch(/\/hero\.webp$/);
      expect(project.imageHover).toBeTruthy();
      expect(project.imageHover).not.toBe(project.image);
    }
  });
});

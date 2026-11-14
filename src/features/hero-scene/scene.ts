import { createMercuryScene } from "./mercuryScene";
import type { HeroScene, HeroSceneOptions } from "./types";

export type { HeroScene, HeroSceneOptions };

/**
 * The hero scene: a fullscreen mercury surface with a live wave simulation and
 * the wordmark refracted through it. Everything is shading, so the frame costs
 * the same no matter how large the window is.
 *
 * Kept behind a single function so the page only knows this interface.
 */
export function createHeroScene(options: HeroSceneOptions): HeroScene {
  return createMercuryScene(options);
}

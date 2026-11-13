import { createSurfaceScene } from "./surface";
import type { HeroScene, HeroSceneOptions } from "./types";

export type { HeroScene, HeroSceneOptions };

/**
 * The hero scene: a noise-displaced plane that fills the frame, so the hero
 * has no silhouette at all — just a molten surface catching the light.
 *
 * Kept behind a single function so the page only knows this interface.
 */
export function createHeroScene(options: HeroSceneOptions): HeroScene {
  return createSurfaceScene(options);
}

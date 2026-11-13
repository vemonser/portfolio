import { createBlobScene } from "./blob";
import { createMetaballScene } from "./metaballs";
import { createSurfaceScene } from "./surface";
import type { HeroLook, HeroScene, HeroSceneOptions } from "./types";

export type { HeroLook, HeroScene, HeroSceneOptions };

/**
 * Three takes on the same idea, behind one interface so they can be compared
 * side by side with `?look=surface|blob|metaballs`.
 *
 *  surface  — a displaced plane that fills the frame. No silhouette at all:
 *             the reference's "molten sheet". Cheapest.
 *  blob     — one displaced sphere: a readable mass, but a mass nonetheless.
 *  metaballs— raymarched SDF: blobs that genuinely merge. Exact silhouette,
 *             heaviest by far.
 */
export function createHeroScene(
  options: HeroSceneOptions & { look?: HeroLook },
): HeroScene {
  const { look = "surface", ...rest } = options;

  if (look === "metaballs") return createMetaballScene(rest);
  if (look === "blob") return createBlobScene(rest);
  return createSurfaceScene(rest);
}

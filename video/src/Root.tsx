import { Composition } from "remotion";

import { ProjectFilm, PROJECT_FILM_DURATION } from "./ProjectFilm";
import { Showreel } from "./Showreel";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="Showreel"
        component={Showreel}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ProjectFilmAnom"
        component={ProjectFilm}
        durationInFrames={PROJECT_FILM_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

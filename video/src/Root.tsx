import { Composition } from "remotion";

import { Showreel } from "./Showreel";

export const RemotionRoot = () => {
  return (
    <Composition
      id="Showreel"
      component={Showreel}
      durationInFrames={300}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};

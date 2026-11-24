import { AbsoluteFill } from "remotion";

type Props = {
  accent: string;
};

/**
 * A near-black field with one soft accent bloom. No grain, no grid, no
 * vignette stacking — the screenshot has to stay the subject.
 */
export function Backdrop({ accent }: Props) {
  return (
    <AbsoluteFill style={{ backgroundColor: "#080807" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(105% 78% at 50% -6%, ${accent}30 0%, ${accent}12 34%, transparent 66%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(70% 55% at 50% 112%, rgba(255,255,255,0.045) 0%, transparent 65%)",
        }}
      />
    </AbsoluteFill>
  );
}

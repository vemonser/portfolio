import { AbsoluteFill } from "remotion";

import { MONO, SANS } from "./Fonts";

type Props = {
  title: string;
  detail: string;
};

/** Shown in Studio or a render when the capture step has not run yet. */
export function ErrorCard({ title, detail }: Props) {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#080807",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
      }}
    >
      <div
        style={{
          fontFamily: MONO,
          fontSize: 14,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "#b4472a",
        }}
      >
        Showcase
      </div>
      <div
        style={{
          fontFamily: SANS,
          fontSize: 42,
          fontWeight: 500,
          letterSpacing: "-0.03em",
          color: "#f5f1e8",
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontSize: 16,
          color: "rgba(245,241,232,0.55)",
          border: "1px solid rgba(245,241,232,0.16)",
          borderRadius: 8,
          padding: "10px 16px",
        }}
      >
        {detail}
      </div>
    </AbsoluteFill>
  );
}

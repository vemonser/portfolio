import type { ReactNode } from "react";

type Props = {
  screenWidth: number;
  screenHeight: number;
  children: ReactNode;
};

const BEZEL = 12;

/** iPhone hardware shell. Screen dimensions are the real content area. */
export function PhoneFrame({ screenWidth, screenHeight, children }: Props) {
  const radius = Math.round(screenWidth * 0.088);
  const outerRadius = radius + BEZEL;
  const islandWidth = Math.round(screenWidth * 0.245);

  return (
    <div
      style={{
        width: screenWidth + BEZEL * 2,
        height: screenHeight + BEZEL * 2,
        padding: BEZEL,
        borderRadius: outerRadius,
        position: "relative",
        background:
          "linear-gradient(148deg, #3a3a3a 0%, #171717 28%, #050505 70%, #232323 100%)",
        boxShadow:
          "0 70px 140px -55px rgba(0,0,0,0.98), 0 26px 60px -40px rgba(0,0,0,0.9), inset 0 0 0 1px rgba(255,255,255,0.14), inset 0 1px 1px rgba(255,255,255,0.18)",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: -3,
          top: 168,
          width: 3,
          height: 34,
          borderRadius: "2px 0 0 2px",
          background: "linear-gradient(180deg, #2b2b2b, #101010)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: -3,
          top: 216,
          width: 3,
          height: 58,
          borderRadius: "2px 0 0 2px",
          background: "linear-gradient(180deg, #2b2b2b, #101010)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: -3,
          top: 196,
          width: 3,
          height: 84,
          borderRadius: "0 2px 2px 0",
          background: "linear-gradient(180deg, #2b2b2b, #101010)",
        }}
      />

      <div
        style={{
          width: screenWidth,
          height: screenHeight,
          borderRadius: radius,
          overflow: "hidden",
          position: "relative",
          backgroundColor: "#0b0b0a",
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.07)",
        }}
      >
        {children}

        <div
          style={{
            position: "absolute",
            top: 18,
            left: "50%",
            transform: "translateX(-50%)",
            width: islandWidth,
            height: 26,
            borderRadius: 999,
            backgroundColor: "#000",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            paddingRight: 9,
            zIndex: 20,
            boxShadow: "0 0 0 1px rgba(255,255,255,0.07)",
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: 999,
              background:
                "radial-gradient(circle at 35% 30%, #22304a 0%, #0a0d14 55%, #000 100%)",
              opacity: 0.9,
            }}
          />
        </div>
      </div>
    </div>
  );
}

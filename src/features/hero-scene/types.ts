import type { CompressionZone } from "./compression";

export type HeroScene = {
  setPointer(x: number, y: number): void;
  setHover(intensity: number): void;
  pulse(): void;
  setScroll(progress: number): void;
  /**
   * The active compression rectangle, or null to release it. The scene owns
   * the smoothing; callers may set this as often as the input changes.
   */
  setCompressionZone(zone: CompressionZone | null): void;
  start(): void;
  stop(): void;
  dispose(): void;
};

export type HeroSceneOptions = {
  canvas: HTMLCanvasElement;
  /** Seconds of drift to fast-forward to, and freeze there. Reproducible stills. */
  initialTime?: number;
  onFirstFrame?: () => void;
  onContextLost?: () => void;
};

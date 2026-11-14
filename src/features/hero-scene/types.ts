export type HeroScene = {
  setPointer(x: number, y: number): void;
  setHover(intensity: number): void;
  pulse(): void;
  setScroll(progress: number): void;
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

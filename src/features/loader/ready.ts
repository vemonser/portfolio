import { HERO_READY_EVENT, isHeroReady } from "@/features/hero/scene-ready";

const SAFETY_MS = 8000;
const IMAGE_WAIT_MS = 2000;

const sleep = (ms: number) =>
  new Promise<void>((resolve) => window.setTimeout(resolve, ms));

function decodeImage(image: HTMLImageElement): Promise<void> {
  if (image.complete && image.naturalWidth > 0) {
    return image.decode().catch(() => {});
  }
  return new Promise<void>((resolve) => {
    image.addEventListener("load", () => resolve(), { once: true });
    image.addEventListener("error", () => resolve(), { once: true });
  });
}

function waitForImages(): Promise<void> {
  const critical = [
    ...document.querySelectorAll<HTMLImageElement>("main img"),
  ].filter((image) => {
    const rect = image.getBoundingClientRect();
    const eager = image.loading !== "lazy";
    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    return eager || inView;
  });

  return Promise.race([
    Promise.all(critical.map(decodeImage)).then(() => {}),
    sleep(IMAGE_WAIT_MS),
  ]);
}

function waitForHero(): { promise: Promise<void>; dispose: () => void } {
  if (isHeroReady()) return { promise: Promise.resolve(), dispose() {} };

  let handler: () => void = () => {};
  const promise = new Promise<void>((resolve) => {
    handler = () => resolve();
    window.addEventListener(HERO_READY_EVENT, handler, { once: true });
  });
  return {
    promise,
    dispose: () => window.removeEventListener(HERO_READY_EVENT, handler),
  };
}

export function waitForLoaderReady({ isHome }: { isHome: boolean }) {
  const hero = isHome
    ? waitForHero()
    : { promise: Promise.resolve(), dispose() {} };

  let safetyId = 0;
  const safety = new Promise<void>((resolve) => {
    safetyId = window.setTimeout(resolve, SAFETY_MS);
  });

  const all = Promise.all([
    document.fonts?.ready ?? Promise.resolve(),
    hero.promise,
    waitForImages(),
  ])
    .then(() => {})
    .catch(() => {});

  return {
    ready: Promise.race([all, safety]),
    dispose() {
      window.clearTimeout(safetyId);
      hero.dispose();
    },
  };
}
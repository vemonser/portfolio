import type Lenis from "lenis";

let instance: Lenis | null = null;

export function setLenis(l: Lenis | null) {
  instance = l;
}

export function getLenis(): Lenis | null {
  return instance;
}

export function stopLenis() {
  instance?.stop();
}

export function startLenis() {
  instance?.start();
}

export function scrollToTopLenis() {
  instance?.scrollTo(0, { immediate: true, force: true });
}

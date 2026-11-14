type Listener = (ready: boolean) => void;

let ready = false;
const listeners = new Set<Listener>();

/**
 * One flag for "the first real frame (or the poster fallback) is on screen".
 * The wordmark entrance waits for it, without coupling the title to the WebGL
 * module — HeroStage only has to announce.
 */
export function setHeroReady(value: boolean): void {
  if (ready === value) return;
  ready = value;
  for (const listener of listeners) listener(value);
}

export function subscribeHeroReady(listener: Listener): () => void {
  listeners.add(listener);
  listener(ready);

  return () => {
    listeners.delete(listener);
  };
}

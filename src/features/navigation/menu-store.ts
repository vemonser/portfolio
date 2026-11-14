/**
 * A module-level store rather than a context: the header owns the menu, and the
 * hero scene lives on another branch of the tree. Subscribing keeps the scene
 * from re-rendering the whole page when the menu toggles — it only needs to
 * stop and start.
 */
type Listener = (open: boolean) => void;

let open = false;
const listeners = new Set<Listener>();

export function setMenuOpen(value: boolean): void {
  if (open === value) return;

  open = value;
  for (const listener of listeners) listener(value);
}

export function isMenuOpen(): boolean {
  return open;
}

export function subscribeMenu(listener: Listener): () => void {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

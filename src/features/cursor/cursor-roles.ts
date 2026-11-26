/**
 * Cursor role resolution: pure mapping + DOM hit-testing.
 *
 * Kept free of React so the role rules can be unit-tested without a DOM and
 * reused by both the cursor component and any future caller.
 */

export type CursorRole =
  | "default"
  | "link"
  | "view"
  | "play"
  | "hello"
  | "visit"
  | "emphasis"
  | "text"
  | "disabled"
  | "close";

export const ROLE_LABELS: Partial<Record<CursorRole, string>> = {
  link: "OPEN",
  view: "VIEW",
  play: "PLAY",
  hello: "HELLO",
  visit: "VISIT",
  close: "CLOSE",
};

/**
 * Map an explicit `data-cursor` attribute value to a role. Returns null when
 * the value is not a recognised explicit role, so callers can fall through to
 * element-based heuristics.
 */
export function roleFromDataset(value: string | undefined): CursorRole | null {
  if (!value) return null;
  switch (value) {
    case "view":
      return "view";
    case "play":
      return "play";
    case "hello":
      return "hello";
    case "visit":
      return "visit";
    case "emphasis":
      return "emphasis";
    case "text":
      return "text";
    case "disabled":
      return "disabled";
    case "close":
      return "close";
    default:
      return null;
  }
}

/**
 * Resolve the cursor role for the element under the pointer. `menuOpen`
 * controls whether the menu's close control reports `close`.
 */
export function resolveCursorRole(
  node: Element,
  menuOpen: boolean,
): CursorRole {
  // An unavailable control tells the truth before any decorative role.
  if (node.closest(":disabled, [aria-disabled='true']")) return "disabled";

  // The menu's close control only becomes a close target while the menu is open.
  if (menuOpen && node.closest(".nav-close")) return "close";

  const tagged = node.closest<HTMLElement>("[data-cursor]:not(html)");
  if (tagged) {
    const explicit = roleFromDataset(tagged.dataset.cursor);
    if (explicit) return explicit;
  }

  const anchor = node.closest<HTMLAnchorElement>("a[href]");
  if (anchor) {
    const href = anchor.getAttribute("href") ?? "";
    if (href.startsWith("mailto:") || href.startsWith("tel:")) return "hello";
    if (anchor.target === "_blank") return "visit";
  }

  if (node.closest("textarea, select, [contenteditable='true']")) {
    return "text";
  }

  const input = node.closest("input");
  if (input) {
    const type = (input as HTMLInputElement).type;
    if (
      type === "range" ||
      type === "checkbox" ||
      type === "radio" ||
      type === "file" ||
      type === "color"
    ) {
      return "link";
    }
    return "text";
  }

  if (node.closest("a, button, [role='button'], label[for]")) return "link";
  return "default";
}
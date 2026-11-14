import type { MDXComponents } from "mdx/types";

/**
 * Blog prose is styled by `.prose-blog` in globals.css, so MDX needs no custom
 * component map — one place decides how headings, lists and links look.
 */
export function useMDXComponents(): MDXComponents {
  return {};
}

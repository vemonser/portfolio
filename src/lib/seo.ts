import type { Metadata } from "next";

import { siteName } from "./site";

type PageInput = {
  /** The page's own name, without the site suffix. */
  title: string;
  description: string;
  /** Route path, used for the canonical and the Open Graph URL. */
  path: string;
};

const OG_IMAGE = {
  url: "/opengraph-image.jpg",
  width: 1200,
  height: 630,
  alt: "Abdelrhman — software developer. The name set over the liquid-chrome hero.",
};

/**
 * One metadata shape for every route: an absolute title (no template
 * surprises), a canonical URL, and matching Open Graph / Twitter fields. The
 * image is named explicitly because a page that sets `openGraph` replaces the
 * inherited object, including the file-convention image.
 */
export function pageMetadata({ title, description, path }: PageInput): Metadata {
  const socialTitle = `${title} — ${siteName}`;

  return {
    title: { absolute: socialTitle },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      title: socialTitle,
      description,
      url: path,
      siteName,
      locale: "en_US",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

/** Home keeps the name first; every other route leads with its own title. */
export function homeMetadata(description: string): Metadata {
  const title = `${siteName} — Software developer`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      title,
      description,
      url: "/",
      siteName,
      locale: "en_US",
      images: [OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

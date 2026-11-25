import type { Metadata } from "next";

import { siteName } from "./site";

type PageInput = {
  /** The page's own name, without the site suffix. */
  title: string;
  description: string;
  /** Route path, used for the canonical and the Open Graph URL. */
  path: string;
  /** Custom social image; null lets a colocated opengraph-image route win. */
  image?: string | null;
  imageAlt?: string;
  type?: "website" | "article";
  publishedTime?: string;
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
export function pageMetadata({
  title,
  description,
  path,
  image,
  imageAlt,
  type = "website",
  publishedTime,
}: PageInput): Metadata {
  const socialTitle = `${title} — ${siteName}`;
  const images =
    image === null
      ? undefined
      : image
        ? [{ url: image, alt: imageAlt ?? `${title} — ${siteName}` }]
        : [OG_IMAGE];
  const rss = {
    url: "/feed.xml",
    title: `${siteName} — Writing`,
  };

  return {
    title: { absolute: socialTitle },
    description,
    alternates: {
      canonical: path,
      types: { "application/rss+xml": [rss] },
    },
    openGraph: {
      type,
      title: socialTitle,
      description,
      url: path,
      siteName,
      locale: "en_US",
      ...(images ? { images } : {}),
      ...(publishedTime ? { publishedTime } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      ...(images ? { images: images.map((entry) => entry.url) } : {}),
    },
  };
}

/** Home keeps the name first; every other route leads with its own title. */
export function homeMetadata(description: string): Metadata {
  const title = `${siteName} — Software developer`;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: "/",
      types: {
        "application/rss+xml": [
          { url: "/feed.xml", title: `${siteName} — Writing` },
        ],
      },
    },
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

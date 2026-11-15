export type ProjectCover = {
  from: string;
  to: string;
};

export type ProjectSection = {
  heading: string;
  body: string;
};

export type ProjectMediaBlock =
  | { kind: "browser"; src: string; alt: string; caption?: string }
  | { kind: "phones"; srcs: string[]; alts: string[]; caption?: string }
  | { kind: "video"; src: string; poster: string; caption?: string };

export type Project = {
  slug: string;
  title: string;
  tagline: string;
  role: string;
  year: string;
  /** Empty when the owner has not published a stack for the project. */
  stack: string[];
  /** Live site, when there is one. */
  url?: string;
  /** Real capture of the live site, served from /public/work. */
  image?: string;
  /** Second capture, revealed on card hover. */
  imageHover?: string;
  /** Case-study media stream, in reading order. */
  media: ProjectMediaBlock[];
  /** Fallback duotone pair, used only when there is no image. */
  cover: ProjectCover;
  coverAlt: ProjectCover;
  sections: ProjectSection[];
};

export type ProjectCover = {
  from: string;
  to: string;
};

export type ProjectSection = {
  heading: string;
  body: string;
};

export type Project = {
  slug: string;
  title: string;
  tagline: string;
  role: string;
  year: string;
  stack: string[];
  /** Two duotone pairs: the card swaps one for the other on hover. */
  cover: ProjectCover;
  coverAlt: ProjectCover;
  sections: ProjectSection[];
};

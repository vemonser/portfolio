import type { Project } from "./types";

/**
 * Real client work. Each entry links to the live site and uses a capture of it
 * as its media; the description is the site's own published copy, not an
 * invented case study. Sections can grow as the owner writes them.
 */
export const projects: Project[] = [
  {
    slug: "anom-creative",
    title: "Anom Creative",
    tagline: "Brand systems that think, move and evolve.",
    role: "Design & Development",
    year: "2026",
    stack: [],
    url: "https://anomcreative.com/",
    image: "/work/anom-creative.webp",
    cover: { from: "#7a2a12", to: "#0b0b0a" },
    coverAlt: { from: "#0b0b0a", to: "#7a2a12" },
    sections: [
      {
        heading: "Overview",
        body: "A multidisciplinary creative studio and strategic branding partner in Cairo — brand strategy, identity systems, motion and digital. Rooted in Cairo, built for the world.",
      },
    ],
  },
  {
    slug: "fambam",
    title: "FamBam",
    tagline: "We build bold brands for disruptive companies.",
    role: "Design & Development",
    year: "2026",
    stack: [],
    url: "https://fambam.vemonser7.workers.dev/",
    image: "/work/fambam.webp",
    cover: { from: "#ff5a1f", to: "#f5f1e8" },
    coverAlt: { from: "#f5f1e8", to: "#ff5a1f" },
    sections: [
      {
        heading: "Overview",
        body: "Brand strategy, identity and activation for ambitious companies across Egypt, Saudi Arabia and the UAE. A studio specialised in strategy, identity and brand culture.",
      },
    ],
  },
  {
    slug: "advrt",
    title: "Advrt",
    tagline: "Where innovation meets impact in advertising.",
    role: "Design & Development",
    year: "2026",
    stack: [],
    url: "https://advrt.vercel.app/",
    image: "/work/advrt.webp",
    cover: { from: "#2b2b2b", to: "#0b0b0a" },
    coverAlt: { from: "#0b0b0a", to: "#2b2b2b" },
    sections: [
      {
        heading: "Overview",
        body: "Advertising, branding, signage and fit-out for brands that want to transform. Photography, visual stories and events that leave a lasting impression.",
      },
    ],
  },
  {
    slug: "al-ghaith",
    title: "Al Ghaith",
    tagline: "Saudi leaders in central cooling and air-conditioning.",
    role: "Design & Development",
    year: "2026",
    stack: [],
    url: "https://alghaithac.com/",
    image: "/work/al-ghaith.webp",
    cover: { from: "#1b3f9e", to: "#f5f1e8" },
    coverAlt: { from: "#f5f1e8", to: "#1b3f9e" },
    sections: [
      {
        heading: "Overview",
        body: "A Saudi company working in central cooling, maintenance and operation, with more than twenty years of experience and over five hundred client companies across the Kingdom.",
      },
    ],
  },
];

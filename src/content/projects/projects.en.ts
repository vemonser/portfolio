import type { Project } from "./types";

/**
 * Placeholder catalogue. Every string here is real content shape, not lorem —
 * the user replaces names and copy with the real projects. Order defines both
 * the home grid and the "next project" chain.
 */
export const projects: Project[] = [
  {
    slug: "nimbus",
    title: "Nimbus",
    tagline: "A calm operating layer for a noisy SaaS stack.",
    role: "Design & Development",
    year: "2026",
    stack: ["Next.js", "TypeScript", "PostgreSQL"],
    cover: { from: "#2f4a3c", to: "#0b0b0a" },
    coverAlt: { from: "#0b0b0a", to: "#2f4a3c" },
    sections: [
      {
        heading: "Overview",
        body: "Nimbus needed one surface where operators could read the health of six products without learning six dashboards.",
      },
      {
        heading: "Challenge",
        body: "The old stack scattered the same signal across a dozen screens, and every team had its own version of the truth.",
      },
      {
        heading: "Outcome",
        body: "One language for alerts, one timeline, one place to act. Tickets asking “where do I see this?” dropped by half in the first month.",
      },
    ],
  },
  {
    slug: "forge",
    title: "Forge",
    tagline: "Documentation that behaves like the tool it documents.",
    role: "Design & Development",
    year: "2026",
    stack: ["Next.js", "MDX", "GSAP"],
    cover: { from: "#8a7f72", to: "#171614" },
    coverAlt: { from: "#171614", to: "#8a7f72" },
    sections: [
      {
        heading: "Overview",
        body: "A developer-tool site where the docs are the product: searchable, copyable, and fast enough to feel local.",
      },
      {
        heading: "Challenge",
        body: "The product changes weekly. The site had to stay honest without a writer rewriting it every release.",
      },
      {
        heading: "Outcome",
        body: "Content lives beside the code it explains, and every example is executable. The changelog became the most-read page.",
      },
    ],
  },
  {
    slug: "atlas",
    title: "Atlas",
    tagline: "A bilingual travel platform where the map is the navigation.",
    role: "Interaction & Development",
    year: "2025",
    stack: ["Next.js", "MapLibre", "next-intl"],
    cover: { from: "#f5f1e8", to: "#8a7f72" },
    coverAlt: { from: "#8a7f72", to: "#f5f1e8" },
    sections: [
      {
        heading: "Overview",
        body: "Atlas lets travellers browse a country by moving across it, with itineraries that assemble as the map moves.",
      },
      {
        heading: "Challenge",
        body: "Two languages, two reading directions, one map. The interface had to mirror without ever flipping geography.",
      },
      {
        heading: "Outcome",
        body: "The Arabic and English experiences feel native to each other, and time-on-map doubled after the rewrite.",
      },
    ],
  },
  {
    slug: "souk",
    title: "Souk",
    tagline: "An Arabic-first marketplace that reads like a magazine, not a grid.",
    role: "Design & Development",
    year: "2025",
    stack: ["Next.js", "Shopify", "Tailwind"],
    cover: { from: "#c6f035", to: "#2f4a3c" },
    coverAlt: { from: "#2f4a3c", to: "#c6f035" },
    sections: [
      {
        heading: "Overview",
        body: "A storefront for independent makers where the editorial voice carries the shopping experience.",
      },
      {
        heading: "Challenge",
        body: "Marketplace templates flatten everything into cards. Souk needed hierarchy, story and trust on the same screen as price.",
      },
      {
        heading: "Outcome",
        body: "Product pages converted twice as well as the previous template, with no extra ad spend.",
      },
    ],
  },
  {
    slug: "pulse",
    title: "Pulse",
    tagline: "A listening room for a sound studio's catalogue.",
    role: "Interaction & Development",
    year: "2024",
    stack: ["React", "Three.js", "Web Audio"],
    cover: { from: "#171614", to: "#2f4a3c" },
    coverAlt: { from: "#2f4a3c", to: "#171614" },
    sections: [
      {
        heading: "Overview",
        body: "Pulse turns a studio archive into a room you can stand in: sound reacts to where you look, not to a playlist.",
      },
      {
        heading: "Challenge",
        body: "Audio had to start only when a visitor asks for it, and the scene had to stay smooth on a phone.",
      },
      {
        heading: "Outcome",
        body: "One draw call per layer and a hard cap on particles kept it at sixty frames while the visualiser stayed honest to the mix.",
      },
    ],
  },
  {
    slug: "terra",
    title: "Terra",
    tagline: "Climate data made legible for people who are not scientists.",
    role: "Interface Design",
    year: "2024",
    stack: ["Next.js", "D3", "Mapbox"],
    cover: { from: "#8a7f72", to: "#0b0b0a" },
    coverAlt: { from: "#0b0b0a", to: "#8a7f72" },
    sections: [
      {
        heading: "Overview",
        body: "A public dashboard that turns regional climate projections into a single readable sentence per district.",
      },
      {
        heading: "Challenge",
        body: "The dataset was honest but dense. Every extra control made the answer harder to find.",
      },
      {
        heading: "Outcome",
        body: "The final screen has one map, one sentence and one comparison. Journalists quoted it directly in three countries.",
      },
    ],
  },
];

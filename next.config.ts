import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const withMDX = createMDX({});

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],

  // Turbopack's dev filesystem cache has been serving stale compiled CSS after
  // edits to globals.css, which silently undoes style changes. Not worth the
  // confusion for the few hundred ms it saves.
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },

  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },

  /*
   * The site used to be bilingual and every URL carried a locale. Those URLs
   * still exist in the wild, so they permanently point at the single-language
   * paths instead of 404ing.
   */
  async redirects() {
    return [
      { source: "/en", destination: "/", permanent: true },
      { source: "/en/:path*", destination: "/:path*", permanent: true },
      { source: "/ar", destination: "/", permanent: true },
      { source: "/ar/:path*", destination: "/:path*", permanent: true },
    ];
  },
};

export default withMDX(nextConfig);

import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
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

  // Arabic is the default locale, so the bare origin has no page of its own.
  // A config-level redirect is served statically — no proxy/middleware hop.
  async redirects() {
    return [{ source: "/", destination: "/ar", permanent: false }];
  },
};

export default withNextIntl(withMDX(nextConfig));

import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
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

export default withNextIntl(nextConfig);

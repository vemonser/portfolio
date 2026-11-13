import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "always",
  // The redirect in next.config.ts decides the entry locale, so browser
  // language detection would only fight it.
  localeDetection: false,
});

export type Locale = (typeof routing.locales)[number];

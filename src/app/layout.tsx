import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { copy } from "@/content/copy";
import ContactChapter from "@/features/contact-cta/ContactChapter";
import ContactCta from "@/features/contact-cta/ContactCta";
import SiteFooter from "@/features/footer/SiteFooter";
import SiteHeader from "@/features/navigation/SiteHeader";
import { buildNavLinks } from "@/features/navigation/nav";
import SmoothScroll from "@/features/scroll/SmoothScroll";
import "./globals.css";

/*
 * Fonts are downloaded at build time and self-hosted: no request ever leaves
 * for fonts.gstatic.com at runtime. Inter paints the wordmark and is preloaded;
 * JetBrains Mono carries labels and the clock.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});

const fontVariables = [inter.variable, jetbrainsMono.variable].join(" ");

export const metadata: Metadata = {
  title: copy.meta.title,
  description: copy.meta.description,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const links = buildNavLinks(copy.nav);

  return (
    <html
      lang="en"
      dir="ltr"
      className={fontVariables}
      suppressHydrationWarning
    >
      <body className="min-h-dvh bg-black font-body text-bone antialiased">
        {/*
          Arms the reveal CSS before the first paint. The React warning about
          script tags is dev-only: this runs during HTML parse on every real
          load, and no-JS visitors never get the hidden state.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: 'document.documentElement.dataset.js = "true"',
          }}
        />
        <SmoothScroll />
        <SiteHeader
          brand={copy.meta.title}
          homeHref="/"
          links={links}
          labels={{
            open: copy.nav.open,
            close: copy.nav.close,
            navigation: copy.nav.navigation,
          }}
        />
        {children}
        <ContactChapter>
          <ContactCta />
        </ContactChapter>
        <div className="grain" aria-hidden="true" />
        <SiteFooter
          labels={{
            navigation: copy.footer.navigation,
            edition: copy.footer.edition,
            localTime: copy.footer.localTime,
          }}
          links={links}
        />
      </body>
    </html>
  );
}

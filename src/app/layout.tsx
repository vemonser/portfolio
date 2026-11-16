import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";

import { copy } from "@/content/copy";
import { socials } from "@/content/socials";
import ContactChapter from "@/features/contact-cta/ContactChapter";
import ContactCta from "@/features/contact-cta/ContactCta";
import Cursor from "@/features/cursor/Cursor";
import SiteFooter from "@/features/footer/SiteFooter";
import SiteHeader from "@/features/navigation/SiteHeader";
import { buildNavLinks } from "@/features/navigation/nav";
import SmoothScroll from "@/features/scroll/SmoothScroll";
import { siteName, siteUrl } from "@/lib/site";
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
  metadataBase: new URL(siteUrl()),
  title: `${siteName} — Software developer`,
  description: copy.meta.description,
  applicationName: siteName,
  authors: [{ name: siteName }],
  creator: siteName,
  openGraph: {
    type: "website",
    siteName,
    locale: "en_US",
    url: "/",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const links = buildNavLinks(copy.nav);
  // Only destinations that exist. An empty profile is not rendered at all.
  const liveSocials = socials.filter((social) => social.href);

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
        <Cursor />
        <SiteHeader
          brand={copy.meta.title}
          homeHref="/"
          links={links}
          labels={{
            open: copy.nav.open,
            close: copy.nav.close,
            navigation: copy.nav.navigation,
            socials: copy.footer.socials,
          }}
          socials={liveSocials}
        />
        {children}
        <ContactChapter>
          <ContactCta />
        </ContactChapter>
        <div className="grain" aria-hidden="true" />
        <SiteFooter
          labels={{
            navigation: copy.footer.navigation,
            socials: copy.footer.socials,
            edition: copy.footer.edition,
            localTime: copy.footer.localTime,
          }}
          links={links}
          socials={liveSocials}
        />
      </body>
    </html>
  );
}

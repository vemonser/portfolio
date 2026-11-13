import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Fraunces,
  IBM_Plex_Sans_Arabic,
  Inter,
  JetBrains_Mono,
} from "next/font/google";

import { routing } from "@/i18n/routing";
import "../globals.css";

/*
 * Fonts are downloaded at build time and self-hosted: no request ever leaves
 * for fonts.gstatic.com at runtime. Only the two display faces are preloaded
 * — they paint the largest text on the page. The rest use `swap` and
 * metric-adjusted fallbacks so a late arrival cannot shift layout.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  preload: true,
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: false,
});

const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});

const fontVariables = [
  fraunces.variable,
  inter.variable,
  plexArabic.variable,
  jetbrainsMono.variable,
].join(" ");

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Pick<Props, "params">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={fontVariables}
    >
      {/*
        No <NextIntlClientProvider>: every translated string on this page is
        rendered on the server, so shipping the message catalog and the
        use-intl client runtime would be dead weight in the hero budget.
        Add the provider when the first *client* component needs t().
      */}
      <body className="min-h-dvh bg-black font-body text-bone antialiased">
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  IBM_Plex_Sans_Arabic,
  Inter,
  JetBrains_Mono,
} from "next/font/google";

import SiteHeader from "@/features/navigation/SiteHeader";
import { buildNavLinks, localizedHref } from "@/features/navigation/nav";
import ContactCta from "@/features/contact-cta/ContactCta";
import SiteFooter from "@/features/footer/SiteFooter";
import { routing } from "@/i18n/routing";
import "../globals.css";

/*
 * Fonts are downloaded at build time and self-hosted: no request ever leaves
 * for fonts.gstatic.com at runtime. Inter paints the wordmark on Latin pages
 * and is preloaded; the rest use `swap` plus metric-adjusted fallbacks so a
 * late arrival cannot shift layout.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  preload: true,
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

  /*
   * Every nav string is resolved here, on the server. The client header gets
   * values, not a message catalog, so the page still ships no i18n runtime.
   */
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const tMeta = await getTranslations({ locale, namespace: "meta" });
  const links = buildNavLinks(locale, {
    home: tNav("home"),
    work: tNav("work"),
    about: tNav("about"),
    contact: tNav("contact"),
  });
  const otherLocaleCode =
    routing.locales.find((candidate) => candidate !== locale) ??
    routing.defaultLocale;
  const tFooter = await getTranslations({ locale, namespace: "footer" });

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
        {/*
          `js` is what arms the reveal animations: without it the CSS keeps
          every Reveal element visible, so a no-JS visitor loses motion, not
          content.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: 'document.documentElement.classList.add("js")',
          }}
        />
        <SiteHeader
          brand={tMeta("title")}
          homeHref={localizedHref(locale, "/")}
          links={links}
          labels={{
            open: tNav("open"),
            close: tNav("close"),
            navigation: tNav("navigation"),
            language: tNav("language"),
          }}
          otherLocale={{
            code: otherLocaleCode,
            label: tNav(otherLocaleCode),
          }}
        />
        {children}
        <ContactCta locale={locale} />
        <SiteFooter
          labels={{
            navigation: tFooter("navigation"),
            socials: tFooter("socials"),
            edition: tFooter("edition"),
            localTime: tFooter("localTime"),
            instagram: tFooter("instagram"),
            twitter: tFooter("twitter"),
            linkedin: tFooter("linkedin"),
          }}
          links={links}
          socials={[
            { key: "instagram", href: "#" },
            { key: "twitter", href: "#" },
            { key: "linkedin", href: "#" },
          ]}
        />
      </body>
    </html>
  );
}

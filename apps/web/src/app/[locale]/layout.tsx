import type { Metadata } from "next";
import { Cormorant_Garamond, Geist, Great_Vibes, Source_Serif_4 } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AppProviders } from "@ceylonweddings/web";
import { isLocale, locales } from "@ceylonweddings/i18n";
import { AppChrome } from "../../components/app-chrome";
import "../globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const serif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-serif-mood",
});
const script = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
});

export const metadata: Metadata = {
  title: "Ceylon Weddings",
  description: "Plan a Sri Lankan wedding in one place",
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${geist.variable} ${display.variable} ${serif.variable} ${script.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen font-sans">
        <AppProviders>
          <NextIntlClientProvider messages={messages}>
            <AppChrome>{children}</AppChrome>
          </NextIntlClientProvider>
        </AppProviders>
      </body>
    </html>
  );
}

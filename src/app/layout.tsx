import type { Metadata } from "next";
import localFont from "next/font/local";

import { starterConfig } from "../../starter.config";
import AppShell from "@/components/app-shell";
import StructuredData, { siteStructuredData } from "@/components/structured-data";
import { enabledFeatureLabels } from "@/lib/features";
import "./globals.css";

const bodyFont = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-ui",
});

const monoFont = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
});

const enabledExtras = enabledFeatureLabels();
const extrasCopy = enabledExtras.length ? `, plus ${enabledExtras.join(", ")}` : "";
const socialImageUrl = "https://al-furqan.app/opengraph-image?v=20260811-2";

export const metadata: Metadata = {
  metadataBase: new URL("https://al-furqan.app"),
  applicationName: starterConfig.app.name,
  title: {
    default: "Al-Furqan — Quran & Sunnah Companion",
    template: "%s · Al-Furqan",
  },
  description: `A free, ad-free Quran and Sunnah companion with Tajweed, translations, Tafsir and audio${extrasCopy}.`,
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "The Noble Quran, without the noise.",
    description: `Read the Quran with Tajweed, trusted translations, Tafsir and audio${extrasCopy}. Free, private, and ad-free.`,
    siteName: "Al-Furqan",
    locale: "en_US",
    type: "website",
    images: [{ url: socialImageUrl, secureUrl: socialImageUrl, type: "image/png", width: 1200, height: 630, alt: "Al-Furqan — The Noble Quran, without the noise" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Noble Quran, without the noise.",
    description: "A free, private, and ad-free Quran and Sunnah companion.",
    images: [socialImageUrl],
  },
  robots: { index: true, follow: true },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${monoFont.variable}`}>
        <StructuredData data={siteStructuredData}/>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

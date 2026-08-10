import type { Metadata } from "next";
import localFont from "next/font/local";

import { starterConfig } from "../../starter.config";
import AppShell from "@/components/app-shell";
import "./globals.css";

const bodyFont = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-ui",
});

const monoFont = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://al-furqan.app"),
  applicationName: starterConfig.app.name,
  title: {
    default: "Al-Furqan — Quran & Worship Companion",
    template: "%s · Al-Furqan",
  },
  description: "A free, ad-free Quran and worship companion with Tajweed, translations, Tafsir, audio, Salah times, Dua, Qibla, and more.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  keywords: ["Quran", "Tajweed", "Tafsir", "Salah times", "Dua", "Qibla", "Islamic app"],
  openGraph: {
    title: "Al-Furqan — Quran & Worship Companion",
    description: "Read the Quran with Tajweed, trusted translations, Tafsir and audio—plus Salah times, Dua, Qibla, and more. Free, private, and ad-free.",
    siteName: "Al-Furqan",
    locale: "en_US",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Al-Furqan — A quiet place to return to the Quran" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Al-Furqan — Quran & Worship Companion",
    description: "A free, private, and ad-free Quran and worship companion.",
    images: ["/opengraph-image"],
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${monoFont.variable}`}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

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
  description: starterConfig.app.description,
  title: starterConfig.app.name,
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

import type { Metadata } from "next";
import { enabledFeatureLabels } from "@/lib/features";

const enabledExtras = enabledFeatureLabels();
const extrasCopy = enabledExtras.length ? `, plus ${enabledExtras.join(", ")}` : "";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    title: "The Noble Quran, without the noise.",
    description:
      `Read the Quran with Tajweed, trusted translations, Tafsir and audio${extrasCopy}. Free, private, and ad-free.`,
    url: "/",
    siteName: "Al-Furqan",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Al-Furqan — The Noble Quran, without the noise",
      },
    ],
  },
};

export default function HomePage() {
  return null;
}

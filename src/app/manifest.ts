import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Al-Furqan — Quran & Sunnah Companion",
    short_name: "Al-Furqan",
    description: "A free, ad-free, privacy-first Quran and Sunnah companion.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f2e8",
    theme_color: "#1f604b",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
      { src: "/favicon.ico", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" },
    ],
  };
}

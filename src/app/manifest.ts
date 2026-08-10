import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Al-Furqan — Quran & Worship Companion",
    short_name: "Al-Furqan",
    description: "A free, ad-free, privacy-first Quran and worship companion.",
    start_url: "/",
    display: "standalone",
    background_color: "#f6f2e8",
    theme_color: "#1f604b",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" }],
  };
}

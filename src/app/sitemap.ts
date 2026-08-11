import type { MetadataRoute } from "next";
import { loadContentPreviewData } from "@/lib/data";
import { ummahHadithAdapter } from "@/lib/hadith";
import { createPublicContentSession } from "@/lib/public-content";

const BASE = "https://al-furqan.app";
export const revalidate = 86400;
const core = ["", "/quran", "/sunnah", "/salah-times", "/dua", "/qibla", "/masjid-finder", "/search", "/reflect", "/quran/mushaf/1", "/quran/structure", "/quran/resources"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [chapters, collections] = await Promise.all([
    loadContentPreviewData(createPublicContentSession(), 114).catch(() => ({ items: [] })),
    ummahHadithAdapter.collections().catch(() => []),
  ]);
  return [
    ...core.map((path) => ({ url: `${BASE}${path}`, lastModified: now, changeFrequency: path === "" ? "daily" as const : "weekly" as const, priority: path === "" ? 1 : .8 })),
    ...chapters.items.map((chapter) => ({ url: `${BASE}/quran/${chapter.id}`, lastModified: now, changeFrequency: "monthly" as const, priority: .9 })),
    ...collections.map((collection) => ({ url: `${BASE}/sunnah/${collection.id}`, lastModified: now, changeFrequency: "weekly" as const, priority: .7 })),
  ];
}

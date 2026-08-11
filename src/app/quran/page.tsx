import type { Metadata } from "next";
import Link from "next/link";
import { loadContentPreviewData } from "@/lib/data";
import { createPublicContentSession } from "@/lib/public-content";
import styles from "@/components/seo-fallback.module.css";

export const metadata: Metadata = {
  title: "Read the Quran — 114 Surahs with Translation, Tafsir & Audio",
  description: "Read all 114 Surahs of the Noble Quran in Arabic with trusted translations, Tafsir, Tajweed, recitation, word-by-word study and Mushaf navigation.",
  alternates: { canonical: "/quran" },
};
export const revalidate = 3600;

export default async function QuranLibraryPage() {
  const data = await loadContentPreviewData(createPublicContentSession(), 114);
  if (data.error) return <p className={styles.unavailable}>The sourced Quran chapter catalog is unavailable right now.</p>;
  return <section className={styles.library} aria-label="All 114 Quran Surahs">{data.items.map((chapter) => <Link className={styles.chapter} href={chapter.readerUrl} key={chapter.id}><span>{chapter.id}</span><div><h2>{chapter.nameSimple}</h2><p>{chapter.translatedName} · {chapter.versesCount} Ayahs</p></div><strong lang="ar" dir="rtl" translate="no">{chapter.nameArabic}</strong></Link>)}</section>;
}

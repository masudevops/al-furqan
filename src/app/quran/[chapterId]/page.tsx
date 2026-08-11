import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import styles from "@/components/seo-fallback.module.css";
import StructuredData, { breadcrumbData } from "@/components/structured-data";
import { loadReaderData } from "@/lib/data";
import { createPublicContentSession } from "@/lib/public-content";

const getChapter = cache(async (chapterId: string) => loadReaderData(createPublicContentSession(), chapterId));
export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { chapterId: string } }): Promise<Metadata> {
  try {
    const data = await getChapter(params.chapterId);
    return {
      title: `Surah ${data.chapter.nameSimple} — Arabic, Translation, Tafsir & Audio`,
      description: `Read Surah ${data.chapter.nameSimple} (${data.chapter.translatedName}) in Arabic with trusted translation, Tajweed, Tafsir, word-by-word study and Quran recitation.`,
      alternates: { canonical: `/quran/${data.chapter.id}` },
      openGraph: { title: `Surah ${data.chapter.nameSimple} · Al-Furqan`, description: `Read Surah ${data.chapter.nameSimple} in Arabic with translation, Tajweed, Tafsir and audio.`, url: `/quran/${data.chapter.id}` },
    };
  } catch { return { title: "Read the Quran", robots: { index: false, follow: true } }; }
}

export default async function QuranReaderPage({ params }: { params: { chapterId: string } }) {
  try {
    const data = await getChapter(params.chapterId);
    return <section><StructuredData data={breadcrumbData([{ name: "Home", path: "/" }, { name: "Quran", path: "/quran" }, { name: `Surah ${data.chapter.nameSimple}`, path: `/quran/${data.chapter.id}` }])}/><header className={styles.readerHeader}><p>Surah {data.chapter.id}</p><h1>{data.chapter.nameSimple}</h1><span>{data.chapter.translatedName} · {data.chapter.versesCount} Ayahs</span></header><div className={styles.verses}>{data.verses.map((verse) => <article className={styles.verse} key={verse.verseKey}><Link className={styles.reference} href={`/quran/${data.chapter.id}/${verse.verseNumber}`}>{verse.verseKey}</Link><p className={styles.arabic} lang="ar" dir="rtl" translate="no">{verse.arabicText}</p>{verse.translationText ? <div className={styles.translation} translate="no" dangerouslySetInnerHTML={{ __html: verse.translationText }}/> : null}<small className={styles.source}>Quran text and translation: Quran.Foundation{verse.translationName ? ` · ${verse.translationName}` : ""}</small></article>)}</div></section>;
  } catch { return <p className={styles.unavailable}>This sourced Quran chapter is unavailable right now.</p>; }
}

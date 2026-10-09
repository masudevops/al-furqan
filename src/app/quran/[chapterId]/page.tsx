import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import styles from "@/components/seo-fallback.module.css";
import StructuredData, { breadcrumbData } from "@/components/structured-data";
import SurahPreview from "@/components/surah-preview";
import { loadReaderData, loadRecitationResources, loadTranslationResources } from "@/lib/data";
import { createPublicContentSession } from "@/lib/public-content";
import { defaultReaderSelection, readerRequestKey } from "@/lib/reader-defaults";

// Loads the Surah with the reader's default resources so the client reader can reuse this payload.
const getChapter = cache(async (chapterId: string) => {
  const session = createPublicContentSession();
  const [translations, recitations] = await Promise.all([loadTranslationResources(session), loadRecitationResources(session)]);
  const selection = defaultReaderSelection(translations.items, recitations.items);
  const payload = await loadReaderData(session, chapterId, selection?.translationId, selection?.recitationId, { script: selection?.script });
  return { payload, selection, readerKey: selection ? readerRequestKey(chapterId, selection) : null };
});
export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { chapterId: string } }): Promise<Metadata> {
  try {
    const { payload: data } = await getChapter(params.chapterId);
    return {
      title: `Surah ${data.chapter.nameSimple} — Arabic, Translation, Tafsir & Audio`,
      description: `Read Surah ${data.chapter.nameSimple} (${data.chapter.translatedName}) in Arabic with trusted translation, Tajweed, Tafsir, word-by-word study and Quran recitation.`,
      alternates: { canonical: `/quran/${data.chapter.id}` },
      openGraph: { title: `Surah ${data.chapter.nameSimple} · Al-Furqan`, description: `Read Surah ${data.chapter.nameSimple} in Arabic with translation, Tajweed, Tafsir and audio.`, url: `/quran/${data.chapter.id}` },
    };
  } catch { return { title: "Read the Quran", robots: { index: false, follow: true } }; }
}

export default async function QuranReaderPage({ params }: { params: { chapterId: string } }) {
  const chapterId=Number(params.chapterId);
  if(!Number.isInteger(chapterId)||chapterId<1||chapterId>114)notFound();
  try {
    const { payload, readerKey, selection } = await getChapter(params.chapterId);
    return <><StructuredData data={breadcrumbData([{ name: "Home", path: "/" }, { name: "Quran", path: "/quran" }, { name: `Surah ${payload.chapter.nameSimple}`, path: `/quran/${payload.chapter.id}` }])}/><SurahPreview payload={payload} readerKey={readerKey} selection={selection}/></>;
  } catch { return <p className={styles.unavailable}>This sourced Quran chapter is unavailable right now.</p>; }
}

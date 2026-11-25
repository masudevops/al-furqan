import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { HisnChapterView } from "@/components/hisnul-muslim";
import { publicFeatures } from "@/lib/features";
import { loadHisnChapter, loadHisnChapters } from "@/lib/hisnul-muslim";

export const revalidate = 86400;
const chapterNumber = (value: string) => /^\d+$/.test(value) ? Number(value) : 0;
const getChapter = cache((id: number) => loadHisnChapter(id));

export async function generateMetadata({ params }: { params: { chapter: string } }): Promise<Metadata> {
  const chapter = await getChapter(chapterNumber(params.chapter)).catch(() => null);
  const title = chapter ? `${chapter.title} — Hisnul Muslim ${chapter.id}` : "Hisnul Muslim";
  return { title, description: chapter ? `${chapter.title}: the Duas from Hisnul Muslim chapter ${chapter.id} in Arabic with English meaning and recitation.` : undefined, alternates: { canonical: `/dua/hisnul-muslim/${params.chapter}` } };
}

export default async function Page({ params }: { params: { chapter: string } }) {
  if (!publicFeatures.hisnulMuslim) notFound();
  const id = chapterNumber(params.chapter);
  if (!id) notFound();
  try {
    const [chapter, chapters] = await Promise.all([getChapter(id), loadHisnChapters()]);
    if (!chapter) notFound();
    const position = chapters.findIndex((entry) => entry.id === id);
    return <HisnChapterView chapter={chapter} previous={chapters[position - 1]} next={chapters[position + 1]} />;
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    console.error("Hisnul Muslim chapter failed", { id, message: error instanceof Error ? error.message : "Unknown error" });
    return <HisnChapterView chapter={null} />;
  }
}

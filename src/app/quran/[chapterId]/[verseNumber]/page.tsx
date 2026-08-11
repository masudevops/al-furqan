import type { Metadata } from "next";
import QuranReaderPage, { generateMetadata as generateChapterMetadata } from "../page";

export async function generateMetadata({params}:{params:{chapterId:string;verseNumber:string}}):Promise<Metadata>{
  const chapter=await generateChapterMetadata({params});
  return {...chapter,title:`Ayah ${params.chapterId}:${params.verseNumber} — Quran Arabic & Translation`,alternates:{canonical:`/quran/${params.chapterId}/${params.verseNumber}`}};
}

export default QuranReaderPage;

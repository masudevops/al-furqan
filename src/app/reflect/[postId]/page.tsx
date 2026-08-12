import type { Metadata } from "next";
import { notFound } from "next/navigation";
import QuranReflectDetail from "@/components/quran-reflect-detail";

export function generateMetadata({params}:{params:{postId:string}}):Metadata{return{title:`Quran Lesson or Reflection ${params.postId}`,description:"Read a curated lesson or reflection connected to the Quran Ayahs it discusses.",alternates:{canonical:`/reflect/${params.postId}`}}}

export default function Page({ params }: { params: { postId: string } }) {
  const postId=Number(params.postId);if(!Number.isInteger(postId)||postId<1)notFound();
  return <QuranReflectDetail postId={postId} />;
}

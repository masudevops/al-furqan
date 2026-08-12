import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DuaDetail } from "@/components/dua-browser";
export function generateMetadata({params}:{params:{slug:string;id:string}}):Metadata{return{title:`Dua ${params.id} — Arabic, Translation & Audio`,description:"Read this Dua in Arabic with transliteration, English meaning, its source reference and available audio.",alternates:{canonical:`/dua/${params.slug}/${params.id}`}}}
export default function Page({params}:{params:{slug:string;id:string}}){if(!/^\d+$/.test(params.id)||Number(params.id)<1)notFound();return <DuaDetail slug={params.slug} id={params.id}/>}

import type { Metadata } from "next";
import { DuaCategoryList } from "@/components/dua-browser";
export function generateMetadata({params}:{params:{slug:string}}):Metadata{const name=params.slug.split("-").map(part=>part[0]?.toUpperCase()+part.slice(1)).join(" ");return{title:`${name} Duas — Arabic, Translation & Audio`,description:`Read ${name} duas in Arabic with transliteration, English meaning, references and available audio.`,alternates:{canonical:`/dua/${params.slug}`}}}
export default function Page({params}:{params:{slug:string}}){return <DuaCategoryList slug={params.slug}/>}

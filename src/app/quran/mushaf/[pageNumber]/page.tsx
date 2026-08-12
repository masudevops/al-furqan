import type { Metadata } from "next";
import { notFound } from "next/navigation";
import MushafPage from "@/components/mushaf-page";

export function generateMetadata({params}:{params:{pageNumber:string}}):Metadata {
  const page=Number(params.pageNumber);
  return { title: `Mushaf Page ${Number.isInteger(page)?page:""} — Tajweed Quran`, description: "Read the Noble Quran in an official Mushaf page layout with Tajweed coloring.", alternates:{canonical:`/quran/mushaf/${params.pageNumber}`} };
}
export default function Page({params}:{params:{pageNumber:string}}){const page=Number(params.pageNumber);if(!Number.isInteger(page)||page<1||page>604)notFound();return <MushafPage pageNumber={page}/>}

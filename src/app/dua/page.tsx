import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DuaCategories } from "@/components/dua-browser";
import { publicFeatures } from "@/lib/features";
export const metadata:Metadata={title:"Dua & Dhikr — Hisnul Muslim Supplications",description:"Read sourced daily Duas and Dhikr in Arabic with transliteration, English meaning, audio and references.",alternates:{canonical:"/dua"}};
export default function Page(){if(!publicFeatures.dua)notFound();return <DuaCategories/>}

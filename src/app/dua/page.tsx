import type { Metadata } from "next";
import { DuaCategories } from "@/components/dua-browser";
export const metadata:Metadata={title:"Dua & Dhikr — Hisnul Muslim Supplications",description:"Read sourced daily Duas and Dhikr in Arabic with transliteration, English meaning, audio and references.",alternates:{canonical:"/dua"}};
export default function Page(){return <DuaCategories/>}

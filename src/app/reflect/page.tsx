import type { Metadata } from "next";
import QuranReflectPage from "@/components/quran-reflect-page";

export const metadata:Metadata={title:"Quran Lessons & Reflections",description:"Read curated Quran Reflect lessons and reflections connected to the Ayahs they discuss.",alternates:{canonical:"/reflect"}};

export default function ReflectPage() { return <QuranReflectPage />; }

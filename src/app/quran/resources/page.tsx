import type { Metadata } from "next";
import QuranResourcesPage from "@/components/quran-resources-page";

export const metadata:Metadata={title:"Quran Translations, Tafsir, Reciters & Resources",description:"Explore dynamically available Quran translations, Tafsir sources, reciters, languages and Mushaf resources from Quran.Foundation.",alternates:{canonical:"/quran/resources"}};

export default function Page() {
  return <QuranResourcesPage />;
}

import type { Metadata } from "next";
import { QuranStructureIndex } from "@/components/quran-structure";
export const metadata:Metadata={title:"Browse the Quran by Juz, Hizb, Ruku, Manzil & Page",description:"Navigate the Noble Quran through official Juz, Hizb, Rub el Hizb, Ruku, Manzil, Mushaf page and Ayah-range structures.",alternates:{canonical:"/quran/structure"}};
export default function Page(){return <QuranStructureIndex/>}

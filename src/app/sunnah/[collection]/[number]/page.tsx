import type { Metadata } from "next";
import { cache } from "react";
import HadithBrowser from "@/components/hadith-browser";
import StructuredData, { breadcrumbData } from "@/components/structured-data";
import { ummahHadithAdapter } from "@/lib/hadith";

const getHadith = cache(async (collection: string, number: number) => ummahHadithAdapter.one(collection, number));
export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { collection: string; number: string } }): Promise<Metadata> {
  const item = await getHadith(params.collection, Number(params.number)).catch(() => null);
  if (!item) return { title: "Hadith unavailable", robots: { index: false, follow: true } };
  return {
    title: `${item.collectionName} Hadith ${item.hadithNumber} — Arabic & English`,
    description: `${item.collectionName}, Hadith ${item.hadithNumber}, with original Arabic, English translation and the authenticity grade supplied by the source.`,
    alternates: { canonical: `/sunnah/${item.collectionId}/${item.hadithNumber}` },
    openGraph: { title: `${item.collectionName} · Hadith ${item.hadithNumber}`, description: item.text.slice(0, 180), url: `/sunnah/${item.collectionId}/${item.hadithNumber}` },
  };
}

export default async function SunnahDetailPage({ params }: { params: { collection: string; number: string } }) {
  const item = await getHadith(params.collection, Number(params.number)).catch(() => null);
  return <><StructuredData data={breadcrumbData([{ name: "Home", path: "/" }, { name: "Sunnah", path: "/sunnah" }, { name: item ? `${item.collectionName} Hadith ${item.hadithNumber}` : "Hadith", path: `/sunnah/${params.collection}/${params.number}` }])}/><HadithBrowser collectionId={params.collection} hadithNumber={params.number} initialItem={item}/></>;
}

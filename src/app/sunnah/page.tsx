import type { Metadata } from "next";
import HadithBrowser from "@/components/hadith-browser";
import { ummahHadithAdapter } from "@/lib/hadith";
import { hadithBooks } from "@/lib/hadith-books";

export const metadata: Metadata = {
  title: "Sunnah Library — Major Hadith Collections in Arabic & English",
  description: "Browse and search major Hadith collections in Arabic and English with collection references and reported authenticity grades.",
  alternates: { canonical: "/sunnah" },
};
export const revalidate = 3600;

export default async function SunnahPage() {
  try {
    const catalog = await ummahHadithAdapter.collections();
    const initialCollection = catalog[0];
    const list = initialCollection ? await ummahHadithAdapter.list(initialCollection.id, 1) : undefined;
    return <HadithBrowser books={hadithBooks(initialCollection?.id ?? "bukhari")} initialCatalog={catalog} initialList={list}/>;
  } catch { return <HadithBrowser books={hadithBooks("bukhari")}/>; }
}

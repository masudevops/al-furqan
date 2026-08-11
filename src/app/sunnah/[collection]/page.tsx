import type { Metadata } from "next";
import HadithBrowser from "@/components/hadith-browser";
import StructuredData, { breadcrumbData } from "@/components/structured-data";
import { ummahHadithAdapter } from "@/lib/hadith";
export const revalidate = 3600;

export async function generateMetadata({ params }: { params: { collection: string } }): Promise<Metadata> {
  const catalog = await ummahHadithAdapter.collections().catch(() => []);
  const collection = catalog.find((item) => item.id === params.collection);
  if (!collection) return { title: "Hadith collection unavailable", robots: { index: false, follow: true } };
  return { title: `${collection.name} — Arabic & English Hadith`, description: `Browse ${collection.name} in Arabic and English with canonical Hadith references and provider-supplied grades.`, alternates: { canonical: `/sunnah/${collection.id}` } };
}

export default async function CollectionPage({ params }: { params: { collection: string } }) {
  try {
    const catalog = await ummahHadithAdapter.collections();
    const collection = catalog.find((item) => item.id === params.collection);
    const list = collection ? await ummahHadithAdapter.list(collection.id, 1) : undefined;
    return <><StructuredData data={breadcrumbData([{ name: "Home", path: "/" }, { name: "Sunnah", path: "/sunnah" }, { name: collection?.name ?? "Collection", path: `/sunnah/${params.collection}` }])}/><HadithBrowser collectionId={params.collection} initialCatalog={catalog} initialList={list}/></>;
  } catch { return <HadithBrowser collectionId={params.collection}/>; }
}

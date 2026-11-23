import type { Metadata } from "next";
import { notFound } from "next/navigation";
import HadithBrowser from "@/components/hadith-browser";
import StructuredData, { breadcrumbData } from "@/components/structured-data";
import { loadHadithBook, ummahHadithAdapter } from "@/lib/hadith";
import { hadithBook, hadithBooks } from "@/lib/hadith-books";
export const revalidate = 86400;

export async function generateMetadata({ params }: { params: { collection: string; book: string } }): Promise<Metadata> {
  const book = hadithBook(params.collection, Number(params.book));
  const collection = (await ummahHadithAdapter.collections().catch(() => [])).find((item) => item.id === params.collection);
  if (!book || !collection) return { title: "Hadith book unavailable", robots: { index: false, follow: true } };
  return { title: `${book.name} — ${collection.name}, Book ${book.number}`, description: `Read the ${book.count.toLocaleString()} Hadith of ${collection.name}, Book ${book.number}: ${book.name}, in Arabic and English.`, alternates: { canonical: `/sunnah/${collection.id}/book/${book.number}` } };
}

export default async function HadithBookPage({ params }: { params: { collection: string; book: string } }) {
  const books = hadithBooks(params.collection);
  const book = hadithBook(params.collection, Number(params.book));
  if (!books || !book) notFound();
  const [catalog, list] = await Promise.all([ummahHadithAdapter.collections().catch(() => undefined), loadHadithBook(params.collection, book.number).catch(() => undefined)]);
  const name = catalog?.find((item) => item.id === params.collection)?.name ?? "Collection";
  return <><StructuredData data={breadcrumbData([{ name: "Home", path: "/" }, { name: "Sunnah", path: "/sunnah" }, { name, path: `/sunnah/${params.collection}` }, { name: book.name, path: `/sunnah/${params.collection}/book/${book.number}` }])}/><HadithBrowser collectionId={params.collection} bookNumber={book.number} books={books} initialCatalog={catalog} initialBook={list ?? undefined}/></>;
}

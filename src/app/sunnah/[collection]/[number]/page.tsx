import HadithBrowser from "@/components/hadith-browser";

export default async function SunnahDetailPage({ params }: { params: Promise<{ collection: string; number: string }> }) {
  const { collection, number } = await params;
  return <HadithBrowser collectionId={collection} hadithNumber={number} />;
}

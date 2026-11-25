import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HisnChapterList } from "@/components/hisnul-muslim";
import { publicFeatures } from "@/lib/features";
import { loadHisnChapters } from "@/lib/hisnul-muslim";

export const revalidate = 3600;
export const metadata: Metadata = { title: "Hisnul Muslim — Fortress of the Muslim", description: "All chapters of Hisnul Muslim: Duas and remembrance for daily life in Arabic with English meaning and recitation.", alternates: { canonical: "/dua/hisnul-muslim" } };

export default async function Page() {
  if (!publicFeatures.hisnulMuslim) notFound();
  const chapters = await loadHisnChapters().catch((error) => { console.error("Hisnul Muslim chapter list failed", { message: error instanceof Error ? error.message : "Unknown error" }); return null; });
  return <HisnChapterList chapters={chapters} />;
}

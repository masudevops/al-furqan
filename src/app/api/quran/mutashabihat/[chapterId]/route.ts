import { publicContentJson } from "@/lib/public-content";

type SimilarVerse = { verse_key?: unknown };
type SourceVerse = { similar_verses?: SimilarVerse[]; verse_key?: unknown };

export async function GET(_request: Request, { params }: { params: { chapterId: string } }) {
  const chapterId = Number(params.chapterId);
  if (!Number.isInteger(chapterId) || chapterId < 1 || chapterId > 114) return publicContentJson({ error: "Enter a valid Surah." }, 400);
  try {
    const fetchPage = async (page: number) => {
      const response = await fetch(`https://ummahapi.com/api/quran/mutashabihat/${chapterId}?page=${page}&limit=50`, { next: { revalidate: 86_400 } });
      const payload = await response.json();
      if (!response.ok || payload?.success !== true || !Array.isArray(payload?.data?.verses)) throw new Error("Mutashabihat source failed");
      return payload.data;
    };
    const first = await fetchPage(1);
    const pages = Math.min(10, Math.max(1, Number(first.total_pages) || 1));
    const rest = pages > 1 ? await Promise.all(Array.from({ length: pages - 1 }, (_, index) => fetchPage(index + 2))) : [];
    const verses = [first, ...rest].flatMap((page) => page.verses as SourceVerse[]).map((verse) => ({
      similarVerseKeys: Array.isArray(verse.similar_verses) ? verse.similar_verses.map((item) => String(item.verse_key ?? "")).filter((key) => /^\d{1,3}:\d{1,3}$/.test(key)) : [],
      verseKey: String(verse.verse_key ?? ""),
    })).filter((verse) => /^\d{1,3}:\d{1,3}$/.test(verse.verseKey) && verse.similarVerseKeys.length);
    return publicContentJson({ error: null, items: verses, source: "Waqar144/Quran_Mutashabihat_Data" });
  } catch (error) {
    console.error("Mutashabihat request failed", { chapterId, message: error instanceof Error ? error.message : "Unknown error" });
    return publicContentJson({ error: "Similar-Ayah references are unavailable right now.", items: [] }, 502);
  }
}

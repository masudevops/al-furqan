import { NextRequest } from "next/server";
import { HADITH_ENABLED } from "@/lib/feature-flags";
import { loadHadithBook } from "@/lib/hadith";
import { publicContentJson } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { collection: string; book: string } }) {
  if (!HADITH_ENABLED) {
    return publicContentJson({ error: "Sunnah browsing is not enabled for this deployment.", items: [] }, 503);
  }
  const page = Number(request.nextUrl.searchParams.get("page")) || 1;
  try {
    const result = await loadHadithBook(params.collection, Number(params.book), page);
    return result ? publicContentJson({ error: null, ...result }, 200, "stable") : publicContentJson({ error: "Book not found.", items: [] }, 404);
  } catch (error) {
    console.error("Hadith book request failed", { book: params.book, collection: params.collection, message: error instanceof Error ? error.message : "Unknown error" });
    return publicContentJson({ error: "The sourced Hadith records are unavailable right now.", items: [] }, 502);
  }
}

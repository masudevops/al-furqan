import { NextRequest } from "next/server";
import { HADITH_ENABLED } from "@/lib/feature-flags";
import { searchAllHadith } from "@/lib/hadith";
import { publicContentJson } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!HADITH_ENABLED) return publicContentJson({ error: "Sunnah browsing is not enabled for this deployment.", items: [], total: 0 }, 503);
  try {
    return publicContentJson({ error: null, ...await searchAllHadith(request.nextUrl.searchParams.get("query") ?? "") });
  } catch (error) {
    console.error("Hadith search failed", { message: error instanceof Error ? error.message : "Unknown error" });
    return publicContentJson({ error: "Hadith search is unavailable right now.", items: [], total: 0 }, 502);
  }
}

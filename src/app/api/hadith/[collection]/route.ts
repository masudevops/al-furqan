import { NextRequest } from "next/server";
import { HADITH_ENABLED } from "@/lib/feature-flags";
import { ummahHadithAdapter } from "@/lib/hadith";
import { publicContentJson } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { collection: string } }) {
  if (!HADITH_ENABLED) {
    return publicContentJson({ error: "Sunnah browsing is not enabled for this deployment.", items: [] }, 503);
  }
  const query = request.nextUrl.searchParams.get("query") ?? undefined;
  const page = Number(request.nextUrl.searchParams.get("page")) || 1;
  try {
    return publicContentJson({ error: null, ...await ummahHadithAdapter.list(params.collection, page, query) });
  } catch (error) {
    console.error("UmmahAPI Hadith list request failed", { collection: params.collection, message: error instanceof Error ? error.message : "Unknown error" });
    return publicContentJson({ error: "The sourced Hadith records are unavailable right now.", items: [] }, 502);
  }
}

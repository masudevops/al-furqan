import { NextRequest } from "next/server";
import { searchDuaTitles } from "@/lib/dua";
import { publicContentJson } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const items = await searchDuaTitles((request.nextUrl.searchParams.get("query") ?? "").slice(0, 100));
    return publicContentJson({ error: null, items, total: items.length });
  } catch {
    return publicContentJson({ error: "Dua search is unavailable right now.", items: [], total: 0 }, 502);
  }
}

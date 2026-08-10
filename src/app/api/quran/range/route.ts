import { NextRequest } from "next/server";

import { loadVerseRange, parseVerseKey } from "@/lib/data";
import { createPublicContentSession, publicContentJson } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const from = parseVerseKey(request.nextUrl.searchParams.get("from"));
  const to = parseVerseKey(request.nextUrl.searchParams.get("to"));
  if (!from || !to) return publicContentJson({ error: "Enter a valid start and end Ayah." }, 400);
  try {
    return publicContentJson({ items: await loadVerseRange(createPublicContentSession(), from, to) });
  } catch (error) {
    console.error("Quran range request failed", { from, message: error instanceof Error ? error.message : "Unknown error", to });
    return publicContentJson({ error: "This Quran range is unavailable right now." }, 502);
  }
}

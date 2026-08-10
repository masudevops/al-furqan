import { NextRequest, NextResponse } from "next/server";

import { loadVerseRange, parseVerseKey } from "@/lib/data";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const from = parseVerseKey(request.nextUrl.searchParams.get("from"));
  const to = parseVerseKey(request.nextUrl.searchParams.get("to"));
  if (!from || !to) return NextResponse.json({ error: "Enter a valid start and end Ayah." }, { status: 400 });
  const sessionContext = await getSession(request);
  try {
    return NextResponse.json({ items: await loadVerseRange(sessionContext.session, from, to) });
  } catch (error) {
    console.error("Quran range request failed", { from, message: error instanceof Error ? error.message : "Unknown error", to });
    return NextResponse.json({ error: "This Quran range is unavailable right now." }, { status: 502 });
  }
}

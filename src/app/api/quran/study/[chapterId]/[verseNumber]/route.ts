import { NextRequest, NextResponse } from "next/server";

import { loadAyahStudy } from "@/lib/data";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { chapterId: string; verseNumber: string } }) {
  const chapterId = Number(params.chapterId);
  const verseNumber = Number(params.verseNumber);
  if (!Number.isInteger(chapterId) || chapterId < 1 || chapterId > 114 || !Number.isInteger(verseNumber) || verseNumber < 1) {
    return NextResponse.json({ error: "Enter a valid Ayah reference." }, { status: 400 });
  }
  const sessionContext = await getSession(request);
  try {
    return NextResponse.json(await loadAyahStudy(sessionContext.session, `${chapterId}:${verseNumber}`));
  } catch (error) {
    console.error("Ayah study request failed", { chapterId, message: error instanceof Error ? error.message : "Unknown error", verseNumber });
    return NextResponse.json({ error: "Ayah study references are unavailable right now." }, { status: 502 });
  }
}

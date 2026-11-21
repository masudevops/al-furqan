import { NextRequest } from "next/server";

import { loadAyahTafsir } from "@/lib/data";
import { createPublicContentSession, publicContentJson } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { chapterId: string; verseNumber: string } }) {
  const chapterId = Number(params.chapterId);
  const verseNumber = Number(params.verseNumber);
  const tafsirId = Number(request.nextUrl.searchParams.get("tafsir"));
  if (!Number.isInteger(chapterId) || chapterId < 1 || chapterId > 114 || !Number.isInteger(verseNumber) || verseNumber < 1 || !Number.isInteger(tafsirId) || tafsirId < 1) {
    return publicContentJson({ error: "Enter a valid Ayah reference and Tafsir source." }, 400);
  }
  try {
    return publicContentJson(await loadAyahTafsir(createPublicContentSession(), `${chapterId}:${verseNumber}`, tafsirId), 200, "stable");
  } catch (error) {
    console.error("Ayah tafsir request failed", { chapterId, message: error instanceof Error ? error.message : "Unknown error", tafsirId, verseNumber });
    return publicContentJson({ error: "This Tafsir is unavailable right now." }, 502);
  }
}

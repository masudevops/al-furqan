import { NextRequest } from "next/server";

import { loadReaderData, parsePositiveInteger } from "@/lib/data";
import { createPublicContentSession, publicContentJson } from "@/lib/public-content";
import { WORD_LANGUAGES, type QuranScript } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: { chapterId: string } },
) {
  const chapterId = parsePositiveInteger(context.params.chapterId);
  const translationId = parsePositiveInteger(
    request.nextUrl.searchParams.get("translation"),
  );
  const recitationId = parsePositiveInteger(
    request.nextUrl.searchParams.get("recitation"),
  );
  const tafsirId=parsePositiveInteger(request.nextUrl.searchParams.get("tafsir"));
  const includeWords=request.nextUrl.searchParams.get("words")==="1";
  // Word meanings in a reader-chosen language, limited to the languages Quran.Foundation offers them in.
  const requestedWordLanguage=request.nextUrl.searchParams.get("wordLanguage")??"en";
  const wordLanguage=WORD_LANGUAGES.some((item)=>item.code===requestedWordLanguage)?requestedWordLanguage:"en";
  const requestedScript=request.nextUrl.searchParams.get("script")??"uthmani";
  const scripts:QuranScript[]=["uthmani","uthmani_simple","imlaei","indopak","indopak_nastaleeq"];
  const script=scripts.includes(requestedScript as QuranScript)?requestedScript as QuranScript:"uthmani";

  if (!chapterId || chapterId > 114) {
    return publicContentJson(
      {
        message: "Chapter id must be a number from 1 to 114.",
        ok: false,
      },
      400,
    );
  }

  try {
    const payload = await loadReaderData(
      createPublicContentSession(),
      String(chapterId),
      translationId ?? undefined,
      recitationId ?? undefined,
      {includeWords,script,tafsirId:tafsirId??undefined,wordLanguage},
    );
    return publicContentJson(payload);
  } catch (error) {
    console.error("Reader API request failed", {
      chapterId,
      message: error instanceof Error ? error.message : "Unknown reader error",
      recitationId,
      translationId,
    });
    return publicContentJson({
      message: "Quran content is unavailable right now. No substitute content has been used.",
      ok: false,
    }, 502);
  }
}

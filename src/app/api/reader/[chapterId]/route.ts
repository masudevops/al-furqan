import { NextRequest } from "next/server";

import { loadReaderData, parsePositiveInteger } from "@/lib/data";
import { getSession } from "@/lib/session";
import { withSessionJson } from "@/lib/route-helpers";
import type { QuranScript } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: { chapterId: string } },
) {
  const sessionContext = await getSession(request);
  const chapterId = parsePositiveInteger(context.params.chapterId);
  const translationId = parsePositiveInteger(
    request.nextUrl.searchParams.get("translation"),
  );
  const recitationId = parsePositiveInteger(
    request.nextUrl.searchParams.get("recitation"),
  );
  const tafsirId=parsePositiveInteger(request.nextUrl.searchParams.get("tafsir"));
  const includeWords=request.nextUrl.searchParams.get("words")==="1";
  const requestedScript=request.nextUrl.searchParams.get("script")??"uthmani";
  const scripts:QuranScript[]=["uthmani","uthmani_simple","imlaei","indopak","indopak_nastaleeq"];
  const script=scripts.includes(requestedScript as QuranScript)?requestedScript as QuranScript:"uthmani";

  if (!chapterId || chapterId > 114) {
    return withSessionJson(
      sessionContext,
      {
        message: "Chapter id must be a number from 1 to 114.",
        ok: false,
      },
      400,
    );
  }

  try {
    const payload = await loadReaderData(
      sessionContext.session,
      String(chapterId),
      translationId ?? undefined,
      recitationId ?? undefined,
      {includeWords,script,tafsirId:tafsirId??undefined},
    );
    return withSessionJson(sessionContext, payload);
  } catch (error) {
    console.error("Reader API request failed", {
      chapterId,
      message: error instanceof Error ? error.message : "Unknown reader error",
      recitationId,
      translationId,
    });
    return withSessionJson(sessionContext, {
      message: "Quran content is unavailable right now. No substitute content has been used.",
      ok: false,
    }, 502);
  }
}

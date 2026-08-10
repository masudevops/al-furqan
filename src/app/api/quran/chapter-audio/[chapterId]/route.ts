import { NextRequest } from "next/server";

import { loadChapterAudio, parsePositiveInteger } from "@/lib/data";
import { withSessionJson } from "@/lib/route-helpers";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: { params: { chapterId: string } }) {
  const sessionContext = await getSession(request);
  const chapterId = parsePositiveInteger(context.params.chapterId);
  const reciterId = parsePositiveInteger(request.nextUrl.searchParams.get("reciter"));
  if (!chapterId || chapterId > 114 || !reciterId) {
    return withSessionJson(sessionContext, { message: "A valid chapter and chapter-reciter are required." }, 400);
  }
  try {
    return withSessionJson(sessionContext, await loadChapterAudio(sessionContext.session, chapterId, reciterId));
  } catch (error) {
    console.error("Synchronized chapter audio failed", { chapterId, reciterId, message: error instanceof Error ? error.message : "Unknown error" });
    return withSessionJson(sessionContext, { message: "Synchronized recitation is unavailable right now. No timing data has been approximated." }, 502);
  }
}

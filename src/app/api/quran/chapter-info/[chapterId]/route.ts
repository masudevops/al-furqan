import { NextRequest } from "next/server";

import { loadChapterInfo, parsePositiveInteger } from "@/lib/data";
import { withSessionJson } from "@/lib/route-helpers";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { chapterId: string } }) {
  const context = await getSession(request);
  const chapterId = parsePositiveInteger(params.chapterId);
  if (!chapterId || chapterId > 114) return withSessionJson(context, { message: "A valid chapter is required." }, 400);
  try {
    return withSessionJson(context, await loadChapterInfo(context.session, chapterId));
  } catch {
    return withSessionJson(context, { message: "Chapter information is unavailable right now." }, 502);
  }
}

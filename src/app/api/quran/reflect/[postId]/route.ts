import { NextRequest, NextResponse } from "next/server";

import { loadQuranReflectPost } from "@/lib/data";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { postId: string } }) {
  const postId = Number(params.postId);
  if (!Number.isInteger(postId) || postId < 1) return NextResponse.json({ error: "Invalid reflection." }, { status: 400 });
  const sessionContext = await getSession(request);
  try {
    return NextResponse.json({ item: await loadQuranReflectPost(sessionContext.session, postId) });
  } catch (error) {
    console.error("Quran Reflect post request failed", { message: error instanceof Error ? error.message : "Unknown error", postId });
    return NextResponse.json({ error: "This lesson or reflection is unavailable right now." }, { status: 502 });
  }
}

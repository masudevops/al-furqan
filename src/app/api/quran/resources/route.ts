import { NextRequest, NextResponse } from "next/server";

import { loadQuranResources } from "@/lib/data";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sessionContext = await getSession(request);
  try {
    return NextResponse.json(await loadQuranResources(sessionContext.session));
  } catch (error) {
    console.error("Quran resources request failed", { message: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ error: "Quran resources are unavailable right now." }, { status: 502 });
  }
}

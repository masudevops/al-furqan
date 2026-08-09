import { NextResponse } from "next/server";
import { jsDelivrHadithAdapter } from "@/lib/hadith";

export const dynamic = "force-dynamic";

export async function GET() {
  try { return NextResponse.json({ error: null, items: await jsDelivrHadithAdapter.collections() }); }
  catch { return NextResponse.json({ error: "Hadith collections are unavailable right now.", items: [] }, { status: 502 }); }
}

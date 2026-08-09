import { NextResponse } from "next/server";
import { HADITH_ENABLED } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!HADITH_ENABLED) {
    return NextResponse.json({ error: "Hadith is disabled pending verified Sunnah.com integration.", item: null }, { status: 503 });
  }
  return NextResponse.json({ error: "Sunnah.com integration is not configured.", item: null }, { status: 501 });
}

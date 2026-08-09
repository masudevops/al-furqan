import { NextRequest, NextResponse } from "next/server";
import { jsDelivrHadithAdapter } from "@/lib/hadith";

export const dynamic = "force-dynamic";
const valid = (value: string) => /^[a-z0-9-]+$/.test(value);

export async function GET(request: NextRequest, { params }: { params: { collection: string } }) {
  if (!valid(params.collection)) return NextResponse.json({ error: "Invalid collection.", items: [] }, { status: 400 });
  const section = request.nextUrl.searchParams.get("section") ?? undefined;
  const query = request.nextUrl.searchParams.get("query")?.trim() ?? undefined;
  if (section && !/^\d+$/.test(section)) return NextResponse.json({ error: "Invalid book.", items: [] }, { status: 400 });
  if (query && query.length > 120) return NextResponse.json({ error: "Search is too long.", items: [] }, { status: 400 });
  try {
    const items = await jsDelivrHadithAdapter.list(params.collection, query ? undefined : section, query);
    return NextResponse.json({ error: null, items });
  } catch { return NextResponse.json({ error: "Hadith content is unavailable right now.", items: [] }, { status: 502 }); }
}

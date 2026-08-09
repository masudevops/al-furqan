import { NextResponse } from "next/server";
import { jsDelivrHadithAdapter } from "@/lib/hadith";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { collection: string; number: string } }) {
  if (!/^[a-z0-9-]+$/.test(params.collection) || !/^\d+$/.test(params.number)) return NextResponse.json({ error: "Invalid hadith reference.", item: null }, { status: 400 });
  try {
    const item = await jsDelivrHadithAdapter.one(params.collection, Number(params.number));
    return item ? NextResponse.json({ error: null, item }) : NextResponse.json({ error: "This source does not provide Arabic, translation, and grade together for that hadith.", item: null }, { status: 404 });
  } catch { return NextResponse.json({ error: "Hadith content is unavailable right now.", item: null }, { status: 502 }); }
}

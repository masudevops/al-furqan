import { NextRequest, NextResponse } from "next/server";
import { publicContentJson } from "@/lib/public-content";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date") ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(`${date}T12:00:00Z`))) return NextResponse.json({ error: "Enter a valid Gregorian date." }, { status: 400 });
  try {
    const response = await fetch(`https://ummahapi.com/api/hijri-date?date=${date}`, { next: { revalidate: 86_400 } });
    const payload = await response.json();
    const hijri = payload?.data?.hijri;
    if (!response.ok || payload?.success !== true || !hijri?.date || !hijri?.formatted) throw new Error("Hijri source failed");
    return publicContentJson({ date: String(hijri.date), day: Number(hijri.day), error: null, formatted: String(hijri.formatted), month: Number(hijri.month), monthName: String(hijri.month_name ?? ""), monthNameArabic: String(hijri.month_name_arabic ?? ""), year: Number(hijri.year) });
  } catch (error) {
    console.error("UmmahAPI Hijri date request failed", { date, message: error instanceof Error ? error.message : "Unknown error" });
    return NextResponse.json({ error: "The calculated Hijri date is unavailable right now." }, { status: 502 });
  }
}

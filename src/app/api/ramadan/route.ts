import { NextRequest, NextResponse } from "next/server";
import { publicContentJson } from "@/lib/public-content";

const METHODS: Record<string, string> = { "1": "Karachi", "2": "ISNA", "3": "MWL", "4": "Makkah", "5": "Egypt" };
const HIGH_LATITUDE = new Set(["recommended", "MiddleOfNight", "SeventhOfNight", "TwilightAngle"]);

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const latitude = Number(search.get("latitude"));
  const longitude = Number(search.get("longitude"));
  const year = Number(search.get("year"));
  if (!Number.isFinite(latitude) || Math.abs(latitude) > 90 || !Number.isFinite(longitude) || Math.abs(longitude) > 180 || !Number.isInteger(year) || year < 2020 || year > 2100) {
    return NextResponse.json({ error: "Valid coordinates and year are required." }, { status: 400 });
  }
  const upstream = new URL(`https://ummahapi.com/api/ramadan/${year}`);
  upstream.searchParams.set("lat", String(latitude));
  upstream.searchParams.set("lng", String(longitude));
  upstream.searchParams.set("method", METHODS[search.get("method") ?? ""] ?? "ISNA");
  upstream.searchParams.set("madhab", search.get("school") === "1" ? "Hanafi" : "Shafi");
  const timezone = search.get("timezone")?.trim();
  if (timezone && timezone.length <= 80 && /^[A-Za-z_+\-/]+$/.test(timezone)) upstream.searchParams.set("timezone", timezone);
  const highLatitude = search.get("highLatitude") ?? "recommended";
  upstream.searchParams.set("highLatitudeRule", HIGH_LATITUDE.has(highLatitude) ? highLatitude : "recommended");
  try {
    const response = await fetch(upstream, { next: { revalidate: 86_400 } });
    const payload = await response.json();
    const source = payload?.data;
    if (!response.ok || payload?.success !== true || !source || !Array.isArray(source.days)) throw new Error("Ramadan source failed");
    const days = source.days.map((day: Record<string, unknown>) => ({
      date: String(day.date ?? ""), day: Number(day.day), dayName: String(day.day_name ?? ""), fajr: String(day.fajr ?? ""), hijriDate: String(day.hijri_date ?? ""), iftar: String(day.iftar ?? ""), isha: String(day.isha ?? ""), suhoorEnds: String(day.suhoor_ends ?? ""),
    })).filter((day: { date: string; day: number; fajr: string; iftar: string }) => day.date && day.day >= 1 && day.day <= 30 && day.fajr && day.iftar);
    if (!days.length) throw new Error("No Ramadan days returned");
    return publicContentJson({ calculationMethod: String(source.calculation_method ?? ""), days, end: String(source.ramadan_end ?? ""), error: null, hijriYear: Number(source.hijri_year), madhab: String(source.madhab ?? ""), start: String(source.ramadan_start ?? ""), timezone: String(source.timezone ?? ""), year });
  } catch (error) {
    console.error("UmmahAPI Ramadan request failed", { message: error instanceof Error ? error.message : "Unknown error", year });
    return NextResponse.json({ error: "The Ramadan timetable is unavailable right now." }, { status: 502 });
  }
}

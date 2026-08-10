import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams;
  const method = /^\d+$/.test(search.get("method") ?? "") ? search.get("method")! : "2";
  const school = search.get("school") === "1" ? "1" : "0";
  const latitude = search.get("latitude");
  const longitude = search.get("longitude");
  const city = search.get("city")?.trim();
  const country = search.get("country")?.trim();
  const month = Number(search.get("month"));
  const year = Number(search.get("year"));
  const monthly = month >= 1 && month <= 12 && year >= 2020 && year <= 2100;
  const upstream = new URL(latitude && longitude
    ? `https://api.aladhan.com/v1/${monthly ? "calendar" : "timings"}`
    : `https://api.aladhan.com/v1/${monthly ? "calendarByCity" : "timingsByCity"}`);
  if (latitude && longitude && Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude)) && Math.abs(Number(latitude)) <= 90 && Math.abs(Number(longitude)) <= 180) {
    upstream.searchParams.set("latitude", latitude);
    upstream.searchParams.set("longitude", longitude);
  } else if (city && country) {
    if (city.length > 100 || country.length > 100) return NextResponse.json({ error: "Invalid location." }, { status: 400 });
    upstream.searchParams.set("city", city);
    upstream.searchParams.set("country", country);
  } else {
    return NextResponse.json({ error: "A location is required." }, { status: 400 });
  }
  upstream.searchParams.set("method", method);
  upstream.searchParams.set("school", school);
  if (monthly) {
    upstream.searchParams.set("month", String(month));
    upstream.searchParams.set("year", String(year));
  }
  try {
    const response = await fetch(upstream, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || payload?.code !== 200) throw new Error("Prayer source failed");
    const normalize = (data: Record<string, unknown>) => {
      const date = data.date as Record<string, unknown>;
      const gregorian = date.gregorian as Record<string, unknown>;
      const hijri = date.hijri as Record<string, unknown>;
      const hijriMonth = hijri.month as Record<string, unknown>;
      return {
        date: String(date.readable ?? ""),
        gregorian: String(gregorian.date ?? ""),
        hijri: `${String(hijri.day ?? "")} ${String(hijriMonth.en ?? "")} ${String(hijri.year ?? "")} AH`,
        timings: data.timings,
      };
    };
    if (monthly) {
      const days = Array.isArray(payload.data) ? payload.data.map(normalize) : [];
      const meta = payload.data?.[0]?.meta ?? {};
      return NextResponse.json({ days, error: null, timezone: meta.timezone });
    }
    return NextResponse.json({
      ...normalize(payload.data),
      error: null,
      latitude: Number(payload.data.meta.latitude),
      longitude: Number(payload.data.meta.longitude),
      timezone: payload.data.meta.timezone,
    });
  } catch {
    return NextResponse.json({ error: "Prayer times are unavailable right now." }, { status: 502 });
  }
}

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
  const upstream = new URL(latitude && longitude ? "https://api.aladhan.com/v1/timings" : "https://api.aladhan.com/v1/timingsByCity");
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
  try {
    const response = await fetch(upstream, { cache: "no-store" });
    const payload = await response.json();
    if (!response.ok || payload?.code !== 200) throw new Error("Prayer source failed");
    return NextResponse.json({
      error: null,
      date: payload.data.date.readable,
      hijri: `${payload.data.date.hijri.day} ${payload.data.date.hijri.month.en} ${payload.data.date.hijri.year} AH`,
      timezone: payload.data.meta.timezone,
      timings: payload.data.timings,
    });
  } catch {
    return NextResponse.json({ error: "Prayer times are unavailable right now." }, { status: 502 });
  }
}

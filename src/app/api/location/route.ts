import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city")?.trim();
  const country = request.nextUrl.searchParams.get("country")?.trim();
  if (!city || !country || city.length > 100 || country.length > 100) {
    return NextResponse.json({ error: "Enter a valid city and country." }, { status: 400 });
  }
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("city", city);
  url.searchParams.set("country", country);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  try {
    const response = await fetch(url, {
      headers: { "Accept-Language": "en", "User-Agent": "Al-Furqan/1.0 (https://al-furqan.app)" },
      next: { revalidate: 86_400 },
    });
    const items = await response.json();
    const item = Array.isArray(items) ? items[0] : null;
    const latitude = Number(item?.lat);
    const longitude = Number(item?.lon);
    if (!response.ok || !Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error("not found");
    return NextResponse.json({ location: { city, country, latitude, longitude, label: `${city}, ${country}` } });
  } catch {
    return NextResponse.json({ error: "We could not find that city. Check the spelling and try again." }, { status: 404 });
  }
}

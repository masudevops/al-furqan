import { NextRequest } from "next/server";
import { dayKey, deviceOf, getAnalyticsStore, isBot, normalizePath, referrerHost, sectionOf, visitorHash } from "@/lib/analytics";

export const dynamic = "force-dynamic";

const empty = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

// Receives one page view from the site's own beacon. Nothing identifying is stored; see src/lib/analytics.ts.
export async function POST(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") ?? "";
  if (isBot(userAgent) || request.headers.get("sec-gpc") === "1" || request.headers.get("dnt") === "1") return empty();
  let body: Record<string, unknown> = {};
  try { body = JSON.parse((await request.text()).slice(0, 2_000)) as Record<string, unknown>; } catch { return empty(); }
  const path = normalizePath(body.path);
  if (!path) return empty();
  const day = dayKey();
  const ip = request.headers.get("cf-connecting-ip") ?? request.headers.get("x-real-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "";
  const country = (request.headers.get("cf-ipcountry") ?? request.headers.get("x-vercel-ip-country") ?? "").toUpperCase();
  try {
    const store = getAnalyticsStore();
    await store.record({
      day, path, section: sectionOf(path) ?? "Other",
      referrer: referrerHost(body.referrer, request.nextUrl.hostname),
      device: deviceOf(body.width),
      country: /^[A-Z]{2}$/.test(country) && country !== "XX" ? country : null,
      visitor: visitorHash(await store.salt(day), ip, userAgent),
    });
  } catch (error) {
    // Counting must never affect reading.
    console.error("Page view not recorded", { message: error instanceof Error ? error.message : "Unknown error" });
  }
  return empty();
}

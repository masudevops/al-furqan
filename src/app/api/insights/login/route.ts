import { NextRequest, NextResponse } from "next/server";
import { INSIGHTS_COOKIE, createInsightsToken, insightsEnabled, passwordMatches } from "@/lib/insights-auth";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!insightsEnabled()) return new NextResponse(null, { status: 404 });
  const form = await request.formData().catch(() => null);
  const target = new URL("/insights", request.url);
  if (form?.get("action") === "logout") {
    const response = NextResponse.redirect(target, 303);
    response.cookies.delete(INSIGHTS_COOKIE);
    return response;
  }
  if (!passwordMatches(form?.get("password"))) {
    // Slows down password guessing.
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    target.searchParams.set("error", "1");
    return NextResponse.redirect(target, 303);
  }
  const token = createInsightsToken();
  const response = NextResponse.redirect(target, 303);
  response.cookies.set(INSIGHTS_COOKIE, token.value, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: token.maxAge });
  return response;
}

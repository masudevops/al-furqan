import { NextRequest } from "next/server";

import { loadQuranReflectFeed, parsePositiveInteger } from "@/lib/data";
import { createPublicContentSession, publicContentJson } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const page = parsePositiveInteger(request.nextUrl.searchParams.get("page")) ?? 1;
  const payload = await loadQuranReflectFeed(createPublicContentSession(), page);
  return publicContentJson(payload, payload.error ? 502 : 200);
}

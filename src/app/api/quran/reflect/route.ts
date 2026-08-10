import { NextRequest } from "next/server";

import { loadQuranReflectFeed, parsePositiveInteger } from "@/lib/data";
import { withSessionJson } from "@/lib/route-helpers";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const context = await getSession(request);
  const page = parsePositiveInteger(request.nextUrl.searchParams.get("page")) ?? 1;
  const payload = await loadQuranReflectFeed(context.session, page);
  return withSessionJson(context, payload, payload.error ? 502 : 200);
}

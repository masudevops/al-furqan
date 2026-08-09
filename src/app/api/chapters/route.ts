import { NextRequest } from "next/server";
import { loadContentPreviewData } from "@/lib/data";
import { withSessionJson } from "@/lib/route-helpers";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const context = await getSession(request);
  const payload = await loadContentPreviewData(context.session, 114);
  return withSessionJson(context, payload, payload.error ? 502 : 200);
}

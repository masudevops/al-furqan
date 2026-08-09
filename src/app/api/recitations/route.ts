import { NextRequest } from "next/server";

import { loadRecitationResources } from "@/lib/data";
import { getSession } from "@/lib/session";
import { withSessionJson } from "@/lib/route-helpers";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const context = await getSession(request);
  return withSessionJson(context, await loadRecitationResources(context.session));
}

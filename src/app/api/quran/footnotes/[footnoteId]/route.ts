import { NextRequest } from "next/server";

import { loadFootnote, parsePositiveInteger } from "@/lib/data";
import { withSessionJson } from "@/lib/route-helpers";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: { footnoteId: string } }) {
  const context = await getSession(request);
  const id = parsePositiveInteger(params.footnoteId);
  if (!id) return withSessionJson(context, { message: "A valid footnote is required." }, 400);
  try {
    return withSessionJson(context, await loadFootnote(context.session, id));
  } catch {
    return withSessionJson(context, { message: "This translation footnote is unavailable right now." }, 502);
  }
}

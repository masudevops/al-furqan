import { NextRequest } from "next/server";
import { loadTafsirResources } from "@/lib/data";
import { withSessionJson } from "@/lib/route-helpers";
import { getSession } from "@/lib/session";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){const context=await getSession(request);return withSessionJson(context,await loadTafsirResources(context.session))}

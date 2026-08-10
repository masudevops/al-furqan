import { NextRequest } from "next/server";
import { loadStructureVerses,parsePositiveInteger } from "@/lib/data";
import { withSessionJson } from "@/lib/route-helpers";
import { getSession } from "@/lib/session";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){const context=await getSession(request);const kind=request.nextUrl.searchParams.get("kind");const id=parsePositiveInteger(request.nextUrl.searchParams.get("id"));const max=kind==="juz"?30:kind==="hizb"?60:kind==="rub"?240:0;if(!id||id>max||!(kind==="juz"||kind==="hizb"||kind==="rub"))return withSessionJson(context,{error:"Invalid Quran structure reference."},400);try{return withSessionJson(context,{error:null,items:await loadStructureVerses(context.session,kind,id)})}catch{return withSessionJson(context,{error:"Quran structure is unavailable right now."},502)}}

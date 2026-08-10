import { NextRequest } from "next/server";
import { loadMushafPage,parsePositiveInteger } from "@/lib/data";
import { withSessionJson } from "@/lib/route-helpers";
import { getSession } from "@/lib/session";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest,{params}:{params:{pageNumber:string}}){const context=await getSession(request);const page=parsePositiveInteger(params.pageNumber);if(!page||page>604)return withSessionJson(context,{error:"Mushaf page must be between 1 and 604."},400);try{return withSessionJson(context,await loadMushafPage(context.session,page))}catch{return withSessionJson(context,{error:"Mushaf page is unavailable right now. No substitute text has been used."},502)}}

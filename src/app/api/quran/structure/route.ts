import { NextRequest } from "next/server";
import { loadStructureVerses,parsePositiveInteger } from "@/lib/data";
import { createPublicContentSession,publicContentJson } from "@/lib/public-content";
export const dynamic="force-dynamic";
export async function GET(request:NextRequest){const kind=request.nextUrl.searchParams.get("kind");const id=parsePositiveInteger(request.nextUrl.searchParams.get("id"));const max=kind==="juz"?30:kind==="hizb"?60:kind==="rub"?240:kind==="ruku"?558:kind==="manzil"?7:0;if(!id||id>max||!(kind==="juz"||kind==="hizb"||kind==="rub"||kind==="ruku"||kind==="manzil"))return publicContentJson({error:"Invalid Quran structure reference."},400);try{return publicContentJson({error:null,items:await loadStructureVerses(createPublicContentSession(),kind,id)})}catch{return publicContentJson({error:"Quran structure is unavailable right now."},502)}}

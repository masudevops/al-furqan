import { loadMushafPage,parsePositiveInteger } from "@/lib/data";
import { createPublicContentSession,publicContentJson } from "@/lib/public-content";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:{pageNumber:string}}){const page=parsePositiveInteger(params.pageNumber);if(!page||page>604)return publicContentJson({error:"Mushaf page must be between 1 and 604."},400);try{return publicContentJson(await loadMushafPage(createPublicContentSession(),page))}catch{return publicContentJson({error:"Mushaf page is unavailable right now. No substitute text has been used."},502)}}

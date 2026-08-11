import { NextResponse } from "next/server";
import { fetchDuaPath } from "@/lib/dua";

// The upstream catalog is runtime data. Do not make a production build depend
// on the public provider being reachable while Next.js prerenders route handlers.
export const dynamic = "force-dynamic";

export async function GET(){try{return NextResponse.json({items:await fetchDuaPath("/categories"),error:null})}catch{return NextResponse.json({items:[],error:"Dua content is unavailable right now."},{status:502})}}

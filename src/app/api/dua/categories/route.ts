import { NextResponse } from "next/server";
import { fetchDuaPath } from "@/lib/dua";
export async function GET(){try{return NextResponse.json({items:await fetchDuaPath("/categories"),error:null})}catch{return NextResponse.json({items:[],error:"Dua content is unavailable right now."},{status:502})}}

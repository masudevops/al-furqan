import { NextResponse } from "next/server";
import { fetchDuaPath } from "@/lib/dua";
export async function GET(_request:Request,{params}:{params:{slug:string}}){if(!/^[a-z0-9-]+$/.test(params.slug))return NextResponse.json({error:"Invalid category."},{status:400});try{return NextResponse.json({items:await fetchDuaPath(`/categories/${params.slug}`),error:null})}catch{return NextResponse.json({items:[],error:"Dua content is unavailable right now."},{status:502})}}

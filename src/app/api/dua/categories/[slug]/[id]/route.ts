import { NextResponse } from "next/server";
import { fetchDuaPath } from "@/lib/dua";
export async function GET(_request:Request,{params}:{params:{slug:string;id:string}}){if(!/^[a-z0-9-]+$/.test(params.slug)||!/^\d+$/.test(params.id))return NextResponse.json({error:"Invalid dua reference."},{status:400});try{return NextResponse.json({item:await fetchDuaPath(`/categories/${params.slug}/${params.id}`),error:null})}catch{return NextResponse.json({item:null,error:"Dua content is unavailable right now."},{status:502})}}

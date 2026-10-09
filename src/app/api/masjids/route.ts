import {NextRequest,NextResponse} from "next/server";
import {fetchOpenStreetMapMasjids,fetchOvertureMasjids,fetchTakbeerTimeMasjids,mergeMasjids,overtureTilesBaseUrl} from "@/lib/masjids";

export const dynamic="force-dynamic";
const MASJID_RESULT_LIMIT=100;
export async function GET(request:NextRequest){
  const latitude=Number(request.nextUrl.searchParams.get("latitude")),longitude=Number(request.nextUrl.searchParams.get("longitude")),radius=Math.min(50000,Math.max(1000,Number(request.nextUrl.searchParams.get("radius"))||20000));
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)return NextResponse.json({error:"Invalid coordinates."},{status:400});
  const input={latitude,longitude,radius},providers={openStreetMap:fetchOpenStreetMapMasjids,takbeerTime:fetchTakbeerTimeMasjids,...(overtureTilesBaseUrl()?{overtureMaps:fetchOvertureMasjids}:{})};
  const settled=await Promise.all(Object.entries(providers).map(async([name,load])=>[name,await load(input).catch(()=>null)] as const));
  const groups=settled.flatMap(([,items])=>items?[items]:[]),sources=Object.fromEntries(settled.map(([name,items])=>[name,Boolean(items)]));
  if(!groups.length)return NextResponse.json({items:[],error:"Nearby mosque data is unavailable right now."},{status:502});
  const merged=mergeMasjids(groups,Number.POSITIVE_INFINITY);
  return NextResponse.json({items:merged.slice(0,MASJID_RESULT_LIMIT),total:merged.length,error:null,partial:groups.length<settled.length,sources},{headers:{"Cache-Control":"public, s-maxage=3600, stale-while-revalidate=86400"}});
}

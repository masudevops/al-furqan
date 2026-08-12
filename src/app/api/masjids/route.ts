import {NextRequest,NextResponse} from "next/server";
import {fetchOpenStreetMapMasjids,fetchTakbeerTimeMasjids,mergeMasjids} from "@/lib/masjids";

export const dynamic="force-dynamic";
export async function GET(request:NextRequest){
  const latitude=Number(request.nextUrl.searchParams.get("latitude")),longitude=Number(request.nextUrl.searchParams.get("longitude")),radius=Math.min(50000,Math.max(1000,Number(request.nextUrl.searchParams.get("radius"))||20000));
  if(!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180)return NextResponse.json({error:"Invalid coordinates."},{status:400});
  const settled=await Promise.allSettled([fetchOpenStreetMapMasjids({latitude,longitude,radius}),fetchTakbeerTimeMasjids({latitude,longitude,radius})]);
  const groups=settled.flatMap(result=>result.status==="fulfilled"?[result.value]:[]),sources={openStreetMap:settled[0].status==="fulfilled",takbeerTime:settled[1].status==="fulfilled"};
  if(!groups.length)return NextResponse.json({items:[],error:"Nearby mosque data is unavailable right now."},{status:502});
  return NextResponse.json({items:mergeMasjids(groups),error:null,partial:groups.length<2,sources},{headers:{"Cache-Control":"public, s-maxage=3600, stale-while-revalidate=86400"}});
}

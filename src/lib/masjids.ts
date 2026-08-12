export type Mosque={id:string;name:string;address:string|null;distanceKm:number;latitude:number;longitude:number;phone:string|null;website:string|null;congregationTimes:Record<string,string|string[]>|null};
type NearbyInput={latitude:number;longitude:number;radius:number};

const distance=(a:number,b:number,c:number,d:number)=>{const rad=(n:number)=>n*Math.PI/180,x=rad(c-a),y=rad(d-b),q=Math.sin(x/2)**2+Math.cos(rad(a))*Math.cos(rad(c))*Math.sin(y/2)**2;return 6371*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q))};
const text=(value:unknown)=>typeof value==="string"&&value.trim()?value.trim():null;
const safeUrl=(value:unknown)=>{const candidate=text(value);if(!candidate)return null;try{const url=new URL(candidate.startsWith("http")?candidate:`https://${candidate}`);return url.protocol==="https:"||url.protocol==="http:"?url.toString():null}catch{return null}};

export async function fetchOpenStreetMapMasjids({latitude,longitude,radius}:NearbyInput):Promise<Mosque[]>{
  const query=`[out:json][timeout:20];(nwr(around:${radius},${latitude},${longitude})[amenity=place_of_worship][religion=muslim];nwr(around:${radius},${latitude},${longitude})[building=mosque];nwr(around:${radius},${latitude},${longitude})[amenity=mosque];);out center tags;`;
  let lastError:unknown;
  for(const endpoint of ["https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter"]){try{
    const response=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded","User-Agent":"Al-Furqan/1.0 (https://al-furqan.app)"},body:new URLSearchParams({data:query}),next:{revalidate:3600}}),payload=await response.json();
    if(!response.ok||!Array.isArray(payload.elements))throw new Error("Invalid Overpass response");
    return payload.elements.map((item:Record<string,unknown>)=>{const tags=(item.tags??{})as Record<string,string>,center=(item.center??{})as Record<string,number>,lat=Number(item.lat??center.lat),lon=Number(item.lon??center.lon),address=[tags["addr:housenumber"],tags["addr:street"],tags["addr:city"],tags["addr:state"],tags["addr:postcode"]].filter(Boolean).join(" ");return{id:`osm:${item.type}:${item.id}`,name:tags.name||tags["name:en"]||tags["name:ar"]||"Unnamed mosque",latitude:lat,longitude:lon,address:address||null,distanceKm:distance(latitude,longitude,lat,lon),phone:text(tags.phone||tags["contact:phone"]),website:safeUrl(tags.website||tags["contact:website"]),congregationTimes:null}}).filter((item:Mosque)=>Number.isFinite(item.latitude)&&Number.isFinite(item.longitude));
  }catch(error){lastError=error}}
  throw lastError;
}

export async function fetchTakbeerTimeMasjids({latitude,longitude,radius}:NearbyInput):Promise<Mosque[]>{
  const url=new URL("https://takbeertime.com/api/mosques/nearby");url.search=new URLSearchParams({lat:String(latitude),lng:String(longitude),radius:String(radius),limit:"100"}).toString();
  const response=await fetch(url,{headers:{Accept:"application/json"},signal:AbortSignal.timeout(12000),next:{revalidate:3600}}),payload=await response.json();
  if(!response.ok||!Array.isArray(payload.data))throw new Error("Invalid Takbeer Time response");
  return payload.data.map((item:Record<string,unknown>)=>{const lat=Number(item.latitude),lon=Number(item.longitude),verified=item.effectiveKeeperIsVerifiedSchedule===true&&item.effectiveTimings&&typeof item.effectiveTimings==="object"?item.effectiveTimings as Record<string,string|string[]>:null;return{id:`takbeer:${item.id}`,name:text(item.name)||text(item.nameArabic)||"Unnamed mosque",latitude:lat,longitude:lon,address:[text(item.addressLine1),text(item.city),text(item.country)].filter(Boolean).join(", ")||null,distanceKm:Number(item.distanceMeters)/1000||distance(latitude,longitude,lat,lon),phone:null,website:null,congregationTimes:verified}}).filter((item:Mosque)=>Number.isFinite(item.latitude)&&Number.isFinite(item.longitude));
}

const normalizedName=(name:string)=>name.toLowerCase().replace(/\b(masjid|mosque|islamic|center|centre)\b/g,"").replace(/[^a-z0-9]/g,"");
export function mergeMasjids(groups:Mosque[][],limit=60){const merged:Mosque[]=[];for(const item of groups.flat().sort((a,b)=>a.distanceKm-b.distanceKm)){const duplicate=merged.find(existing=>distance(existing.latitude,existing.longitude,item.latitude,item.longitude)<.12&&(normalizedName(existing.name)===normalizedName(item.name)||distance(existing.latitude,existing.longitude,item.latitude,item.longitude)<.04));if(duplicate){duplicate.address=duplicate.address||item.address;duplicate.phone=duplicate.phone||item.phone;duplicate.website=duplicate.website||item.website;duplicate.congregationTimes=duplicate.congregationTimes||item.congregationTimes}else merged.push({...item})}return merged.slice(0,limit)}

export interface DuaCategory { name:string; slug:string; total:number }
export interface DuaSummary { id:number; title:string; category:string; categoryName:string }
import type { DuaAudioSource } from "@/lib/dua-audio";

export interface DuaEntry extends DuaSummary { arabic:string; latin:string; translation:string; notes:string; fawaid:string; source:string; audio:DuaAudioSource|null }

const BASE = "https://dua-dhikr.vercel.app";
export async function fetchDuaPath(path:string):Promise<unknown>{
  const response=await fetch(`${BASE}${path}`,{headers:{"Accept-Language":"en"},next:{revalidate:86_400}});
  const payload=await response.json();
  if(!response.ok||payload?.statusCode!==200) throw new Error("Dua source unavailable");
  return payload.data;
}

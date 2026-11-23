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

// Dua titles across every category. The catalogue is small (about 100 entries) and each list is cached for a day.
export async function searchDuaTitles(query:string):Promise<DuaSummary[]>{
  const words=query.toLowerCase().split(/\s+/).filter(Boolean);
  if(!words.length)return [];
  const categories=(await fetchDuaPath("/categories")) as DuaCategory[];
  const lists=await Promise.all(categories.map((category)=>fetchDuaPath(`/categories/${category.slug}`) as Promise<DuaSummary[]>));
  return lists.flat().filter((dua)=>{const text=`${dua.title} ${dua.categoryName}`.toLowerCase();return words.every((word)=>text.includes(word));});
}

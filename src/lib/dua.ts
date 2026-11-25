export interface DuaCategory { name:string; slug:string; total:number }
export interface DuaSummary { id:number; title:string; category:string; categoryName:string }
import type { DuaAudioSource } from "@/lib/dua-audio";

export interface DuaEntry extends DuaSummary { arabic:string; latin:string; translation:string; notes:string; fawaid:string; source:string; audio:DuaAudioSource|null }

// The fitrahive/dua-dhikr dataset (MIT), read from its GitHub repository at a pinned commit via jsDelivr.
// Its hosted API (dua-dhikr.vercel.app) was disabled in Nov 2026; this rebuilds that API's English responses from the same files.
const DATA_BASE = "https://cdn.jsdelivr.net/gh/fitrahive/dua-dhikr@f42f895f914319a844c3e3c2279483cae060ea19/data";
type DuaFileItem = { title:string; arabic:string; latin:string; translation:string; notes:string; fawaid:string; source:string };

async function fetchData<T>(file:string):Promise<T>{
  const baseUrl=process.env.DUA_DATASET_URL?.trim()||DATA_BASE;
  const response=await fetch(`${baseUrl}/${file}`,{next:{revalidate:86_400}});
  if(!response.ok) throw new Error(`Dua source unavailable: ${response.status}`);
  return response.json() as Promise<T>;
}

const englishCategories=async()=>((await fetchData<Record<string,Array<{name:string;slug:string}>>>("core/categories.json")).en??[]);
const categoryItems=(slug:string)=>fetchData<DuaFileItem[]>(`dua-dhikr/${slug}/en.json`);

// Same paths and shapes as the former hosted API: /categories, /categories/{slug} and /categories/{slug}/{id} (ids start at 1).
export async function fetchDuaPath(path:string):Promise<unknown>{
  const [, root, slug, id, extra]=path.split("/");
  if(root!=="categories"||extra!==undefined) throw new Error("Unknown Dua path");
  const categories=await englishCategories();
  if(!slug) return Promise.all(categories.map(async(category)=>({...category,total:(await categoryItems(category.slug)).length})));
  const category=categories.find((entry)=>entry.slug===slug);
  if(!category) throw new Error("Unknown Dua category");
  const items=await categoryItems(slug);
  if(id===undefined) return items.map((item,index)=>({id:index+1,title:item.title,category:slug,categoryName:category.name}));
  const item=items[Number(id)-1];
  if(!/^\d+$/.test(id)||!item) throw new Error("Unknown Dua entry");
  return {id:Number(id),title:item.title,category:slug,categoryName:category.name,arabic:item.arabic,latin:item.latin,translation:item.translation,notes:item.notes,fawaid:item.fawaid,source:item.source};
}

// Dua titles across every category. The catalogue is small (about 100 entries) and each list is cached for a day.
export async function searchDuaTitles(query:string):Promise<DuaSummary[]>{
  const words=query.toLowerCase().split(/\s+/).filter(Boolean);
  if(!words.length)return [];
  const categories=(await fetchDuaPath("/categories")) as DuaCategory[];
  const lists=await Promise.all(categories.map((category)=>fetchDuaPath(`/categories/${category.slug}`) as Promise<DuaSummary[]>));
  return lists.flat().filter((dua)=>{const text=`${dua.title} ${dua.categoryName}`.toLowerCase();return words.every((word)=>text.includes(word));});
}

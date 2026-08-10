import { DuaDetail } from "@/components/dua-browser";
export default function Page({params}:{params:{slug:string;id:string}}){return <DuaDetail slug={params.slug} id={params.id}/>}

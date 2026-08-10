import { DuaCategoryList } from "@/components/dua-browser";
export default function Page({params}:{params:{slug:string}}){return <DuaCategoryList slug={params.slug}/>}

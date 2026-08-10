import { QuranStructureReader } from "@/components/quran-structure";
export default function Page({params}:{params:{kind:string;id:string}}){return <QuranStructureReader kind={params.kind} id={Number(params.id)}/>}

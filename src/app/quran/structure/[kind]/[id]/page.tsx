import { notFound } from "next/navigation";
import { QuranStructureReader } from "@/components/quran-structure";
const limits:Record<string,number>={juz:30,hizb:60,rub:240,ruku:558,manzil:7};
export default function Page({params}:{params:{kind:string;id:string}}){const id=Number(params.id);if(!limits[params.kind]||!Number.isInteger(id)||id<1||id>limits[params.kind])notFound();return <QuranStructureReader kind={params.kind} id={id}/>}

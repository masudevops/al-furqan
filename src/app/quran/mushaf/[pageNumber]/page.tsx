import MushafPage from "@/components/mushaf-page";
export default function Page({params}:{params:{pageNumber:string}}){return <MushafPage pageNumber={Math.min(604,Math.max(1,Number(params.pageNumber)||1))}/>}

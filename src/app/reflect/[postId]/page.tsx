import QuranReflectDetail from "@/components/quran-reflect-detail";

export default function Page({ params }: { params: { postId: string } }) {
  return <QuranReflectDetail postId={Number(params.postId)} />;
}

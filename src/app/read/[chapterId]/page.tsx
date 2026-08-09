import { redirect } from "next/navigation";

export default function LegacyReaderPage({ params }: { params: { chapterId: string } }) {
  redirect(`/quran/${params.chapterId}`);
}

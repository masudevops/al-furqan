import type { Metadata } from "next";
import { notFound } from "next/navigation";

import QaidahLesson from "@/components/learn/qaidah-lesson";
import { publicFeatures } from "@/lib/features";
import { lessonForDay } from "@/lib/learn/curriculum";

export const metadata: Metadata = { title: "Noorani Qaidah lesson", robots: { index: false, follow: false } };

export default function QaidahLessonPage({ params }: { params: { day: string } }) {
  const day = Number(params.day);
  if (!publicFeatures.learn || !Number.isInteger(day) || !lessonForDay(day)) notFound();
  return <QaidahLesson day={day} />;
}

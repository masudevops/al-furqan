import type { Metadata } from "next";
import { notFound } from "next/navigation";

import LearnHome from "@/components/learn/learn-home";
import { publicFeatures } from "@/lib/features";

// Draft lessons are never indexed; the whole section 404s if NEXT_PUBLIC_FEATURE_LEARN is set to false.
export const metadata: Metadata = { title: "Learn to read the Quran", robots: { index: false, follow: false } };

export default function LearnPage() {
  if (!publicFeatures.learn) notFound();
  return <LearnHome />;
}

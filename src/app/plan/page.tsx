import type { Metadata } from "next";
import PlanPage from "@/components/plan-page";

export const metadata: Metadata = {
  title: "Quran Reading Plan & Memorisation Tracker",
  description: "Plan a full reading of the Quran in whole Mushaf pages and track the Surahs you've memorised, with gentle review reminders. Saved on your device.",
  alternates: { canonical: "/plan" },
};

export default function Page() {
  return <PlanPage />;
}

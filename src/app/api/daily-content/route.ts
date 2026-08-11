import { utcDayKey } from "@/lib/daily";
import { loadDailyVerse } from "@/lib/data";
import { HADITH_ENABLED } from "@/lib/feature-flags";
import { ummahHadithAdapter } from "@/lib/hadith";
import { createPublicContentSession, publicContentJson } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export async function GET() {
  const day = utcDayKey();
  const [verseResult, hadithResult] = await Promise.allSettled([
    loadDailyVerse(createPublicContentSession(), day),
    HADITH_ENABLED ? ummahHadithAdapter.daily(day) : Promise.resolve(null),
  ]);
  if (verseResult.status === "rejected") console.error("Daily Quran verse request failed", { day, message: verseResult.reason instanceof Error ? verseResult.reason.message : "Unknown error" });
  if (hadithResult.status === "rejected") console.error("Daily Hadith request failed", { day, message: hadithResult.reason instanceof Error ? hadithResult.reason.message : "Unknown error" });
  const verse = verseResult.status === "fulfilled" ? verseResult.value : null;
  const hadith = hadithResult.status === "fulfilled" ? hadithResult.value : null;
  if (!verse && !hadith) return publicContentJson({ day, error: "Daily sourced content is unavailable right now.", hadith: null, verse: null }, 502);
  return publicContentJson({ day, error: null, hadith, verse });
}

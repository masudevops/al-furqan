import { HADITH_ENABLED } from "@/lib/feature-flags";
import { sunnahNowHadithAdapter } from "@/lib/hadith";
import { publicContentJson } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!HADITH_ENABLED) {
    return publicContentJson({ error: "Sunnah browsing is not enabled for this deployment.", items: [] }, 503);
  }
  try {
    return publicContentJson({ error: null, items: await sunnahNowHadithAdapter.collections() });
  } catch (error) {
    console.error("Sunnah.now catalog request failed", { message: error instanceof Error ? error.message : "Unknown error" });
    return publicContentJson({ error: "The sourced Sunnah catalog is unavailable right now.", items: [] }, 502);
  }
}

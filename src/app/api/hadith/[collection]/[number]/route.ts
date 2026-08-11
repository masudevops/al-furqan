import { HADITH_ENABLED } from "@/lib/feature-flags";
import { ummahHadithAdapter } from "@/lib/hadith";
import { publicContentJson } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { collection: string; number: string } }) {
  if (!HADITH_ENABLED) {
    return publicContentJson({ error: "Sunnah browsing is not enabled for this deployment.", item: null }, 503);
  }
  const number = Number(params.number);
  if (!Number.isInteger(number) || number < 1) return publicContentJson({ error: "Enter a valid Hadith number.", item: null }, 400);
  try {
    const item = await ummahHadithAdapter.one(params.collection, number);
    return item ? publicContentJson({ error: null, item }) : publicContentJson({ error: "Hadith not found.", item: null }, 404);
  } catch (error) {
    console.error("UmmahAPI Hadith detail request failed", { collection: params.collection, message: error instanceof Error ? error.message : "Unknown error", number });
    return publicContentJson({ error: "This sourced Hadith is unavailable right now.", item: null }, 502);
  }
}

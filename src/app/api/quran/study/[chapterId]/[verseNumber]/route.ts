import { loadAyahStudy } from "@/lib/data";
import { createPublicContentSession, publicContentJson } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { chapterId: string; verseNumber: string } }) {
  const chapterId = Number(params.chapterId);
  const verseNumber = Number(params.verseNumber);
  if (!Number.isInteger(chapterId) || chapterId < 1 || chapterId > 114 || !Number.isInteger(verseNumber) || verseNumber < 1) {
    return publicContentJson({ error: "Enter a valid Ayah reference." }, 400);
  }
  try {
    return publicContentJson(await loadAyahStudy(createPublicContentSession(), `${chapterId}:${verseNumber}`));
  } catch (error) {
    console.error("Ayah study request failed", { chapterId, message: error instanceof Error ? error.message : "Unknown error", verseNumber });
    return publicContentJson({ error: "Ayah study references are unavailable right now." }, 502);
  }
}

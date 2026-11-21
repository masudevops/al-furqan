import { loadChapterTajweedGlyphs } from "@/lib/data";
import { createPublicContentSession, publicContentJson } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { chapterId: string } }) {
  const chapterId = Number(params.chapterId);
  if (!Number.isInteger(chapterId) || chapterId < 1 || chapterId > 114) {
    return publicContentJson({ error: "Enter a valid Surah number." }, 400);
  }
  try {
    return publicContentJson(await loadChapterTajweedGlyphs(createPublicContentSession(), chapterId));
  } catch (error) {
    console.error("Tajweed glyph request failed", { chapterId, message: error instanceof Error ? error.message : "Unknown error" });
    return publicContentJson({ error: "Official Tajweed glyphs are unavailable right now." }, 502);
  }
}

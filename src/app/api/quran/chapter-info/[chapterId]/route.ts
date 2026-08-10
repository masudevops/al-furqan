import { loadChapterInfo, parsePositiveInteger } from "@/lib/data";
import { createPublicContentSession, publicContentJson } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { chapterId: string } }) {
  const chapterId = parsePositiveInteger(params.chapterId);
  if (!chapterId || chapterId > 114) return publicContentJson({ message: "A valid chapter is required." }, 400);
  try {
    return publicContentJson(await loadChapterInfo(createPublicContentSession(), chapterId));
  } catch {
    return publicContentJson({ message: "Chapter information is unavailable right now." }, 502);
  }
}

import { loadPracticeWords } from "@/lib/data";
import { publicFeatures } from "@/lib/features";
import { createPublicContentSession, publicContentJson } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!publicFeatures.learn) return publicContentJson({ error: "Learn is not enabled for this deployment." }, 404);
  try {
    return publicContentJson(await loadPracticeWords(createPublicContentSession()), 200, "stable");
  } catch (error) {
    console.error("Learn practice words request failed", { message: error instanceof Error ? error.message : "Unknown error" });
    return publicContentJson({ error: "Practice words are unavailable right now." }, 502);
  }
}

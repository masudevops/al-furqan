import { loadQuranResources } from "@/lib/data";
import { createPublicContentSession, publicContentJson } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return publicContentJson(await loadQuranResources(createPublicContentSession()));
  } catch (error) {
    console.error("Quran resources request failed", { message: error instanceof Error ? error.message : "Unknown error" });
    return publicContentJson({ error: "Quran resources are unavailable right now." }, 502);
  }
}

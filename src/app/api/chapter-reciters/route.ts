import { loadChapterReciterResources } from "@/lib/data";
import { createPublicContentSession, publicContentJson } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await loadChapterReciterResources(createPublicContentSession());
  return publicContentJson(payload, payload.error ? 502 : 200);
}

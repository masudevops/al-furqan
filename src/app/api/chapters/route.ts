import { loadContentPreviewData } from "@/lib/data";
import { createPublicContentSession, publicContentJson } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export async function GET() {
  const payload = await loadContentPreviewData(createPublicContentSession(), 114);
  return publicContentJson(payload, payload.error ? 502 : 200);
}

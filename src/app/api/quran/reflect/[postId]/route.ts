import { NextRequest } from "next/server";

import { loadQuranReflectPost } from "@/lib/data";
import { createPublicContentSession, publicContentJson } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, { params }: { params: { postId: string } }) {
  const postId = Number(params.postId);
  if (!Number.isInteger(postId) || postId < 1) return publicContentJson({ error: "Invalid reflection." }, 400);
  try {
    return publicContentJson({ item: await loadQuranReflectPost(createPublicContentSession(), postId) });
  } catch (error) {
    console.error("Quran Reflect post request failed", { message: error instanceof Error ? error.message : "Unknown error", postId });
    return publicContentJson({ error: "This lesson or reflection is unavailable right now." }, 502);
  }
}

import { loadFootnote, parsePositiveInteger } from "@/lib/data";
import { createPublicContentSession, publicContentJson } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: { footnoteId: string } }) {
  const id = parsePositiveInteger(params.footnoteId);
  if (!id) return publicContentJson({ message: "A valid footnote is required." }, 400);
  try {
    return publicContentJson(await loadFootnote(createPublicContentSession(), id));
  } catch {
    return publicContentJson({ message: "This translation footnote is unavailable right now." }, 502);
  }
}

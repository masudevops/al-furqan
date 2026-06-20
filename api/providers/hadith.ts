import {
  jsonResponse,
  validateProviderRequest,
} from "../_shared/http";
import {
  normalizeHadithBooks,
  normalizeHadithChapters,
  normalizeHadiths,
} from "../_shared/providerValidation";
import { fetchUpstreamJson } from "../_shared/upstream";

const upstreamBaseUrl = "https://hadithapi.com/api";
const safeSlug = /^[a-z0-9-]+$/;
const safeChapter = /^[0-9]+$/;

export default {
  async fetch(request: Request): Promise<Response> {
    const invalidRequest = validateProviderRequest(request);
    if (invalidRequest) return invalidRequest;

    const apiKey = process.env.HADITH_API_KEY;
    if (!apiKey) {
      return jsonResponse(
        request,
        { error: "Hadith provider is not configured" },
        503,
        false,
      );
    }

    const searchParams = new URL(request.url).searchParams;
    const action = searchParams.get("action");
    const bookSlug = searchParams.get("bookSlug");
    const chapterId = searchParams.get("chapterId");

    try {
      if (action === "books") {
        const value = await fetchUpstreamJson(
          `${upstreamBaseUrl}/books?apiKey=${encodeURIComponent(apiKey)}`,
        );
        const books = normalizeHadithBooks(value);
        if (!books) throw new Error("Invalid upstream response");
        return jsonResponse(request, { books });
      }

      if (action === "chapters" && bookSlug && safeSlug.test(bookSlug)) {
        const value = await fetchUpstreamJson(
          `${upstreamBaseUrl}/${bookSlug}/chapters?apiKey=${encodeURIComponent(apiKey)}`,
        );
        const chapters = normalizeHadithChapters(value);
        if (!chapters) throw new Error("Invalid upstream response");
        return jsonResponse(request, { chapters });
      }

      if (
        action === "hadiths" &&
        bookSlug &&
        chapterId &&
        safeSlug.test(bookSlug) &&
        safeChapter.test(chapterId)
      ) {
        const upstreamSearch = new URLSearchParams({
          apiKey,
          book: bookSlug,
          chapter: chapterId,
        });
        const value = await fetchUpstreamJson(
          `${upstreamBaseUrl}/hadiths?${upstreamSearch.toString()}`,
        );
        const hadiths = normalizeHadiths(value, bookSlug, chapterId);
        if (!hadiths) throw new Error("Invalid upstream response");
        return jsonResponse(request, { hadiths });
      }

      return jsonResponse(
        request,
        { error: "Invalid Hadith provider request" },
        400,
        false,
      );
    } catch {
      return jsonResponse(
        request,
        { error: "Hadith provider is unavailable" },
        502,
        false,
      );
    }
  },
};

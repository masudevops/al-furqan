import {
  jsonResponse,
  validateProviderRequest,
} from "../_shared/http";
import {
  normalizeIslamHouseDetail,
  normalizeIslamHousePage,
  normalizeIslamHouseSearch,
} from "../_shared/providerValidation";
import { fetchUpstreamJson } from "../_shared/upstream";

const upstreamOrigin = "https://api3.islamhouse.com";
const safeLanguage = /^[a-z]{2,3}$/;
const safeBookId = /^[0-9]+$/;

function parseBoundedInteger(
  value: string | null,
  fallback: number,
  maximum: number,
): number {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isInteger(parsed) && parsed > 0
    ? Math.min(parsed, maximum)
    : fallback;
}

export default {
  async fetch(request: Request): Promise<Response> {
    const invalidRequest = validateProviderRequest(request);
    if (invalidRequest) return invalidRequest;

    const apiKey = process.env.ISLAMHOUSE_API_KEY;
    if (!apiKey) {
      return jsonResponse(
        request,
        { error: "IslamHouse provider is not configured" },
        503,
        false,
      );
    }

    const searchParams = new URL(request.url).searchParams;
    const action = searchParams.get("action");
    const language = searchParams.get("language") || "en";
    if (!safeLanguage.test(language)) {
      return jsonResponse(
        request,
        { error: "Invalid language" },
        400,
        false,
      );
    }

    const apiBase = `${upstreamOrigin}/v3/${encodeURIComponent(apiKey)}`;

    try {
      if (action === "books") {
        const page = parseBoundedInteger(searchParams.get("page"), 1, 10_000);
        const limit = parseBoundedInteger(searchParams.get("limit"), 20, 50);
        const value = await fetchUpstreamJson(
          `${apiBase}/main/books/${language}/${language}/${page}/${limit}/json`,
        );
        const result = normalizeIslamHousePage(value);
        if (!result) throw new Error("Invalid upstream response");
        return jsonResponse(request, result);
      }

      if (action === "search") {
        const query = searchParams.get("query")?.trim();
        if (!query || query.length > 200) {
          return jsonResponse(
            request,
            { error: "Invalid search query" },
            400,
            false,
          );
        }
        const page = parseBoundedInteger(searchParams.get("page"), 1, 10_000);
        const value = await fetchUpstreamJson(
          `${apiBase}/main/site-search/${language}/${encodeURIComponent(query)}/${page}/20/json`,
        );
        const books = normalizeIslamHouseSearch(value);
        if (!books) throw new Error("Invalid upstream response");
        return jsonResponse(request, { books });
      }

      if (action === "detail") {
        const bookId = searchParams.get("bookId");
        if (!bookId || !safeBookId.test(bookId)) {
          return jsonResponse(
            request,
            { error: "Invalid book id" },
            400,
            false,
          );
        }
        const value = await fetchUpstreamJson(
          `${apiBase}/main/get-item/id/${bookId}/json`,
        );
        const book = normalizeIslamHouseDetail(value);
        if (!book) throw new Error("Invalid upstream response");
        return jsonResponse(request, { book });
      }

      return jsonResponse(
        request,
        { error: "Invalid IslamHouse provider request" },
        400,
        false,
      );
    } catch {
      return jsonResponse(
        request,
        { error: "IslamHouse provider is unavailable" },
        502,
        false,
      );
    }
  },
};

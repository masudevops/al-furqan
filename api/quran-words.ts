import { jsonResponse, validateProviderRequest } from "./_shared/http";
import {
  fetchQuranFoundationJson,
  getQuranFoundationConfig,
} from "./_shared/quranFoundation";
import { normalizeVerseWords } from "../src/core/quran/wordByWord";

const integer = /^\d+$/;

export default {
  async fetch(request: Request): Promise<Response> {
    const invalidRequest = validateProviderRequest(request);
    if (invalidRequest) return invalidRequest;

    const config = getQuranFoundationConfig();
    if (!config) {
      return jsonResponse(
        request,
        { error: "Word-by-word provider is not configured" },
        503,
        false,
      );
    }

    const params = new URL(request.url).searchParams;
    const surah = params.get("surah") ?? "";
    const ayah = params.get("ayah") ?? "";
    const language = (params.get("language") ?? "en").toLowerCase();
    const validLanguage = /^[a-z]{2,3}$/.test(language);
    const surahNumber = Number(surah);
    const ayahNumber = Number(ayah);
    if (
      !integer.test(surah) ||
      !integer.test(ayah) ||
      surahNumber < 1 ||
      surahNumber > 114 ||
      ayahNumber < 1 ||
      ayahNumber > 286 ||
      !validLanguage
    ) {
      return jsonResponse(request, { error: "Invalid verse reference" }, 400, false);
    }

    const verseKey = `${surahNumber}:${ayahNumber}`;
    const query = new URLSearchParams({
      language,
      words: "true",
      word_fields: "text_uthmani,text_qpc_hafs,text_imlaei_simple,verse_key,location",
    });

    try {
      const upstream = await fetchQuranFoundationJson(
        config,
        `/content/api/v4/verses/by_key/${encodeURIComponent(verseKey)}?${query}`,
      );
      const words = normalizeVerseWords(upstream);
      if (!words) throw new Error("Invalid Quran Foundation response");
      const response = jsonResponse(request, words, 200, false);
      response.headers.set("Cache-Control", "private, max-age=518400");
      return response;
    } catch {
      return jsonResponse(
        request,
        { error: "Word-by-word content is temporarily unavailable" },
        502,
        false,
      );
    }
  },
};

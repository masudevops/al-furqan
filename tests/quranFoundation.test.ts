import { afterEach, describe, expect, it, vi } from "vitest";
import quranWordsHandler from "../api/quran-words";
import { resetQuranFoundationTokenForTests } from "../api/_shared/quranFoundation";
import { normalizeVerseWords } from "../src/core/quran/wordByWord";

afterEach(() => {
  resetQuranFoundationTokenForTests();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const upstreamVerse = {
  verse: {
    verse_key: "1:1",
    words: [
      {
        id: 1,
        position: 1,
        char_type_name: "word",
        text_uthmani: "بِسْمِ",
        translation: { text: "In the name", language_name: "english" },
        transliteration: { text: "bis'mi", language_name: "english" },
      },
      { id: 2, position: 2, char_type_name: "end" },
    ],
  },
};

describe("Quran Foundation word-by-word integration", () => {
  it("normalizes documented word records and removes end markers", () => {
    expect(normalizeVerseWords(upstreamVerse)).toEqual({
      verseKey: "1:1",
      source: "Quran Foundation",
      words: [{
        id: 1,
        position: 1,
        arabic: "بِسْمِ",
        translation: "In the name",
        transliteration: "bis'mi",
        language: "english",
      }],
    });
  });

  it("requires server-only credentials", async () => {
    vi.stubEnv("QF_CLIENT_ID", "");
    vi.stubEnv("QF_CLIENT_SECRET", "");
    const response = await quranWordsHandler.fetch(
      new Request("https://example.test/api/quran-words?surah=1&ayah=1"),
    );
    expect(response.status).toBe(503);
  });

  it("authenticates server-side and returns a bounded cache response", async () => {
    vi.stubEnv("QF_CLIENT_ID", "client-id");
    vi.stubEnv("QF_CLIENT_SECRET", "client-secret");
    vi.stubEnv("QF_ENV", "production");
    const upstreamFetch = vi.fn(async (url: string | URL | Request) => {
      const value = String(url);
      return value.includes("oauth2/token")
        ? new Response(JSON.stringify({ access_token: "token", expires_in: 3600 }), { status: 200 })
        : new Response(JSON.stringify(upstreamVerse), { status: 200 });
    });
    vi.stubGlobal("fetch", upstreamFetch);

    const response = await quranWordsHandler.fetch(
      new Request("https://example.test/api/quran-words?surah=1&ayah=1"),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, max-age=518400");
    expect(await response.json()).toEqual(expect.objectContaining({ verseKey: "1:1" }));
    expect(upstreamFetch).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(await Promise.all(upstreamFetch.mock.calls.map(async ([, init]) => init)))).not.toContain("client-secret");
  });

  it("rejects invalid verse references before calling upstream", async () => {
    vi.stubEnv("QF_CLIENT_ID", "client-id");
    vi.stubEnv("QF_CLIENT_SECRET", "client-secret");
    const upstreamFetch = vi.fn();
    vi.stubGlobal("fetch", upstreamFetch);
    const response = await quranWordsHandler.fetch(
      new Request("https://example.test/api/quran-words?surah=999&ayah=1"),
    );
    expect(response.status).toBe(400);
    expect(upstreamFetch).not.toHaveBeenCalled();
  });
});

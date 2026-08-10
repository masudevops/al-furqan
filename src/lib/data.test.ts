import { describe, expect, it, vi } from "vitest";

import {
  buildReaderUrlFromKey,
  ensureUserScope,
  getGrantedScopes,
  loadMushafPage,
  loadReaderData,
  loadRecitationResources,
  loadSearchData,
  loadStructureVerses,
  loadTranslationResources,
  parsePositiveInteger,
  parseVerseKey,
  sanitizeTajweedMarkup,
} from "@/lib/data";

const sdkMocks = vi.hoisted(() => ({
  serverClient: undefined as unknown,
}));

vi.mock("@/lib/env", () => ({
  getConfig: () => ({
    defaultReaderChapter: 1,
    translationIds: [131],
  }),
}));

vi.mock("@/lib/sdk", () => ({
  createClients: async () => ({
    serverClient: sdkMocks.serverClient,
  }),
  getSearchModeQuick: () => "quick",
}));

describe("buildReaderUrlFromKey", () => {
  it("builds chapter url from chapter key", () => {
    expect(buildReaderUrlFromKey("2")).toBe("/quran/2");
  });

  it("builds chapter url from verse key", () => {
    expect(buildReaderUrlFromKey("2:255")).toBe("/quran/2/255");
  });

  it("builds chapter url from verse range key", () => {
    expect(buildReaderUrlFromKey("2:1-5")).toBe("/quran/2/1");
  });

  it("returns null for invalid keys", () => {
    expect(buildReaderUrlFromKey("bad-value")).toBeNull();
  });
});

describe("sanitizeTajweedMarkup", () => {
  it("preserves only Quran.Foundation tajweed annotations", () => {
    expect(sanitizeTajweedMarkup("<tajweed class=ghunnah>نّ</tajweed><span class=end>١</span>"))
      .toBe('<tajweed class="ghunnah">نّ</tajweed><span class="end">١</span>');
  });

  it("escapes executable or unknown markup", () => {
    const output = sanitizeTajweedMarkup('<script>alert(1)</script><tajweed class="unknown">x</tajweed>');
    expect(output).not.toContain("<script>");
    expect(output).not.toContain('<tajweed class="unknown">');
    expect(output).toContain("&lt;script&gt;");
  });
});

describe("Tajweed page data", () => {
  it("carries sanitized official Tajweed markup into Mushaf page mode", async () => {
    const byPage = vi.fn(async () => [{
      textUthmani: "الرَّحْمَٰنِ",
      textUthmaniTajweed: "<tajweed class=madda_normal>ـٰ</tajweed>",
      verseKey: "1:3",
      words: [{ charTypeName: "word", codeV2: "glyph", lineNumber: 2, position: 1, textUthmani: "الرَّحْمَٰنِ" }],
    }]);
    sdkMocks.serverClient = { content: { v4: { verses: { byPage } } } };

    const data = await loadMushafPage({} as never, 1);

    expect(byPage).toHaveBeenCalledWith(1, expect.objectContaining({
      fields: expect.objectContaining({ textUthmaniTajweed: true }),
      mushaf: 1,
    }));
    expect(data.tajweedVerses).toEqual([{
      arabicText: "الرَّحْمَٰنِ",
      tajweedHtml: '<tajweed class="madda_normal">ـٰ</tajweed>',
      verseKey: "1:3",
    }]);
  });

  it("carries sanitized official Tajweed markup into structural reading", async () => {
    const byJuz = vi.fn(async () => [{
      pageNumber: 1,
      textUthmani: "بِسْمِ",
      textUthmaniTajweed: "<tajweed class=ham_wasl>ٱ</tajweed>",
      verseKey: "1:1",
    }]);
    sdkMocks.serverClient = { content: { v4: { verses: { byJuz } } } };

    const data = await loadStructureVerses({} as never, "juz", 1);

    expect(byJuz).toHaveBeenCalledWith(1, expect.objectContaining({
      fields: expect.objectContaining({ textUthmaniTajweed: true }),
    }));
    expect(data[0]).toMatchObject({
      tajweedHtml: '<tajweed class="ham_wasl">ٱ</tajweed>',
      verseKey: "1:1",
    });
  });
});

describe("getGrantedScopes", () => {
  it("parses string scopes", () => {
    expect(
      getGrantedScopes({
        userSession: { scope: "openid offline_access note" },
      }),
    ).toEqual(["openid", "offline_access", "note"]);
  });

  it("parses array scopes", () => {
    expect(
      getGrantedScopes({
        userSession: { scopes: ["user", "bookmark"] },
      }),
    ).toEqual(["user", "bookmark"]);
  });
});

describe("ensureUserScope", () => {
  it("accepts documented goal and preference scopes", () => {
    const session = {
      userSession: { scope: "openid offline_access goal preference" },
    } as never;

    expect(ensureUserScope(session, "goal")).toEqual({ ok: true });
    expect(ensureUserScope(session, "preference")).toEqual({ ok: true });
  });

  it("returns a scope-specific gate when a documented scope is missing", () => {
    expect(
      ensureUserScope(
        {
          userSession: { scope: "openid offline_access goal" },
        } as never,
        "preference",
      ),
    ).toEqual({
      gatingMessage: "Requires the `preference` scope.",
      message: "This action requires the `preference` scope.",
      ok: false,
      signedOut: false,
      status: 403,
    });
  });
});

describe("loadReaderData", () => {
  it("loads every verse page for a chapter", async () => {
    const byChapter = vi.fn(async (_chapterId: string, query: { page: number }) => {
      const start = (query.page - 1) * 50;
      const count = query.page === 1 ? 50 : 10;

      return Array.from({ length: count }, (_value, index) => ({
        id: start + index + 1,
        textUthmani: `Verse ${start + index + 1}`,
        textUthmaniTajweed: `<tajweed class=ghunnah>Verse ${start + index + 1}</tajweed>`,
        translations: [{ resourceId: 131, text: `Translation ${start + index + 1}` }],
        verseKey: `2:${start + index + 1}`,
        verseNumber: start + index + 1,
      }));
    });

    sdkMocks.serverClient = {
      content: {
        v4: {
          chapters: {
            get: vi.fn(async () => ({
              id: 2,
              nameSimple: "Al-Baqarah",
              versesCount: 60,
            })),
          },
          verses: {
            byChapter,
          },
        },
      },
    };

    const data = await loadReaderData({} as never, "2");

    expect(byChapter).toHaveBeenCalledTimes(2);
    expect(byChapter).toHaveBeenNthCalledWith(
      1,
      "2",
      expect.objectContaining({ page: 1, perPage: 50 }),
    );
    expect(byChapter).toHaveBeenNthCalledWith(
      2,
      "2",
      expect.objectContaining({ page: 2, perPage: 50 }),
    );
    expect(data.verses).toHaveLength(60);
    expect(data.verses[59]).toMatchObject({
      tajweedHtml: '<tajweed class="ghunnah">Verse 60</tajweed>',
      translationText: "Translation 60",
      verseKey: "2:60",
    });
  });

  it("loads reader metadata from wrapped chapter responses", async () => {
    const byChapter = vi.fn(async () => [
      {
        id: 1,
        textUthmani: "Verse 1",
        translations: [{ resourceId: 131, text: "Translation 1" }],
        verseKey: "2:1",
        verseNumber: 1,
      },
    ]);

    sdkMocks.serverClient = {
      content: {
        v4: {
          chapters: {
            get: vi.fn(async () => ({
              chapter: {
                id: 2,
                nameSimple: "Al-Baqarah",
                versesCount: 1,
              },
            })),
          },
          verses: {
            byChapter,
          },
        },
      },
    };

    const data = await loadReaderData({} as never, "2");

    expect(byChapter).toHaveBeenCalledTimes(1);
    expect(data.chapter).toMatchObject({
      id: 2,
      nameSimple: "Al-Baqarah",
      versesCount: 1,
    });
  });

  it("falls back to the chapter catalog when the chapter detail endpoint fails", async () => {
    sdkMocks.serverClient = {
      content: { v4: {
        chapters: {
          get: vi.fn(async () => { throw new Error("Chapter detail unavailable"); }),
          list: vi.fn(async () => [{ id: 1, nameArabic: "الفاتحة", nameSimple: "Al-Fatihah", versesCount: 1 }]),
        },
        verses: { byChapter: vi.fn(async () => [{ id: 1, textUthmani: "Verse 1", translations: [{ resourceId: 85, text: "Translation 1" }], verseKey: "1:1", verseNumber: 1 }]) },
      } },
    };

    const data = await loadReaderData({} as never, "1", 85);

    expect(data.chapter).toMatchObject({ id: 1, nameSimple: "Al-Fatihah" });
    expect(data.verses[0].translationText).toBe("Translation 1");
  });

  it("maps authoritative verse audio for the selected recitation", async () => {
    sdkMocks.serverClient = {
      content: { v4: {
        audio: { verseRecitation: { byChapter: vi.fn(async () => ({ audioFiles: [{ verseKey: "1:1", audioUrl: "https://verses.quran.com/example.mp3" }] })) } },
        chapters: { get: vi.fn(async () => ({ id: 1, nameSimple: "Al-Fatihah", versesCount: 1 })) },
        verses: { byChapter: vi.fn(async () => [{ id: 1, textUthmani: "Verse 1", translations: [{ resourceId: 85, text: "Translation 1" }], verseKey: "1:1", verseNumber: 1 }]) },
      } },
    };

    const data = await loadReaderData({} as never, "1", 85, 7);

    expect(data.recitationId).toBe(7);
    expect(data.verses[0].audioUrl).toBe("https://verses.quran.com/example.mp3");
  });
});

describe("loadRecitationResources", () => {
  it("normalizes the dynamic reciter catalog", async () => {
    sdkMocks.serverClient = { content: { v4: { resources: { recitations: { list: vi.fn(async () => [{ id: 7, reciterName: "Mishari Rashid al-`Afasy", style: null }]) } } } } };
    await expect(loadRecitationResources({} as never)).resolves.toEqual({ error: null, items: [{ id: 7, name: "Mishari Rashid al-`Afasy", style: null }] });
  });
});

describe("loadSearchData", () => {
  it("keeps Arabic Quran text separate from the search snippet", async () => {
    sdkMocks.serverClient = {
      search: {
        v1: {
          query: vi.fn(async () => ({
            result: {
              navigation: [],
              verses: [
                {
                  key: "1:1",
                  text: "All praise is for Allah.",
                  textUthmani: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ",
                },
              ],
            },
          })),
        },
      },
    };

    const result = await loadSearchData({} as never, "praise");

    expect(result.verseItems[0]).toMatchObject({
      arabicText: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَـٰلَمِينَ",
      readerUrl: "/quran/1/1",
      text: "All praise is for Allah.",
      verseKey: "1:1",
    });
  });

  it("does not expose an upstream token error", async () => {
    sdkMocks.serverClient = {
      search: { v1: { query: vi.fn(async () => { throw new Error("Token request failed: 400"); }) } },
    };

    const result = await loadSearchData({} as never, "mercy");

    expect(result.error).toContain("not enabled for this API client");
    expect(result.error).not.toContain("400");
  });
});

describe("loadTranslationResources", () => {
  it("normalizes the dynamically discovered translation catalog", async () => {
    sdkMocks.serverClient = {
      content: { v4: { resources: { translations: { list: vi.fn(async () => ({
        translations: [{ id: 131, name: "Clear Quran", author_name: "Mustafa Khattab", language_name: "English" }],
      })) } } } },
    };

    const result = await loadTranslationResources({} as never);

    expect(result).toEqual({
      error: null,
      items: [{ id: 131, name: "Clear Quran", authorName: "Mustafa Khattab", languageName: "English" }],
    });
  });
});

describe("parsePositiveInteger", () => {
  it("accepts positive values", () => {
    expect(parsePositiveInteger("2")).toBe(2);
  });

  it("rejects invalid values", () => {
    expect(parsePositiveInteger("0")).toBeNull();
    expect(parsePositiveInteger("-4")).toBeNull();
    expect(parsePositiveInteger("x")).toBeNull();
  });

  it("rejects partially numeric values", () => {
    expect(parsePositiveInteger("2abc")).toBeNull();
    expect(parsePositiveInteger("3.5")).toBeNull();
  });
});

describe("parseVerseKey", () => {
  it("accepts chapter:verse format", () => {
    expect(parseVerseKey("1:7")).toBe("1:7");
  });

  it("rejects malformed values", () => {
    expect(parseVerseKey("1-7")).toBeNull();
    expect(parseVerseKey("chapter:1")).toBeNull();
  });
});

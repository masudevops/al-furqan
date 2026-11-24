import { describe, expect, it, vi } from "vitest";

import {
  buildReaderUrlFromKey,
  parseAyahTafsir,
  parseTajweedGlyphs,
  parsePracticeWords,
  deriveReflectPresentation,
  ensureUserScope,
  getGrantedScopes,
  loadMushafPage,
  loadChapterAudio,
  loadChapterReciterResources,
  loadReaderData,
  loadRecitationResources,
  loadSearchData,
  loadStructureVerses,
  loadTranslationResources,
  parsePositiveInteger,
  parseVerseKey,
  sanitizeSourceHtml,
  sanitizeTranslationMarkup,
  isStandaloneDailyVerse,
  qpcHafsText,
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

describe("provider HTML sanitization", () => {
  it("extracts Quran.Foundation translation footnotes and preserves their visible markers", () => {
    expect(sanitizeTranslationMarkup('Guidance.<sup foot_note=227145>1</sup>')).toEqual({
      footnotes: [{ id: 227145, label: "1" }],
      html: 'Guidance.<sup data-footnote="227145">1</sup>',
    });
  });

  it("allows basic source formatting but removes executable markup", () => {
    const html = sanitizeSourceHtml('<h2>About</h2><script>alert(1)</script><p onclick="bad()">Text</p>');
    expect(html).toContain("<h2>About</h2>");
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("onclick");
  });

  it("renders provider span formatting without leaking markup or inline styles", () => {
    const html = sanitizeSourceHtml('<strong>Themes:</strong><span style="font-weight: 400;">Purpose&nbsp;and context</span>');
    expect(html).toBe("<strong>Themes:</strong><span>Purpose\u00a0and context</span>");
    expect(html).not.toContain("style=");
    expect(html).not.toContain("&lt;span");
    expect(html).not.toContain("&amp;nbsp;");
  });
});

describe("Quran Reflect presentation", () => {
  it("uses the provider's first line as a title and creates a bounded verbatim excerpt", () => {
    const body = `A Provider Title\n\n${"Provider reflection words ".repeat(30)}`;
    const result = deriveReflectPresentation(body);
    expect(result.title).toBe("A Provider Title");
    expect(result.excerpt).toMatch(/^Provider reflection words/);
    expect(result.excerpt.endsWith("…")).toBe(true);
    expect(result.excerpt.length).toBeLessThanOrEqual(241);
  });

  it("does not duplicate a short provider title when there is no body", () => {
    expect(deriveReflectPresentation("A Short Reflection")).toEqual({ excerpt: "", title: "A Short Reflection" });
  });
});

describe("Tajweed page data", () => {
  it("uses official QCF V4 glyphs and plain Uthmani text in Mushaf page mode", async () => {
    const verses = [{
      hizbNumber: 1,
      juzNumber: 1,
      textUthmani: "الرَّحْمَٰنِ",
      verseKey: "1:3",
      words: [{ charTypeName: "word", codeV2: "glyph", lineNumber: 2, position: 1, textUthmani: "الرَّحْمَٰنِ" }],
    }];
    const byPage = vi.fn(async (_page:number,options:{mushaf:number}) => options.mushaf===19
      ? [{...verses[0],words:[{...verses[0].words[0],codeV2:"colored-glyph"}]}]
      : verses);
    sdkMocks.serverClient = { content: { v4: { chapters: { list: vi.fn(async () => [{ id: 1, nameSimple: "Al-Fatihah" }]) }, verses: { byPage } } } };

    const data = await loadMushafPage({} as never, 1);

    expect(byPage).toHaveBeenCalledWith(1, expect.objectContaining({ mushaf: 1 }));
    expect(byPage.mock.calls.every(([, options]) => !("textUthmaniTajweed" in ((options as { fields?: object }).fields ?? {})))).toBe(true);
    expect(byPage).toHaveBeenCalledWith(1, expect.objectContaining({ mushaf: 19 }));
    expect(data.tajweedVerses).toEqual([{
      arabicText: "الرَّحْمَٰنِ",
      verseKey: "1:3",
    }]);
    expect(data).toMatchObject({ chapterNames: ["Al-Fatihah"], hizbNumbers: [1], juzNumbers: [1], pageNumber: 1 });
    expect(data.tajweedLines[0].words[0].qcfCode).toBe("colored-glyph");
  });

  it("carries official QCF V4 glyph words into structural reading", async () => {
    const byJuz = vi.fn(async () => [{
      pageNumber: 1,
      textUthmani: "بِسْمِ",
      verseKey: "1:1",
      words: [{ char_type_name: "word", code_v2: "\uFC41", page_number: 1 }],
    }]);
    sdkMocks.serverClient = { content: { v4: { verses: { byJuz } } } };

    const data = await loadStructureVerses({} as never, "juz", 1);

    expect(byJuz).toHaveBeenCalledWith(1, expect.objectContaining({ fields: { textUthmani: true, textQpcHafs: true }, mushaf: 19 }));
    expect(data[0]).not.toHaveProperty("tajweedHtml");
    expect(data[0]).toMatchObject({
      pageNumber: 1,
      tajweedWords: [{ charType: "word", code: "\uFC41", pageNumber: 1 }],
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
    expect(data.verses[59]).not.toHaveProperty("tajweedHtml");
    expect(data.verses[59]).toMatchObject({
      arabicText: "Verse 60",
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

describe("synchronized chapter recitation", () => {
  it("normalizes chapter-reciter resources separately from Ayah reciters", async () => {
    sdkMocks.serverClient = { content: { v4: { resources: { chapterReciters: { list: vi.fn(async () => ({ reciters: [{ id: 4, reciterName: "Abu Bakr al-Shatri", style: { name: "Murattal" } }] })) } } } } };
    await expect(loadChapterReciterResources({} as never)).resolves.toEqual({ error: null, items: [{ id: 4, name: "Abu Bakr al-Shatri", style: "Murattal" }] });
  });

  it("preserves only authoritative verse and word timestamps", async () => {
    const get = vi.fn(async () => ({ audioFile: { audioUrl: "https://download.quranicaudio.com/example.mp3", timestamps: [{ verseKey: "1:1", timestampFrom: 0, timestampTo: 6493, segments: [[1, 0, 630], [2, 650, 1570], ["bad"]] }] } }));
    sdkMocks.serverClient = { content: { v4: { audio: { chapterRecitation: { get } } } } };
    await expect(loadChapterAudio({} as never, 1, 4)).resolves.toEqual({
      audioUrl: "https://download.quranicaudio.com/example.mp3",
      chapterId: 1,
      reciterId: 4,
      timestamps: [{ verseKey: "1:1", timestampFrom: 0, timestampTo: 6493, segments: [[1, 0, 630], [2, 650, 1570]] }],
    });
    expect(get).toHaveBeenCalledWith("4", "1", { segments: true });
  });
});

describe("qpcHafsText", () => {
  it("uses the QPC Hafs text the Uthmani font is drawn for, without the trailing Ayah number", () => {
    expect(qpcHafsText({ textQpcHafs: "وَأَمَّا عَادٞ فَأُهۡلِكُواْ بِرِيحٖ صَرۡصَرٍ عَاتِيَةٖ ٦", textUthmani: "x" })).toBe("وَأَمَّا عَادٞ فَأُهۡلِكُواْ بِرِيحٖ صَرۡصَرٍ عَاتِيَةٖ");
    expect(qpcHafsText({ text_qpc_hafs: "ٱلۡحَآقَّةُ ١٠٠" })).toBe("ٱلۡحَآقَّةُ");
    expect(qpcHafsText({ textUthmani: "ٱلْحَآقَّةُ" })).toBeNull();
  });
});

describe("isStandaloneDailyVerse", () => {
  it("skips one-word Ayahs and ignores pause marks when counting words", () => {
    expect(isStandaloneDailyVerse("ٱلْحَآقَّةُ")).toBe(false);
    expect(isStandaloneDailyVerse("مَا ٱلْحَآقَّةُ ۚ")).toBe(false);
    expect(isStandaloneDailyVerse("إِنَّ ٱللَّهَ مَعَ ٱلصَّـٰبِرِينَ ۚ وَٱللَّهُ غَفُورٌ رَّحِيمٌ")).toBe(true);
  });
});

describe("loadSearchData", () => {
  it("asks for result text, pairs each Ayah with the named translation and keeps Surah matches separate", async () => {
    const query = vi.fn(async () => ({
      pagination: { currentPage: 1, totalPages: 3, totalRecords: 45 },
      result: {
        navigation: [
          { key: "55", resultType: "surah", name: "Surah Ar-Rahman", arabic: "سورة الرحمن" },
          { key: "1:1", resultType: "ayah", isArabic: false, arabic: "بِسْمِ ٱللَّهِ", name: "In the name of God, the Lord of <em>Mercy</em>" },
          { key: "2:157", resultType: "ayah", isArabic: true, arabic: "وَرَحْمَةٌ", name: "<em>وَرَحْمَةٌ</em>" },
        ],
        verses: [],
      },
    }));
    const versesByVerseKey = vi.fn(async ({ path }: { path: { verse_key: string } }) => ({
      verse: { textUthmani: `uthmani ${path.verse_key}`, textQpcHafs: `qpc ${path.verse_key} ٣`, translations: [{ resource_id: 20, text: `Saheeh <sup foot_note="1">1</sup>${path.verse_key}` }] },
    }));
    const list = vi.fn(async () => ({ translations: [{ id: 85, name: "Abdel Haleem" }, { id: 20, name: "Saheeh International" }] }));
    sdkMocks.serverClient = { search: { v1: { query } }, raw: { content: { v4: { versesByVerseKey } } }, content: { v4: { resources: { translations: { list } } } } };

    const result = await loadSearchData({} as never, " mercy ", 2);

    expect(query).toHaveBeenCalledWith(expect.objectContaining({ getText: 1, page: 2, query: "mercy" }));
    expect(result).toMatchObject({ page: 1, pages: 3, total: 45 });
    expect(result.navigationItems).toEqual([{ label: "Surah Ar-Rahman", readerUrl: "/quran/55", subtitle: "سورة الرحمن" }]);
    expect(result.verseItems[0]).toMatchObject({ arabicText: "qpc 1:1", readerUrl: "/quran/1/1", text: "Saheeh 1:1", translationName: "Saheeh International", verseKey: "1:1" });
    expect(result.verseItems[1]).toMatchObject({ verseKey: "2:157" });
    // The search snippet's unnamed translation is never shown.
    expect(JSON.stringify(result)).not.toContain("Lord of");
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

describe("single-Ayah Tafsir", () => {
  it("reads the requested source's text and name from a verse-by-key response", () => {
    const payload = parseAyahTafsir({ verse: { verse_key: "2:255", tafsirs: [{ resource_name: "Ibn Kathir (Abridged)", text: "<p>The greatest Ayah.</p>" }] } }, "2:255", 169);
    expect(payload).toEqual({ tafsirId: 169, tafsirName: "Ibn Kathir (Abridged)", tafsirText: "The greatest Ayah.", verseKey: "2:255" });
  });

  it("reports a missing entry instead of inventing text", () => {
    expect(parseAyahTafsir({ verse: { tafsirs: [] } }, "2:1", 169)).toEqual({ tafsirId: 169, tafsirName: null, tafsirText: null, verseKey: "2:1" });
  });
});

describe("Surah Tajweed glyphs", () => {
  it("keeps each word's official V4 glyph and page across paginated responses", () => {
    const payload = parseTajweedGlyphs([
      { verses: [{ verse_key: "2:2", words: [{ char_type_name: "word", code_v2: "ﱃ", page_number: 2 }, { char_type_name: "end", code_v2: "ﱌ", page_number: 2 }] }] },
      { verses: [{ verse_key: "2:51", words: [{ char_type_name: "word", code_v2: "ﭑ", page_number: 8 }] }] },
    ], 2);
    expect(payload).toEqual({ chapterId: 2, verses: [
      { verseKey: "2:2", words: [{ charType: "word", code: "ﱃ", pageNumber: 2 }, { charType: "end", code: "ﱌ", pageNumber: 2 }] },
      { verseKey: "2:51", words: [{ charType: "word", code: "ﭑ", pageNumber: 8 }] },
    ] });
  });
});

describe("Learn practice words", () => {
  it("keeps unique real words with absolute Quran.Foundation word audio and skips Ayah-end markers", () => {
    const payload = parsePracticeWords([
      { verses: [{ verse_key: "112:1", words: [
        { char_type_name: "word", text_uthmani: "قُلْ", audio_url: "wbw/112_001_001.mp3", position: 1 },
        { char_type_name: "end", text_uthmani: "١", audio_url: null, position: 5 },
      ] }] },
      { verses: [{ verse_key: "113:1", words: [{ char_type_name: "word", text_uthmani: "قُلْ", audio_url: "wbw/113_001_001.mp3", position: 1 }] }] },
    ], [112, 113]);
    expect(payload.sequences[112]?.map((word) => word.text)).toEqual(["قُلْ"]);
    expect(payload.words).toEqual([{ text: "قُلْ", audioUrl: "https://verses.quran.foundation/wbw/112_001_001.mp3", verseKey: "112:1", position: 1, transliteration: null, translation: null }]);
  });
});

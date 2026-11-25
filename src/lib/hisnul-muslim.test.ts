import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadHisnChapter, loadHisnChapters, parseHisnJson } from "@/lib/hisnul-muslim";

const file = (body: string, status = 200) => Promise.resolve({ ok: status < 400, status, text: () => Promise.resolve(body) } as Response);
const index = "﻿{\n\t\"English\": [\n\t\t{\"ID\": 28, \"TITLE\": \"What to say before sleeping\"},\n\t\t{\"ID\": 1, \"TITLE\": \"supplications for when you wake up\"}\n\t]\n}";
const arabicIndex = "{\"العربية\": [{\"ID\": 1, \"TITLE\": \"أذكار الاستيقاظ\"}, {\"ID\": 28, \"TITLE\": \"أذكار النوم\"}]}";
// Raw line breaks inside strings, a missing translation, Arabic under "Text", and an entry with no Arabic, as in the real files.
const chapter28 = "﻿{\r\n\t\"What to say before sleeping\": [\r\n"
  + "{\"ID\": 99, \"ARABIC_TEXT\": \"بِاسْمِكَ\r\nرَبِّي\", \"LANGUAGE_ARABIC_TRANSLATED_TEXT\": \"Recite Ayat-Al-Kursiy\", \"TRANSLATED_TEXT\": \"In Your name\", \"REPEAT\": \"3\", \"AUDIO\": \"http://www.hisnmuslim.com/audio/ar/99.mp3\"},"
  + "{\"ID\": 133, \"ARABIC_TEXT\": \"أَعُوذُ بِاللَّهِ\", \"LANGUAGE_ARABIC_TRANSLATED_TEXT\": \"(Say:) I seek refuge in Allah.\", \"REPEAT\": \"1\", \"AUDIO\": \"https://evil.example/x.mp3\"},"
  + "{\"ID\": 267, \"Text\": \"قَالَ النَّبِيُّ\", \"LANGUAGE_ARABIC_TRANSLATED_TEXT\": \"\", \"TRANSLATED_TEXT\": \"When evening descends\", \"REPEAT\": \"1\", \"AUDIO\": \"\"},"
  + "{\"ID\": 300, \"ARABIC_TEXT\": \"\", \"TRANSLATED_TEXT\": \"English only\", \"REPEAT\": \"1\"}]}";

describe("Hisnul Muslim source files", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn((url: string) => {
    if (url.endsWith("/en/husn_en.json")) return file(index);
    if (url.endsWith("/ar/husn_ar.json")) return file(arabicIndex);
    if (url.endsWith("/en/28.json")) return file(chapter28);
    return file("", 404);
  })));
  afterEach(() => vi.unstubAllGlobals());

  it("repairs only the structure: a missing closing quote on the chapter title and raw whitespace", () => {
    const broken = "{\r\n\t\"What to say when you feel frightened: \r\n\t[\r\n\t\t{\"ID\": 245, \"ARABIC_TEXT\": \"لاَ إِلَهَ إِلاَّ اللَّهُ\"}]}";
    expect(parseHisnJson(broken)).toEqual({ "What to say when you feel frightened": [{ ID: 245, ARABIC_TEXT: "لاَ إِلَهَ إِلاَّ اللَّهُ" }] });
  });

  it("lists chapters in book order with their Arabic titles", async () => {
    await expect(loadHisnChapters()).resolves.toEqual([
      { id: 1, title: "supplications for when you wake up", titleArabic: "أذكار الاستيقاظ" },
      { id: 28, title: "What to say before sleeping", titleArabic: "أذكار النوم" },
    ]);
  });

  it("keeps each field as given, skips entries without Arabic, and only plays hisnmuslim.com audio over https", async () => {
    const chapter = await loadHisnChapter(28);
    expect(chapter?.titleArabic).toBe("أذكار النوم");
    expect(chapter?.entries).toEqual([
      { id: 99, arabic: "بِاسْمِكَ رَبِّي", note: "Recite Ayat-Al-Kursiy", translation: "In Your name", repeat: 3, audioUrl: "https://www.hisnmuslim.com/audio/ar/99.mp3" },
      { id: 133, arabic: "أَعُوذُ بِاللَّهِ", note: "(Say:) I seek refuge in Allah.", translation: "", repeat: 1, audioUrl: null },
      { id: 267, arabic: "قَالَ النَّبِيُّ", note: "", translation: "When evening descends", repeat: 1, audioUrl: null },
    ]);
  });

  it("returns nothing for an unknown chapter and fails on an outage", async () => {
    await expect(loadHisnChapter(500)).resolves.toBeNull();
    await expect(loadHisnChapter(0)).resolves.toBeNull();
    vi.mocked(fetch).mockImplementation(() => file("", 503));
    await expect(loadHisnChapters()).rejects.toThrow("Hisnul Muslim request failed: 503");
  });
});

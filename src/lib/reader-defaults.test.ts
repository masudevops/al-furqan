import { describe, expect, it } from "vitest";

import { defaultReaderSelection, readerRequestKey } from "./reader-defaults";

const translations = [{ authorName: null, id: 131, languageName: "English", name: "The Clear Quran" }, { authorName: null, id: 20, languageName: "English", name: "Saheeh International" }];
const recitations = [{ id: 7, name: "Mishari Rashid al-`Afasy", style: null }, { id: 10, name: "Mohamed Siddiq al-Minshawi", style: "Murattal" }];

describe("reader defaults", () => {
  it("selects the same preferred resources the reader picks", () => {
    expect(defaultReaderSelection(translations, recitations)).toEqual({ translationId: 20, recitationId: 10, script: "uthmani" });
  });
  it("falls back to the first resources and returns null without catalogs", () => {
    expect(defaultReaderSelection([translations[0]], [recitations[0]])).toMatchObject({ translationId: 131, recitationId: 7 });
    expect(defaultReaderSelection([], recitations)).toBeNull();
  });
  it("builds the exact /api/reader key the reader requests", () => {
    const selection = { translationId: 20, recitationId: 10, script: "uthmani" as const };
    expect(readerRequestKey("2", selection)).toBe("/api/reader/2?translation=20&recitation=10&script=uthmani");
    expect(readerRequestKey(2, { ...selection, words: true, tafsirId: 169 })).toBe("/api/reader/2?translation=20&recitation=10&script=uthmani&words=1&tafsir=169");
  });
});

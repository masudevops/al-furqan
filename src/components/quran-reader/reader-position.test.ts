import { describe, expect, it } from "vitest";

import { englishMeaning, mushafHrefFor, positionLabels, positionOfVerse, revelationLabel, toArabicIndicDigits } from "./reader-position";

const verses = [
  { verseKey: "2:1", pageNumber: 2, juzNumber: 1, hizbNumber: 1 },
  { verseKey: "2:142", pageNumber: 22, juzNumber: 2, hizbNumber: 3 },
];

describe("Quran reader position", () => {
  it("reads page, Juz, and Hizb from the visible Ayah's source metadata", () => {
    const position = positionOfVerse(verses, "2:142");
    expect(position).toEqual({ index: 1, page: 22, juz: 2, hizb: 3 });
    expect(positionLabels(position)).toEqual({ page: "Page 22", section: "Juz 2 / Hizb 3" });
    expect(mushafHrefFor(position)).toBe("/quran/mushaf/22");
  });

  it("falls back to the first Ayah before any Ayah is in view", () => {
    expect(positionOfVerse(verses, null)?.page).toBe(2);
    expect(positionOfVerse([], null)).toBeNull();
  });

  it("omits labels the source did not provide", () => {
    expect(positionLabels({ index: 0, page: null, juz: 4, hizb: null })).toEqual({ page: null, section: "Juz 4" });
    expect(mushafHrefFor(null)).toBe("/quran/mushaf/1");
  });
});

describe("Surah header labels", () => {
  it("formats sourced revelation places", () => {
    expect(revelationLabel("makkah")).toBe("Makkah");
    expect(revelationLabel("madinah")).toBe("Madinah");
    expect(revelationLabel(null)).toBeNull();
  });

  it("never presents an Arabic fallback name as an English meaning", () => {
    expect(englishMeaning("The Opener")).toBe("The Opener");
    expect(englishMeaning("سورة الفاتحة")).toBeNull();
  });

  it("renders Ayah numbers with Arabic-Indic digits", () => {
    expect(toArabicIndicDigits(286)).toBe("٢٨٦");
  });
});

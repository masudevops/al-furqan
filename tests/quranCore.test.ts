import { describe, expect, it } from "vitest";
import { parseQuranEditionSurah } from "../src/core/quran/contracts";
import { mergeReaderSurah } from "../src/core/quran/reader";
import {
  DEFAULT_READER_PREFERENCES,
  READER_PREFERENCES_KEY,
  clampArabicFontSize,
  loadReaderPreferences,
  saveReaderPreferences,
  type KeyValueStorage,
} from "../src/core/quran/readerPreferences";

function createStorage(initial?: string): KeyValueStorage {
  let value = initial ?? null;
  return {
    getItem: () => value,
    setItem: (_key, nextValue) => {
      value = nextValue;
    },
  };
}

describe("Quran contracts", () => {
  it("parses a provider Surah into a canonical edition", () => {
    expect(
      parseQuranEditionSurah({
        number: 1,
        name: "الفاتحة",
        englishName: "Al-Fatihah",
        englishNameTranslation: "The Opening",
        revelationType: "Meccan",
        ayahs: [
          {
            number: 1,
            numberInSurah: 1,
            text: "بِسْمِ اللَّهِ",
            page: 1,
          },
        ],
      }),
    ).toEqual(
      expect.objectContaining({
        number: 1,
        transliteratedName: "Al-Fatihah",
        ayahs: [
          expect.objectContaining({
            numberInSurah: 1,
            text: "بِسْمِ اللَّهِ",
          }),
        ],
      }),
    );
  });

  it("rejects malformed Quran provider data", () => {
    expect(
      parseQuranEditionSurah({
        number: 1,
        name: "الفاتحة",
        ayahs: "invalid",
      }),
    ).toBeNull();
  });

  it("keeps Arabic readable when translation is unavailable", () => {
    const arabic = parseQuranEditionSurah({
      number: 1,
      name: "الفاتحة",
      englishName: "Al-Fatihah",
      englishNameTranslation: "The Opening",
      ayahs: [{ number: 1, numberInSurah: 1, text: "الْحَمْدُ لِلَّهِ" }],
    });

    expect(arabic).not.toBeNull();
    const result = mergeReaderSurah(
      {
        number: 1,
        arabicName: "الفاتحة",
        transliteratedName: "Al-Fatihah",
        translatedName: "The Opening",
        revelationType: "Meccan",
        ayahCount: 7,
      },
      arabic!,
      null,
      "en.sahih",
    );

    expect(result.translationAvailable).toBe(false);
    expect(result.ayahs[0]).toEqual(
      expect.objectContaining({
        arabicText: "الْحَمْدُ لِلَّهِ",
        translationText: undefined,
      }),
    );
  });
});

describe("reader preferences", () => {
  it("loads safe defaults from invalid storage", () => {
    expect(loadReaderPreferences(createStorage("{invalid"))).toEqual(
      DEFAULT_READER_PREFERENCES,
    );
  });

  it("clamps and persists reader preferences", () => {
    const storage = createStorage();
    saveReaderPreferences(storage, {
      arabicFontSize: 99,
      showTranslation: false,
      density: "compact",
    });

    expect(clampArabicFontSize(99)).toBe(52);
    expect(storage.getItem(READER_PREFERENCES_KEY)).toContain(
      '"arabicFontSize":52',
    );
    expect(loadReaderPreferences(storage)).toEqual({
      arabicFontSize: 52,
      showTranslation: false,
      density: "compact",
    });
  });
});

import type {
  QuranEditionSurah,
  ReaderSurah,
  SurahMetadata,
} from "./contracts";

export function isValidSurahNumber(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 114;
}

export function mergeReaderSurah(
  metadata: SurahMetadata,
  arabic: QuranEditionSurah,
  translation: QuranEditionSurah | null,
  translationEdition: string,
): ReaderSurah {
  if (arabic.number !== metadata.number) {
    throw new Error("Arabic Quran response does not match the requested Surah");
  }

  const translations = new Map(
    translation?.ayahs.map((ayah) => [ayah.numberInSurah, ayah.text]) || [],
  );

  return {
    metadata,
    translationEdition,
    translationAvailable: translation !== null,
    ayahs: arabic.ayahs.map((ayah) => ({
      ref: {
        surahNumber: metadata.number,
        ayahNumber: ayah.numberInSurah,
      },
      arabicText: ayah.text,
      translationText: translations.get(ayah.numberInSurah),
      pageNumber: ayah.page,
    })),
  };
}

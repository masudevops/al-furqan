import {
  isNumber,
  isRecord,
  isString,
} from "../contracts/validation";

export type RevelationType = "Meccan" | "Medinan";

export interface AyahReference {
  surahNumber: number;
  ayahNumber: number;
}

export interface SurahMetadata {
  number: number;
  arabicName: string;
  transliteratedName: string;
  translatedName: string;
  revelationType: RevelationType;
  ayahCount: number;
}

export interface QuranEditionAyah {
  number: number;
  numberInSurah: number;
  text: string;
  page?: number;
  audio?: string;
}

export interface QuranEditionSurah {
  number: number;
  arabicName: string;
  transliteratedName: string;
  translatedName: string;
  revelationType?: RevelationType;
  ayahs: QuranEditionAyah[];
}

export interface ReaderAyah {
  ref: AyahReference;
  arabicText: string;
  translationText?: string;
  pageNumber?: number;
  audioUrl?: string;
}

export interface ReaderSurah {
  metadata: SurahMetadata;
  ayahs: ReaderAyah[];
  translationEdition: string;
  translationAvailable: boolean;
}

function isRevelationType(value: unknown): value is RevelationType {
  return value === "Meccan" || value === "Medinan";
}

function parseEditionAyah(value: unknown): QuranEditionAyah | null {
  if (!isRecord(value) || !isString(value.text)) return null;

  const numberInSurah = isNumber(value.numberInSurah)
    ? value.numberInSurah
    : isNumber(value.number)
      ? value.number
      : null;

  if (!numberInSurah) return null;

  return {
    number: isNumber(value.number) ? value.number : numberInSurah,
    numberInSurah,
    text: value.text,
    page: isNumber(value.page) ? value.page : undefined,
    audio: isString(value.audio) ? value.audio : undefined,
  };
}

export function parseQuranEditionSurah(
  value: unknown,
): QuranEditionSurah | null {
  if (
    !isRecord(value) ||
    !isNumber(value.number) ||
    !isString(value.name) ||
    !isString(value.englishName) ||
    !isString(value.englishNameTranslation) ||
    !Array.isArray(value.ayahs)
  ) {
    return null;
  }

  const ayahs = value.ayahs.map(parseEditionAyah);
  if (ayahs.some((ayah) => ayah === null)) return null;

  return {
    number: value.number,
    arabicName: value.name,
    transliteratedName: value.englishName,
    translatedName: value.englishNameTranslation,
    revelationType: isRevelationType(value.revelationType)
      ? value.revelationType
      : undefined,
    ayahs: ayahs as QuranEditionAyah[],
  };
}

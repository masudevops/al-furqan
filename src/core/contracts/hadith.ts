import {
  isNumber,
  isOptionalString,
  isRecord,
  isString,
} from "./validation";

export interface HadithBook {
  bookSlug: string;
  bookName: string;
  bookNameArabic?: string;
  hadithCount: number;
}

export interface HadithChapter {
  id: number;
  chapterNumber: string;
  chapterEnglish: string;
  chapterUrdu?: string;
  chapterArabic?: string;
}

export interface Hadith {
  id: number;
  hadithNumber: string;
  englishNarrator: string;
  hadithEnglish: string;
  hadithUrdu?: string;
  hadithArabic?: string;
  status?: string;
  bookSlug: string;
  chapterId: string;
}

function isHadithBook(value: unknown): value is HadithBook {
  return (
    isRecord(value) &&
    isString(value.bookSlug) &&
    isString(value.bookName) &&
    isOptionalString(value.bookNameArabic) &&
    isNumber(value.hadithCount)
  );
}

function isHadithChapter(value: unknown): value is HadithChapter {
  return (
    isRecord(value) &&
    isNumber(value.id) &&
    isString(value.chapterNumber) &&
    isString(value.chapterEnglish) &&
    isOptionalString(value.chapterUrdu) &&
    isOptionalString(value.chapterArabic)
  );
}

function isHadith(value: unknown): value is Hadith {
  return (
    isRecord(value) &&
    isNumber(value.id) &&
    isString(value.hadithNumber) &&
    isString(value.englishNarrator) &&
    isString(value.hadithEnglish) &&
    isOptionalString(value.hadithUrdu) &&
    isOptionalString(value.hadithArabic) &&
    isOptionalString(value.status) &&
    isString(value.bookSlug) &&
    isString(value.chapterId)
  );
}

export function parseHadithBooks(value: unknown): HadithBook[] | null {
  if (!isRecord(value) || !Array.isArray(value.books)) return null;
  return value.books.every(isHadithBook) ? value.books : null;
}

export function parseHadithChapters(value: unknown): HadithChapter[] | null {
  if (!isRecord(value) || !Array.isArray(value.chapters)) return null;
  return value.chapters.every(isHadithChapter) ? value.chapters : null;
}

export function parseHadiths(value: unknown): Hadith[] | null {
  if (!isRecord(value) || !Array.isArray(value.hadiths)) return null;
  return value.hadiths.every(isHadith) ? value.hadiths : null;
}

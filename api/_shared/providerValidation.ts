import {
  isRecord,
  isString,
  type UnknownRecord,
} from "../../src/core/contracts/validation";
import type {
  Hadith,
  HadithBook,
  HadithChapter,
} from "../../src/core/contracts/hadith";
import type {
  IslamicBook,
  IslamicBookPage,
} from "../../src/core/contracts/islamicBooks";

function optionalString(value: unknown): string | undefined {
  return isString(value) ? value : undefined;
}

export function normalizeHadithBooks(value: unknown): HadithBook[] | null {
  if (!isRecord(value) || value.status !== 200 || !Array.isArray(value.books)) {
    return null;
  }

  const books: HadithBook[] = [];
  for (const item of value.books) {
    if (
      !isRecord(item) ||
      !isString(item.bookSlug) ||
      !isString(item.bookName) ||
      !isString(item.hadithsCount)
    ) {
      return null;
    }
    books.push({
      bookSlug: item.bookSlug,
      bookName: item.bookName,
      bookNameArabic: optionalString(item.bookNameArabic),
      hadithCount: Number.parseInt(item.hadithsCount, 10) || 0,
    });
  }
  return books;
}

export function normalizeHadithChapters(
  value: unknown,
): HadithChapter[] | null {
  if (
    !isRecord(value) ||
    value.status !== 200 ||
    !Array.isArray(value.chapters)
  ) {
    return null;
  }

  const chapters: HadithChapter[] = [];
  for (const item of value.chapters) {
    if (
      !isRecord(item) ||
      typeof item.id !== "number" ||
      !isString(item.chapterNumber) ||
      !isString(item.chapterEnglish)
    ) {
      return null;
    }
    chapters.push({
      id: item.id,
      chapterNumber: item.chapterNumber,
      chapterEnglish: item.chapterEnglish,
      chapterUrdu: optionalString(item.chapterUrdu),
      chapterArabic: optionalString(item.chapterArabic),
    });
  }
  return chapters;
}

export function normalizeHadiths(
  value: unknown,
  bookSlug: string,
  chapterId: string,
): Hadith[] | null {
  if (
    !isRecord(value) ||
    value.status !== 200 ||
    !isRecord(value.hadiths) ||
    !Array.isArray(value.hadiths.data)
  ) {
    return null;
  }

  const hadiths: Hadith[] = [];
  for (const item of value.hadiths.data) {
    if (
      !isRecord(item) ||
      typeof item.id !== "number" ||
      !isString(item.hadithNumber) ||
      !isString(item.englishNarrator) ||
      !isString(item.hadithEnglish)
    ) {
      return null;
    }
    hadiths.push({
      id: item.id,
      hadithNumber: item.hadithNumber,
      englishNarrator: item.englishNarrator,
      hadithEnglish: item.hadithEnglish,
      hadithUrdu: optionalString(item.hadithUrdu),
      hadithArabic: optionalString(item.hadithArabic),
      status: optionalString(item.status),
      bookSlug,
      chapterId,
    });
  }
  return hadiths;
}

function normalizeAttachment(value: unknown) {
  if (!isRecord(value) || !isString(value.url)) return null;
  const extension =
    optionalString(value.extension_type) || optionalString(value.extension);
  return {
    url: value.url,
    label: extension?.toUpperCase() || "FILE",
    size: optionalString(value.size),
  };
}

function normalizeIslamHouseItem(value: unknown): IslamicBook | null {
  if (
    !isRecord(value) ||
    (typeof value.id !== "number" && !isString(value.id)) ||
    !isString(value.title) ||
    !isString(value.description) ||
    !isString(value.source_lang)
  ) {
    return null;
  }

  const downloads = [];
  if (value.attachments !== undefined) {
    if (!Array.isArray(value.attachments)) return null;
    for (const attachment of value.attachments) {
      const normalized = normalizeAttachment(attachment);
      if (!normalized) return null;
      downloads.push(normalized);
    }
  }

  let author = "Unknown Author";
  if (Array.isArray(value.w_authors)) {
    const names = value.w_authors
      .filter((item): item is UnknownRecord => isRecord(item))
      .map((item) => optionalString(item.title))
      .filter((item): item is string => Boolean(item));
    if (names.length > 0) author = names.join(", ");
  }

  return {
    id: String(value.id),
    title: value.title,
    description: value.description,
    author,
    language: value.source_lang,
    coverImage: optionalString(value.image),
    downloads,
    type: "book",
  };
}

export function normalizeIslamHousePage(
  value: unknown,
): IslamicBookPage | null {
  if (!isRecord(value) || !Array.isArray(value.data)) return null;
  const books = value.data.map(normalizeIslamHouseItem);
  if (books.some((book) => book === null)) return null;

  const total =
    isRecord(value.meta) && typeof value.meta.total === "number"
      ? value.meta.total
      : 0;
  const hasMore =
    isRecord(value.links) &&
    value.links.next !== undefined &&
    value.links.next !== null;

  return {
    books: books as IslamicBook[],
    total,
    hasMore,
  };
}

export function normalizeIslamHouseSearch(value: unknown): IslamicBook[] | null {
  if (!isRecord(value) || !Array.isArray(value.data)) return null;
  const books = value.data
    .filter((item) => isRecord(item) && item.type === "book")
    .map(normalizeIslamHouseItem);
  return books.some((book) => book === null)
    ? null
    : (books as IslamicBook[]);
}

export function normalizeIslamHouseDetail(value: unknown): IslamicBook | null {
  if (!isRecord(value)) return null;
  return normalizeIslamHouseItem(value.data);
}

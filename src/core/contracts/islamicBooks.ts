import {
  isBoolean,
  isNumber,
  isOptionalString,
  isRecord,
  isString,
} from "./validation";

export interface BookAttachment {
  url: string;
  label: string;
  size?: string;
}

export interface IslamicBook {
  id: string;
  title: string;
  description: string;
  author: string;
  language: string;
  coverImage?: string;
  downloads: BookAttachment[];
  type: "book" | "article" | "audio" | "video";
}

export interface IslamicBookPage {
  books: IslamicBook[];
  total: number;
  hasMore: boolean;
}

const bookTypes = new Set<IslamicBook["type"]>([
  "book",
  "article",
  "audio",
  "video",
]);

function isBookAttachment(value: unknown): value is BookAttachment {
  return (
    isRecord(value) &&
    isString(value.url) &&
    isString(value.label) &&
    isOptionalString(value.size)
  );
}

function isIslamicBook(value: unknown): value is IslamicBook {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.title) &&
    isString(value.description) &&
    isString(value.author) &&
    isString(value.language) &&
    isOptionalString(value.coverImage) &&
    Array.isArray(value.downloads) &&
    value.downloads.every(isBookAttachment) &&
    isString(value.type) &&
    bookTypes.has(value.type as IslamicBook["type"])
  );
}

export function parseIslamicBookPage(value: unknown): IslamicBookPage | null {
  if (
    !isRecord(value) ||
    !Array.isArray(value.books) ||
    !value.books.every(isIslamicBook) ||
    !isNumber(value.total) ||
    !isBoolean(value.hasMore)
  ) {
    return null;
  }

  return {
    books: value.books,
    total: value.total,
    hasMore: value.hasMore,
  };
}

export function parseIslamicBookList(value: unknown): IslamicBook[] | null {
  if (!isRecord(value) || !Array.isArray(value.books)) return null;
  return value.books.every(isIslamicBook) ? value.books : null;
}

export function parseIslamicBook(value: unknown): IslamicBook | null {
  if (!isRecord(value)) return null;
  return isIslamicBook(value.book) ? value.book : null;
}

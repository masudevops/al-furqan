import { HADITH_BOOKS } from "./hadith-books-data";

// Books are each collection's own divisions as named by the source (fawazahmed0/hadith-api); see docs/DATA-SOURCES.md.
export interface HadithBook { number: number; name: string; count: number }
export interface HadithBookList { books: HadithBook[]; unassigned: number }

export function hadithBooks(collection: string): HadithBookList | null {
  const index = HADITH_BOOKS[collection];
  if (!index) return null;
  return { books: index.books.map(([number, name, count]) => ({ number, name, count })), unassigned: index.unassigned };
}

export function hadithBook(collection: string, number: number): HadithBook | null {
  return hadithBooks(collection)?.books.find((book) => book.number === number) ?? null;
}

// The book a Hadith number belongs to, or null when the source gives it none.
export function bookOfHadith(collection: string, hadithNumber: number): HadithBook | null {
  const run = HADITH_BOOKS[collection]?.runs.find(([first, last]) => hadithNumber >= first && hadithNumber <= last);
  return run ? hadithBook(collection, run[2]) : null;
}

import {
  createIslamHouseProvider,
} from "../core/providers/islamHouseProvider";
import type {
  BookAttachment,
  IslamicBook,
} from "../core/contracts/islamicBooks";
import { getProviderEndpoint } from "../platform/web/providerGateway";

export type { BookAttachment, IslamicBook };

const islamHouseProvider = createIslamHouseProvider({
  endpoint: getProviderEndpoint("islamhouse"),
});

// Fetch books from IslamHouse
export async function fetchBooks(
  page: number = 1,
  limit: number = 20,
  language: string = "en"
): Promise<{ books: IslamicBook[]; total: number; hasMore: boolean }> {
  try {
    return await islamHouseProvider.getBooks(page, limit, language);
  } catch (error) {
    console.error("Error fetching books:", error);
    return { books: [], total: 0, hasMore: false };
  }
}

// Search books
export async function searchBooks(
  query: string,
  page: number = 1,
  language: string = "en"
): Promise<IslamicBook[]> {
  try {
    return await islamHouseProvider.searchBooks(query, page, language);
  } catch (error) {
    console.error("Error searching books:", error);
    return [];
  }
}

export async function fetchBookById(bookId: string): Promise<IslamicBook | null> {
  try {
    return await islamHouseProvider.getBook(bookId);
  } catch (error) {
    console.error("Error fetching book:", error);
    return null;
  }
}

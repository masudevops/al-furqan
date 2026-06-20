import {
  parseIslamicBook,
  parseIslamicBookList,
  parseIslamicBookPage,
  type IslamicBook,
  type IslamicBookPage,
} from "../contracts/islamicBooks";
import {
  createProviderHttpClient,
  ProviderClientError,
  type ProviderHttpClientOptions,
} from "./http";

export interface IslamHouseProvider {
  getBooks(page: number, limit: number, language: string): Promise<IslamicBookPage>;
  searchBooks(query: string, page: number, language: string): Promise<IslamicBook[]>;
  getBook(bookId: string): Promise<IslamicBook>;
}

interface IslamHouseProviderOptions extends ProviderHttpClientOptions {
  endpoint: string;
}

export function createIslamHouseProvider({
  endpoint,
  ...httpOptions
}: IslamHouseProviderOptions): IslamHouseProvider {
  const getJson = createProviderHttpClient(httpOptions);

  return {
    async getBooks(page, limit, language) {
      const result = parseIslamicBookPage(
        await getJson(endpoint, {
          action: "books",
          page,
          limit,
          language,
        }),
      );
      if (!result) {
        throw new ProviderClientError("Invalid IslamHouse books response");
      }
      return result;
    },

    async searchBooks(query, page, language) {
      const books = parseIslamicBookList(
        await getJson(endpoint, {
          action: "search",
          query,
          page,
          language,
        }),
      );
      if (!books) {
        throw new ProviderClientError("Invalid IslamHouse search response");
      }
      return books;
    },

    async getBook(bookId) {
      const book = parseIslamicBook(
        await getJson(endpoint, { action: "detail", bookId }),
      );
      if (!book) {
        throw new ProviderClientError("Invalid IslamHouse book response");
      }
      return book;
    },
  };
}

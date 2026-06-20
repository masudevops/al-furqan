import {
  parseHadithBooks,
  parseHadithChapters,
  parseHadiths,
  type Hadith,
  type HadithBook,
  type HadithChapter,
} from "../contracts/hadith";
import {
  createProviderHttpClient,
  ProviderClientError,
  type ProviderHttpClientOptions,
} from "./http";

export interface HadithProvider {
  getBooks(): Promise<HadithBook[]>;
  getChapters(bookSlug: string): Promise<HadithChapter[]>;
  getHadiths(bookSlug: string, chapterId: string): Promise<Hadith[]>;
}

interface HadithProviderOptions extends ProviderHttpClientOptions {
  endpoint: string;
}

export function createHadithProvider({
  endpoint,
  ...httpOptions
}: HadithProviderOptions): HadithProvider {
  const getJson = createProviderHttpClient(httpOptions);

  return {
    async getBooks() {
      const books = parseHadithBooks(
        await getJson(endpoint, { action: "books" }),
      );
      if (!books) throw new ProviderClientError("Invalid Hadith books response");
      return books;
    },

    async getChapters(bookSlug) {
      const chapters = parseHadithChapters(
        await getJson(endpoint, { action: "chapters", bookSlug }),
      );
      if (!chapters) {
        throw new ProviderClientError("Invalid Hadith chapters response");
      }
      return chapters;
    },

    async getHadiths(bookSlug, chapterId) {
      const hadiths = parseHadiths(
        await getJson(endpoint, {
          action: "hadiths",
          bookSlug,
          chapterId,
        }),
      );
      if (!hadiths) {
        throw new ProviderClientError("Invalid Hadith response");
      }
      return hadiths;
    },
  };
}

import { describe, expect, it } from "vitest";
import {
  parseHadithChapters,
  parseHadiths,
} from "../src/core/contracts/hadith";
import {
  parseIslamicBook,
  parseIslamicBookPage,
} from "../src/core/contracts/islamicBooks";

describe("provider response contracts", () => {
  it("accepts normalized Hadith responses", () => {
    expect(
      parseHadithChapters({
        chapters: [
          {
            id: 1,
            chapterNumber: "1",
            chapterEnglish: "Revelation",
          },
        ],
      }),
    ).toHaveLength(1);

    expect(
      parseHadiths({
        hadiths: [
          {
            id: 1,
            hadithNumber: "1",
            englishNarrator: "Narrator",
            hadithEnglish: "Text",
            bookSlug: "sahih-bukhari",
            chapterId: "1",
          },
        ],
      }),
    ).toHaveLength(1);
  });

  it("rejects malformed Hadith responses", () => {
    expect(parseHadithChapters({ chapters: [{ id: "1" }] })).toBeNull();
    expect(parseHadiths({ hadiths: "not-an-array" })).toBeNull();
  });

  it("accepts normalized IslamHouse responses", () => {
    const book = {
      id: "42",
      title: "A Book",
      description: "Description",
      author: "Author",
      language: "en",
      downloads: [],
      type: "book",
    };

    expect(
      parseIslamicBookPage({ books: [book], total: 1, hasMore: false }),
    ).toEqual({ books: [book], total: 1, hasMore: false });
    expect(parseIslamicBook({ book })).toEqual(book);
  });

  it("rejects malformed IslamHouse responses", () => {
    expect(
      parseIslamicBookPage({ books: [], total: "1", hasMore: false }),
    ).toBeNull();
    expect(parseIslamicBook({ book: { id: "42" } })).toBeNull();
  });
});

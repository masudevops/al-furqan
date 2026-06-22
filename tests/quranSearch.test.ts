import { describe, expect, it } from "vitest";
import {
  MAX_SEARCH_HISTORY,
  SEARCH_HISTORY_KEY,
  addSearchHistory,
  clearSearchHistory,
  encodeSearchPathSegment,
  highlightLiteralText,
  loadSearchHistory,
  normalizeArabic,
} from "../src/core/quran/search";
import type { KeyValueStorage } from "../src/core/quran/readerPreferences";

function createStorage(initial?: string): KeyValueStorage {
  let value = initial ?? null;
  return {
    getItem: () => value,
    setItem: (_key, nextValue) => {
      value = nextValue;
    },
  };
}

describe("Quran search highlighting", () => {
  it("treats regular-expression characters as literal text", () => {
    expect(highlightLiteralText("Before (.*) after", "(.*)")).toEqual([
      { text: "Before ", highlighted: false },
      { text: "(.*)", highlighted: true },
      { text: " after", highlighted: false },
    ]);
  });

  it("preserves HTML-like provider text as plain text segments", () => {
    expect(
      highlightLiteralText('<img src=x onerror="alert(1)"> Mercy', "mercy"),
    ).toEqual([
      {
        text: '<img src=x onerror="alert(1)"> ',
        highlighted: false,
      },
      { text: "Mercy", highlighted: true },
    ]);
  });

  it("supports case-insensitive Arabic and translated text matches", () => {
    expect(highlightLiteralText("Patience and patience", "PATIENCE")).toEqual([
      { text: "Patience", highlighted: true },
      { text: " and ", highlighted: false },
      { text: "patience", highlighted: true },
    ]);
    expect(highlightLiteralText("الصبر جميل", "الصبر")).toEqual([
      { text: "الصبر", highlighted: true },
      { text: " جميل", highlighted: false },
    ]);
  });

  it("normalizes Arabic diacritics, tatweel, and common alef variants", () => {
    expect(normalizeArabic("ٱلصَّبْرُ")).toBe("الصبر");
    expect(normalizeArabic("إِيمَانـ")).toBe("ايمان");
    expect(highlightLiteralText("ٱلصَّبْرُ جَمِيلٌ", "الصبر")).toEqual([
      { text: "ٱلصَّبْرُ", highlighted: true },
      { text: " جَمِيلٌ", highlighted: false },
    ]);
  });

  it("returns unchanged text for an empty query", () => {
    expect(highlightLiteralText("Mercy", "   ")).toEqual([
      { text: "Mercy", highlighted: false },
    ]);
  });

  it("encodes metacharacters as a single provider path segment", () => {
    expect(encodeSearchPathSegment("(.* / mercy")).toBe(
      "%28.%2A%20%2F%20mercy",
    );
  });
});

describe("Quran search history", () => {
  it("deduplicates, orders, and bounds local history", () => {
    const storage = createStorage();
    for (let index = 1; index <= MAX_SEARCH_HISTORY + 2; index += 1) {
      addSearchHistory(storage, `query ${index}`);
    }
    addSearchHistory(storage, "QUERY 5");

    expect(loadSearchHistory(storage)).toEqual([
      "QUERY 5",
      "query 7",
      "query 6",
      "query 4",
      "query 3",
    ]);
  });

  it("recovers invalid history and can clear it", () => {
    const storage = createStorage("{broken");
    expect(loadSearchHistory(storage)).toEqual([]);

    addSearchHistory(storage, "mercy");
    clearSearchHistory(storage);
    expect(storage.getItem(SEARCH_HISTORY_KEY)).toBe("[]");
  });
});

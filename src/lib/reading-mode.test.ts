import { describe, expect, it } from "vitest";

import { readMushafPage, readReadingMode, resumeHref, saveMushafPage, saveReadingMode, versesHrefForMushafPage } from "@/lib/reading-mode";

const memoryStorage = (initial: Record<string, string> = {}) => {
  const values = new Map(Object.entries(initial));
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, values };
};

describe("reading mode preference", () => {
  it("defaults to verse-by-verse without writing a preference", () => {
    const storage = memoryStorage();
    expect(readReadingMode(storage)).toBe("verses");
    expect(storage.values.size).toBe(0);
  });

  it("keeps an explicitly chosen mode", () => {
    const storage = memoryStorage();
    saveReadingMode("mushaf", storage);
    expect(readReadingMode(storage)).toBe("mushaf");
    expect(readReadingMode(memoryStorage({ "af-reading-mode": "unexpected" }))).toBe("verses");
  });

  it("only stores valid Mushaf pages", () => {
    const storage = memoryStorage();
    saveMushafPage(605, storage);
    expect(readMushafPage(storage)).toBeNull();
    saveMushafPage(42, storage);
    expect(readMushafPage(storage)).toBe(42);
  });

  it("survives storage that throws", () => {
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); } };
    expect(readReadingMode(broken)).toBe("verses");
    expect(() => saveReadingMode("mushaf", broken)).not.toThrow();
  });
});

describe("reading position between modes", () => {
  it("resumes in the reader's chosen mode", () => {
    expect(resumeHref("verses", { chapterId: 2, verseNumber: 255 }, 42)).toBe("/quran/2/255");
    expect(resumeHref("verses", null, null)).toBe("/quran/1");
    expect(resumeHref("mushaf", { chapterId: 2, verseNumber: 255 }, 42)).toBe("/quran/mushaf/42");
    expect(resumeHref("mushaf", null, null)).toBe("/quran/mushaf/1");
  });

  it("opens the first Ayah of a Mushaf page in verse-by-verse view", () => {
    expect(versesHrefForMushafPage("2:253")).toBe("/quran/2/253");
    expect(versesHrefForMushafPage(undefined)).toBe("/quran/1");
  });
});

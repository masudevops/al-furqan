// @vitest-environment jsdom

import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  hasLocalBookmark,
  readLocalBookmarks,
  toggleLocalBookmark,
} from "@/lib/local-bookmarks";

describe("local bookmarks", () => {
  beforeAll(() => {
    const values = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        clear: () => values.clear(),
        getItem: (key: string) => values.get(key) ?? null,
        removeItem: (key: string) => values.delete(key),
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
  });

  beforeEach(() => localStorage.clear());

  it("adds and removes a sourced bookmark", () => {
    const bookmark = {
      id: "quran:1:1",
      label: "Al-Fatihah 1:1",
      reference: "1:1",
      type: "quran" as const,
      url: "/quran/1/1",
    };

    const added = toggleLocalBookmark(bookmark);
    expect(hasLocalBookmark(added, bookmark.id)).toBe(true);
    expect(added[0]).toMatchObject(bookmark);
    expect(added[0].savedAt).toBeTruthy();

    expect(toggleLocalBookmark(bookmark)).toEqual([]);
  });

  it("recovers safely from malformed local data", () => {
    localStorage.setItem("af-bookmarks-v1", "not-json");
    expect(readLocalBookmarks()).toEqual([]);
  });
});

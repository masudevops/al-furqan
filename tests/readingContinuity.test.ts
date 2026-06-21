import { describe, expect, it } from "vitest";
import {
  LEGACY_BOOKMARKS_KEY,
  MAX_RECENT_SURAHS,
  READING_CONTINUITY_KEY,
  createReadingContinuityRepository,
} from "../src/core/quran/readingContinuity";
import type { KeyValueStorage } from "../src/core/quran/readerPreferences";

function createStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe("reading continuity repository", () => {
  it("migrates valid legacy bookmarks once without deleting legacy data", () => {
    const legacy = JSON.stringify([
      { surah: 2, ayah: 255 },
      { surah: 2, ayah: 255 },
      { surah: 114, ayah: 7 },
      { surah: 999, ayah: 1 },
    ]);
    const storage = createStorage({ [LEGACY_BOOKMARKS_KEY]: legacy });
    const repository = createReadingContinuityRepository(
      storage,
      () => "2026-06-21T12:00:00.000Z",
    );

    expect(repository.getState().bookmarks).toEqual([
      {
        ref: { surahNumber: 2, ayahNumber: 255 },
        createdAt: "2026-06-21T12:00:00.000Z",
      },
    ]);
    expect(storage.getItem(LEGACY_BOOKMARKS_KEY)).toBe(legacy);
    expect(storage.getItem(READING_CONTINUITY_KEY)).toContain('"version":1');
  });

  it("recovers corrupted storage and never creates invalid references", () => {
    const storage = createStorage({
      [READING_CONTINUITY_KEY]: "{broken",
      [LEGACY_BOOKMARKS_KEY]: JSON.stringify([{ surah: 1, ayah: 99 }]),
    });

    expect(createReadingContinuityRepository(storage).getState()).toEqual({
      version: 1,
      bookmarks: [],
      lastRead: null,
      recentSurahs: [],
    });
  });

  it("persists bookmark toggles and last-read position", () => {
    let timestamp = 0;
    const repository = createReadingContinuityRepository(
      createStorage(),
      () => `2026-06-21T12:00:0${timestamp++}.000Z`,
    );

    repository.toggleBookmark(
      { surahNumber: 1, ayahNumber: 2 },
      "en.sahih",
    );
    const state = repository.setLastRead({ surahNumber: 1, ayahNumber: 2 });

    expect(state.bookmarks[0]).toEqual(
      expect.objectContaining({
        ref: { surahNumber: 1, ayahNumber: 2 },
        translationEdition: "en.sahih",
      }),
    );
    expect(state.lastRead?.ref).toEqual({ surahNumber: 1, ayahNumber: 2 });
    expect(state.recentSurahs[0]).toEqual(
      expect.objectContaining({
        surahNumber: 1,
        lastAyahNumber: 2,
      }),
    );

    expect(
      repository.toggleBookmark({ surahNumber: 1, ayahNumber: 2 }).bookmarks,
    ).toEqual([]);
  });

  it("keeps recent Surahs unique, ordered, and bounded", () => {
    const repository = createReadingContinuityRepository(createStorage());
    for (let surah = 1; surah <= MAX_RECENT_SURAHS + 2; surah += 1) {
      repository.recordSurahVisit(surah);
    }
    repository.recordSurahVisit(4);

    expect(repository.getState().recentSurahs.map((item) => item.surahNumber)).toEqual([
      4, 7, 6, 5, 3,
    ]);
  });
});

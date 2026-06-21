import { isRecord, isString } from "../contracts/validation";
import type { AyahReference } from "./contracts";
import { isValidAyahReference } from "./metadata";
import type { KeyValueStorage } from "./readerPreferences";

export const READING_CONTINUITY_KEY = "alFurqan.quran.continuity";
export const LEGACY_BOOKMARKS_KEY = "quranBookmarks";
export const READING_CONTINUITY_VERSION = 1;
export const MAX_RECENT_SURAHS = 5;

export interface QuranBookmark {
  ref: AyahReference;
  createdAt: string;
  translationEdition?: string;
}

export interface ReadingPosition {
  ref: AyahReference;
  updatedAt: string;
}

export interface RecentSurah {
  surahNumber: number;
  lastAyahNumber: number;
  visitedAt: string;
}

export interface ReadingContinuityState {
  version: typeof READING_CONTINUITY_VERSION;
  bookmarks: QuranBookmark[];
  lastRead: ReadingPosition | null;
  recentSurahs: RecentSurah[];
}

export interface ReadingContinuityRepository {
  getState(): ReadingContinuityState;
  toggleBookmark(ref: AyahReference, translationEdition?: string): ReadingContinuityState;
  removeBookmark(ref: AyahReference): ReadingContinuityState;
  setLastRead(ref: AyahReference): ReadingContinuityState;
  recordSurahVisit(surahNumber: number, ayahNumber?: number): ReadingContinuityState;
}

const EMPTY_STATE: ReadingContinuityState = {
  version: READING_CONTINUITY_VERSION,
  bookmarks: [],
  lastRead: null,
  recentSurahs: [],
};

function isIsoDate(value: unknown): value is string {
  return isString(value) && !Number.isNaN(Date.parse(value));
}

function parseRef(value: unknown): AyahReference | null {
  if (!isRecord(value)) return null;
  const surahNumber = value.surahNumber;
  const ayahNumber = value.ayahNumber;
  return typeof surahNumber === "number" &&
    typeof ayahNumber === "number" &&
    isValidAyahReference(surahNumber, ayahNumber)
    ? { surahNumber, ayahNumber }
    : null;
}

function parseBookmark(value: unknown): QuranBookmark | null {
  if (!isRecord(value)) return null;
  const ref = parseRef(value.ref);
  if (!ref || !isIsoDate(value.createdAt)) return null;
  return {
    ref,
    createdAt: value.createdAt,
    translationEdition: isString(value.translationEdition)
      ? value.translationEdition
      : undefined,
  };
}

function parseState(value: unknown): ReadingContinuityState | null {
  if (
    !isRecord(value) ||
    value.version !== READING_CONTINUITY_VERSION ||
    !Array.isArray(value.bookmarks) ||
    !Array.isArray(value.recentSurahs)
  ) {
    return null;
  }

  const bookmarks = value.bookmarks
    .map(parseBookmark)
    .filter((bookmark): bookmark is QuranBookmark => bookmark !== null);

  let lastRead: ReadingPosition | null = null;
  if (value.lastRead !== null && isRecord(value.lastRead)) {
    const ref = parseRef(value.lastRead.ref);
    if (ref && isIsoDate(value.lastRead.updatedAt)) {
      lastRead = { ref, updatedAt: value.lastRead.updatedAt };
    }
  }

  const recentSurahs = value.recentSurahs
    .map((item): RecentSurah | null => {
      if (!isRecord(item) || !isIsoDate(item.visitedAt)) return null;
      const surahNumber = item.surahNumber;
      const lastAyahNumber = item.lastAyahNumber;
      return typeof surahNumber === "number" &&
        typeof lastAyahNumber === "number" &&
        isValidAyahReference(surahNumber, lastAyahNumber)
        ? { surahNumber, lastAyahNumber, visitedAt: item.visitedAt }
        : null;
    })
    .filter((item): item is RecentSurah => item !== null)
    .slice(0, MAX_RECENT_SURAHS);

  return {
    version: READING_CONTINUITY_VERSION,
    bookmarks,
    lastRead,
    recentSurahs,
  };
}

function migrateLegacyBookmarks(raw: string | null, now: string): QuranBookmark[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    const bookmarks: QuranBookmark[] = [];

    for (const item of value) {
      if (!isRecord(item)) continue;
      const surahNumber =
        typeof item.surah === "number" ? item.surah : item.surahNumber;
      const ayahNumber =
        typeof item.ayah === "number" ? item.ayah : item.ayahNumber;
      if (
        typeof surahNumber !== "number" ||
        typeof ayahNumber !== "number" ||
        !isValidAyahReference(surahNumber, ayahNumber)
      ) {
        continue;
      }
      const key = `${surahNumber}:${ayahNumber}`;
      if (seen.has(key)) continue;
      seen.add(key);
      bookmarks.push({
        ref: { surahNumber, ayahNumber },
        createdAt: isIsoDate(item.dateAdded) ? item.dateAdded : now,
      });
    }
    return bookmarks;
  } catch {
    return [];
  }
}

export function createReadingContinuityRepository(
  storage: KeyValueStorage,
  now: () => string = () => new Date().toISOString(),
): ReadingContinuityRepository {
  const persist = (state: ReadingContinuityState) => {
    storage.setItem(READING_CONTINUITY_KEY, JSON.stringify(state));
    return state;
  };

  const getState = (): ReadingContinuityState => {
    const raw = storage.getItem(READING_CONTINUITY_KEY);
    if (raw) {
      try {
        const parsed = parseState(JSON.parse(raw));
        if (parsed) return parsed;
      } catch {
        // Recover below from legacy data or an empty state.
      }
    }

    return persist({
      ...EMPTY_STATE,
      bookmarks: migrateLegacyBookmarks(
        storage.getItem(LEGACY_BOOKMARKS_KEY),
        now(),
      ),
    });
  };

  return {
    getState,
    toggleBookmark(ref, translationEdition) {
      if (!isValidAyahReference(ref.surahNumber, ref.ayahNumber)) {
        return getState();
      }
      const state = getState();
      const exists = state.bookmarks.some(
        (bookmark) =>
          bookmark.ref.surahNumber === ref.surahNumber &&
          bookmark.ref.ayahNumber === ref.ayahNumber,
      );
      return persist({
        ...state,
        bookmarks: exists
          ? state.bookmarks.filter(
              (bookmark) =>
                bookmark.ref.surahNumber !== ref.surahNumber ||
                bookmark.ref.ayahNumber !== ref.ayahNumber,
            )
          : [...state.bookmarks, { ref, createdAt: now(), translationEdition }],
      });
    },
    removeBookmark(ref) {
      const state = getState();
      return persist({
        ...state,
        bookmarks: state.bookmarks.filter(
          (bookmark) =>
            bookmark.ref.surahNumber !== ref.surahNumber ||
            bookmark.ref.ayahNumber !== ref.ayahNumber,
        ),
      });
    },
    setLastRead(ref) {
      if (!isValidAyahReference(ref.surahNumber, ref.ayahNumber)) {
        return getState();
      }
      const timestamp = now();
      const state = getState();
      const recentSurahs = [
        {
          surahNumber: ref.surahNumber,
          lastAyahNumber: ref.ayahNumber,
          visitedAt: timestamp,
        },
        ...state.recentSurahs.filter(
          (item) => item.surahNumber !== ref.surahNumber,
        ),
      ].slice(0, MAX_RECENT_SURAHS);
      return persist({
        ...state,
        lastRead: { ref, updatedAt: timestamp },
        recentSurahs,
      });
    },
    recordSurahVisit(surahNumber, ayahNumber = 1) {
      if (!isValidAyahReference(surahNumber, ayahNumber)) return getState();
      const state = getState();
      const previous = state.recentSurahs.find(
        (item) => item.surahNumber === surahNumber,
      );
      return persist({
        ...state,
        recentSurahs: [
          {
            surahNumber,
            lastAyahNumber: previous?.lastAyahNumber ?? ayahNumber,
            visitedAt: now(),
          },
          ...state.recentSurahs.filter(
            (item) => item.surahNumber !== surahNumber,
          ),
        ].slice(0, MAX_RECENT_SURAHS),
      });
    },
  };
}

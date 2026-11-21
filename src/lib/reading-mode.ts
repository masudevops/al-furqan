export type ReadingMode = "verses" | "mushaf";

export const READING_MODE_KEY = "af-reading-mode";
export const MUSHAF_PAGE_KEY = "af-mushaf-page";

type PreferenceStorage = Pick<Storage, "getItem" | "setItem">;

const browserStorage = (): PreferenceStorage | null => {
  try { return typeof window === "undefined" ? null : window.localStorage; } catch { return null; }
};

// Verse-by-verse is the default; a mode is only stored when the reader explicitly switches.
export const readReadingMode = (storage = browserStorage()): ReadingMode => {
  try { return storage?.getItem(READING_MODE_KEY) === "mushaf" ? "mushaf" : "verses"; } catch { return "verses"; }
};

export const saveReadingMode = (mode: ReadingMode, storage = browserStorage()) => {
  try { storage?.setItem(READING_MODE_KEY, mode); } catch {}
};

export const readMushafPage = (storage = browserStorage()): number | null => {
  try {
    const page = Number(storage?.getItem(MUSHAF_PAGE_KEY));
    return Number.isInteger(page) && page >= 1 && page <= 604 ? page : null;
  } catch { return null; }
};

export const saveMushafPage = (page: number, storage = browserStorage()) => {
  if (!Number.isInteger(page) || page < 1 || page > 604) return;
  try { storage?.setItem(MUSHAF_PAGE_KEY, String(page)); } catch {}
};

type LastRead = { chapterId: number; verseNumber: number } | null;

// Where "Begin reading" / "Resume" should go for the reader's chosen mode.
export const resumeHref = (mode: ReadingMode, lastRead: LastRead, mushafPage: number | null) =>
  mode === "mushaf"
    ? `/quran/mushaf/${mushafPage ?? 1}`
    : lastRead ? `/quran/${lastRead.chapterId}/${lastRead.verseNumber}` : "/quran/1";

// The first Ayah on a Mushaf page opens verse-by-verse at the same place.
export const versesHrefForMushafPage = (firstVerseKey: string | undefined) => {
  const [chapter, verse] = (firstVerseKey ?? "").split(":").map(Number);
  return Number.isInteger(chapter) && chapter >= 1 && chapter <= 114 && Number.isInteger(verse) && verse >= 1 ? `/quran/${chapter}/${verse}` : "/quran/1";
};

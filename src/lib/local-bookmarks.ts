export type LocalBookmarkType = "quran" | "dua" | "sunnah";

export interface LocalBookmark {
  id: string;
  label: string;
  reference: string;
  type: LocalBookmarkType;
  url: string;
  savedAt: string;
}

const STORAGE_KEY = "af-bookmarks-v1";

export function readLocalBookmarks(): LocalBookmark[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((item): item is LocalBookmark =>
      Boolean(item && typeof item.id === "string" && typeof item.type === "string")) : [];
  } catch {
    return [];
  }
}

export function toggleLocalBookmark(bookmark: Omit<LocalBookmark, "savedAt">): LocalBookmark[] {
  const current = readLocalBookmarks();
  const next = current.some((item) => item.id === bookmark.id)
    ? current.filter((item) => item.id !== bookmark.id)
    : [...current, { ...bookmark, savedAt: new Date().toISOString() }];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export const hasLocalBookmark = (items: LocalBookmark[], id: string) =>
  items.some((item) => item.id === id);

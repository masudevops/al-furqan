import type { KeyValueStorage } from "./readerPreferences";

export const SEARCH_HISTORY_KEY = "alFurqan.quran.searchHistory";
export const MAX_SEARCH_HISTORY = 5;

export const QURAN_SEARCH_EDITIONS = [
  { identifier: "quran-simple", language: "ar", label: "Arabic" },
  { identifier: "en.sahih", language: "en", label: "English" },
  { identifier: "bn.bengali", language: "bn", label: "Bengali" },
  { identifier: "ur.jalandhry", language: "ur", label: "Urdu" },
] as const;

export type QuranSearchEdition =
  (typeof QURAN_SEARCH_EDITIONS)[number]["identifier"];

export interface QuranSearchRequest {
  query: string;
  edition: QuranSearchEdition;
  surahNumber?: number;
  juzNumber?: number;
}

export interface SearchTextSegment {
  text: string;
  highlighted: boolean;
}

export function encodeSearchPathSegment(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export function normalizeArabic(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[ٱأإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ـ/g, "");
}

export function normalizeSearchText(value: string): string {
  return normalizeArabic(value).toLocaleLowerCase().trim();
}

function buildNormalizedIndex(text: string): {
  normalized: string;
  sourceIndexes: number[];
} {
  let normalized = "";
  const sourceIndexes: number[] = [];
  let sourceIndex = 0;

  for (const character of text) {
    const normalizedCharacter = normalizeArabic(character).toLocaleLowerCase();
    normalized += normalizedCharacter;
    sourceIndexes.push(
      ...Array.from(normalizedCharacter, () => sourceIndex),
    );
    sourceIndex += character.length;
  }

  return { normalized, sourceIndexes };
}

export function highlightLiteralText(
  text: string,
  query: string,
): SearchTextSegment[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return [{ text, highlighted: false }];
  }

  const { normalized, sourceIndexes } = buildNormalizedIndex(text);
  const segments: SearchTextSegment[] = [];
  let normalizedCursor = 0;
  let sourceCursor = 0;

  while (normalizedCursor < normalized.length) {
    const matchIndex = normalized.indexOf(normalizedQuery, normalizedCursor);
    if (matchIndex === -1) break;

    const sourceStart = sourceIndexes[matchIndex];
    const finalNormalizedIndex = matchIndex + normalizedQuery.length - 1;
    const finalSourceIndex = sourceIndexes[finalNormalizedIndex];
    const finalCharacter = Array.from(text.slice(finalSourceIndex))[0] ?? "";
    let sourceEnd = finalSourceIndex + finalCharacter.length;
    for (const followingCharacter of text.slice(sourceEnd)) {
      if (normalizeArabic(followingCharacter) !== "") break;
      sourceEnd += followingCharacter.length;
    }

    if (sourceStart > sourceCursor) {
      segments.push({
        text: text.slice(sourceCursor, sourceStart),
        highlighted: false,
      });
    }
    segments.push({
      text: text.slice(sourceStart, sourceEnd),
      highlighted: true,
    });

    sourceCursor = sourceEnd;
    normalizedCursor = matchIndex + normalizedQuery.length;
  }

  if (sourceCursor < text.length) {
    segments.push({ text: text.slice(sourceCursor), highlighted: false });
  }

  return segments.length > 0
    ? segments
    : [{ text, highlighted: false }];
}

export function isQuranSearchEdition(
  value: string | null,
): value is QuranSearchEdition {
  return QURAN_SEARCH_EDITIONS.some(
    (edition) => edition.identifier === value,
  );
}

export function loadSearchHistory(storage: KeyValueStorage): string[] {
  const raw = storage.getItem(SEARCH_HISTORY_KEY);
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, MAX_SEARCH_HISTORY);
  } catch {
    return [];
  }
}

export function saveSearchHistory(
  storage: KeyValueStorage,
  history: string[],
): string[] {
  const uniqueHistory = [...new Set(history.map((item) => item.trim()))]
    .filter(Boolean)
    .slice(0, MAX_SEARCH_HISTORY);
  storage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(uniqueHistory));
  return uniqueHistory;
}

export function addSearchHistory(
  storage: KeyValueStorage,
  query: string,
): string[] {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return loadSearchHistory(storage);
  return saveSearchHistory(storage, [
    trimmedQuery,
    ...loadSearchHistory(storage).filter(
      (item) =>
        item.toLocaleLowerCase() !== trimmedQuery.toLocaleLowerCase(),
    ),
  ]);
}

export function clearSearchHistory(storage: KeyValueStorage): void {
  storage.setItem(SEARCH_HISTORY_KEY, "[]");
}

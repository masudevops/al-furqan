export type ReaderDensity = "comfortable" | "compact";

export interface ReaderPreferences {
  arabicFontSize: number;
  translationFontSize: number;
  showTranslation: boolean;
  showTransliteration: boolean;
  showWordByWord: boolean;
  memorizationMode: boolean;
  density: ReaderDensity;
}

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const READER_PREFERENCES_KEY = "quranReaderPreferences";

export const DEFAULT_READER_PREFERENCES: ReaderPreferences = {
  arabicFontSize: 38,
  translationFontSize: 18,
  showTranslation: true,
  showTransliteration: false,
  showWordByWord: false,
  memorizationMode: false,
  density: "comfortable",
};

export function clampArabicFontSize(value: number): number {
  return Math.min(52, Math.max(28, Math.round(value / 2) * 2));
}

export function loadReaderPreferences(
  storage: KeyValueStorage,
): ReaderPreferences {
  const stored = storage.getItem(READER_PREFERENCES_KEY);
  if (!stored) return DEFAULT_READER_PREFERENCES;

  try {
    const value = JSON.parse(stored) as Partial<ReaderPreferences>;
    return {
      arabicFontSize:
        typeof value.arabicFontSize === "number"
          ? clampArabicFontSize(value.arabicFontSize)
          : DEFAULT_READER_PREFERENCES.arabicFontSize,
      showTranslation:
        typeof value.showTranslation === "boolean"
          ? value.showTranslation
          : DEFAULT_READER_PREFERENCES.showTranslation,
      translationFontSize:
        typeof value.translationFontSize === "number"
          ? Math.min(28, Math.max(14, value.translationFontSize))
          : DEFAULT_READER_PREFERENCES.translationFontSize,
      showTransliteration:
        typeof value.showTransliteration === "boolean"
          ? value.showTransliteration
          : DEFAULT_READER_PREFERENCES.showTransliteration,
      showWordByWord:
        typeof value.showWordByWord === "boolean"
          ? value.showWordByWord
          : DEFAULT_READER_PREFERENCES.showWordByWord,
      memorizationMode:
        typeof value.memorizationMode === "boolean"
          ? value.memorizationMode
          : DEFAULT_READER_PREFERENCES.memorizationMode,
      density:
        value.density === "compact" || value.density === "comfortable"
          ? value.density
          : DEFAULT_READER_PREFERENCES.density,
    };
  } catch {
    return DEFAULT_READER_PREFERENCES;
  }
}

export function saveReaderPreferences(
  storage: KeyValueStorage,
  preferences: ReaderPreferences,
): void {
  storage.setItem(
    READER_PREFERENCES_KEY,
    JSON.stringify({
      ...preferences,
      arabicFontSize: clampArabicFontSize(preferences.arabicFontSize),
    }),
  );
}

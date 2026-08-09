import type { VerseWords } from "../core/quran/wordByWord";
import { normalizeVerseWords } from "../core/quran/wordByWord";
import {
  cacheVerseWords,
  getCachedVerseWords,
} from "../platform/web/wordByWordCache";

function normalizeGatewayResponse(value: unknown): VerseWords | null {
  if (typeof value !== "object" || value === null) return null;
  const item = value as Partial<VerseWords>;
  if (
    typeof item.verseKey !== "string" ||
    item.source !== "Quran Foundation" ||
    !Array.isArray(item.words)
  ) return null;
  return normalizeVerseWords({
    verse: {
      verse_key: item.verseKey,
      words: item.words.map((word) => ({
        ...word,
        text_uthmani: word.arabic,
        char_type_name: "word",
        translation: { text: word.translation, language_name: word.language },
        transliteration: { text: word.transliteration, language_name: word.language },
      })),
    },
  });
}

export async function fetchVerseWords(
  surah: number,
  ayah: number,
  language = "en",
): Promise<VerseWords> {
  const key = `${surah}:${ayah}`;
  try {
    const response = await fetch(
      `/api/quran-words?${new URLSearchParams({
        surah: String(surah),
        ayah: String(ayah),
        language,
      })}`,
      { headers: { Accept: "application/json" } },
    );
    if (!response.ok) throw new Error(`Word provider HTTP ${response.status}`);
    const value = normalizeGatewayResponse(await response.json());
    if (!value) throw new Error("Invalid word provider response");
    await cacheVerseWords(value);
    return value;
  } catch (error) {
    const cached = await getCachedVerseWords(key);
    if (cached) return cached;
    throw error;
  }
}

export interface QuranWord {
  id: number;
  position: number;
  arabic: string;
  translation: string;
  transliteration: string;
  language: string;
}

export interface VerseWords {
  verseKey: string;
  words: QuranWord[];
  source: "Quran Foundation";
}

type UnknownRecord = Record<string, unknown>;

function record(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : null;
}

function plainText(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
}

export function normalizeVerseWords(value: unknown): VerseWords | null {
  const root = record(value);
  const verse = record(root?.verse);
  const verseKey = verse?.verse_key;
  const rawWords = verse?.words;
  if (typeof verseKey !== "string" || !Array.isArray(rawWords)) return null;

  const words = rawWords.flatMap((item): QuranWord[] => {
    const word = record(item);
    if (!word || word.char_type_name === "end") return [];
    const id = word.id;
    const position = word.position;
    const translation = record(word.translation);
    const transliteration = record(word.transliteration);
    const arabic = plainText(
      word.text_uthmani ?? word.text_qpc_hafs ?? word.text_imlaei_simple,
    );
    if (typeof id !== "number" || typeof position !== "number" || !arabic) {
      return [];
    }
    return [{
      id,
      position,
      arabic,
      translation: plainText(translation?.text),
      transliteration: plainText(transliteration?.text),
      language:
        typeof translation?.language_name === "string"
          ? translation.language_name
          : "english",
    }];
  });

  if (words.length === 0) return null;
  return { verseKey, words, source: "Quran Foundation" };
}

import type { ReaderPayload } from "@/lib/types";

type Verse = Pick<ReaderPayload["verses"][number], "verseKey" | "pageNumber" | "juzNumber" | "hizbNumber">;

export type ReaderPosition = { index: number; page: number | null; juz: number | null; hizb: number | null };

// Position comes only from the source's own page/Juz/Hizb metadata; nothing is inferred.
export const positionOfVerse = (verses: readonly Verse[], verseKey: string | null): ReaderPosition | null => {
  if (!verses.length) return null;
  const found = verseKey ? verses.findIndex((verse) => verse.verseKey === verseKey) : -1;
  const index = found >= 0 ? found : 0;
  const verse = verses[index];
  return { index, page: verse.pageNumber, juz: verse.juzNumber, hizb: verse.hizbNumber };
};

export const positionLabels = (position: ReaderPosition | null) => ({
  page: position?.page ? `Page ${position.page}` : null,
  section: [position?.juz ? `Juz ${position.juz}` : null, position?.hizb ? `Hizb ${position.hizb}` : null].filter(Boolean).join(" / ") || null,
});

export const mushafHrefFor = (position: ReaderPosition | null) => `/quran/mushaf/${position?.page ?? 1}`;

const REVELATION_PLACES: Record<string, string> = { makkah: "Makkah", madinah: "Madinah" };

export const revelationLabel = (place: string | null | undefined) => {
  const key = place?.trim().toLowerCase();
  if (!key) return null;
  return REVELATION_PLACES[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
};

// The source catalog falls back to an Arabic name when no English meaning exists; never show that as a "meaning".
export const englishMeaning = (translatedName: string | null | undefined) =>
  translatedName && !/[؀-ۿ]/.test(translatedName) ? translatedName : null;

const ARABIC_INDIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export const toArabicIndicDigits = (value: number) =>
  String(value).replace(/\d/g, (digit) => ARABIC_INDIC_DIGITS[Number(digit)]);

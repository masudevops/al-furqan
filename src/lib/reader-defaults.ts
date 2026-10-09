import type { QuranScript, RecitationResource, TranslationResource } from "@/lib/types";

// Shared by the server-rendered Surah page and the client reader so both pick the same
// default resources and build byte-identical /api/reader keys for the same request.

export const DEFAULT_QURAN_SCRIPT: QuranScript = "uthmani";

export const preferredTranslation = (items: TranslationResource[]) =>
  items.find((item) => /\b(saheeh|sahih) international\b/i.test(item.name));

export const preferredRecitation = (items: RecitationResource[]) =>
  items.find((item) => /minshawi/i.test(item.name) && /murattal/i.test(item.style ?? ""))
  ?? items.find((item) => /minshawi/i.test(item.name));

export type ReaderSelection = { translationId: number; recitationId: number; script: QuranScript };

export const defaultReaderSelection = (translations: TranslationResource[], recitations: RecitationResource[]): ReaderSelection | null => {
  const translationId = (preferredTranslation(translations) ?? translations[0])?.id;
  const recitationId = (preferredRecitation(recitations) ?? recitations[0])?.id;
  return translationId && recitationId ? { translationId, recitationId, script: DEFAULT_QURAN_SCRIPT } : null;
};

export const readerRequestKey = (
  chapterId: string | number,
  { translationId, recitationId, script, words = false, tafsirId = null }: ReaderSelection & { words?: boolean; tafsirId?: number | null },
) => `/api/reader/${chapterId}?translation=${translationId}&recitation=${recitationId}&script=${script}${words ? "&words=1" : ""}${tafsirId ? `&tafsir=${tafsirId}` : ""}`;

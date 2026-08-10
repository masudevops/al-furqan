export type AyahRepeatCount = 1 | 3 | 5;

export interface AudioSequenceItem {
  audioUrl: string | null;
  verseKey: string | null;
  verseNumber: number | null;
}

export interface NextAudioStep {
  nextVerseKey: string | null;
  replayCurrent: boolean;
}

interface ResolveNextAudioStepOptions {
  activeRange: boolean;
  currentVerseKey: string | null;
  completedPlay: number;
  rangeEnd: number;
  repeatCount: AyahRepeatCount;
  verses: AudioSequenceItem[];
}

export function normalizeAyahRange(start: number, end: number, verseCount: number) {
  const maximum = Math.max(1, Math.floor(verseCount));
  const normalizedStart = Math.min(maximum, Math.max(1, Math.floor(start) || 1));
  const normalizedEnd = Math.min(maximum, Math.max(normalizedStart, Math.floor(end) || normalizedStart));
  return { end: normalizedEnd, start: normalizedStart };
}

export function resolveNextAudioStep({
  activeRange,
  completedPlay,
  currentVerseKey,
  rangeEnd,
  repeatCount,
  verses,
}: ResolveNextAudioStepOptions): NextAudioStep {
  if (!currentVerseKey) return { nextVerseKey: null, replayCurrent: false };
  if (activeRange && completedPlay < repeatCount) {
    return { nextVerseKey: currentVerseKey, replayCurrent: true };
  }

  const currentIndex = verses.findIndex((verse) => verse.verseKey === currentVerseKey);
  if (currentIndex < 0) return { nextVerseKey: null, replayCurrent: false };
  const current = verses[currentIndex];
  if (activeRange && (current.verseNumber ?? Number.POSITIVE_INFINITY) >= rangeEnd) {
    return { nextVerseKey: null, replayCurrent: false };
  }

  const next = verses.slice(currentIndex + 1).find((verse) => Boolean(verse.audioUrl && verse.verseKey));
  if (!next || (activeRange && (next.verseNumber ?? Number.POSITIVE_INFINITY) > rangeEnd)) {
    return { nextVerseKey: null, replayCurrent: false };
  }
  return { nextVerseKey: next.verseKey, replayCurrent: false };
}

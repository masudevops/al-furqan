// Versioned local storage for Learn progress (project rule: larger local state goes through a versioned abstraction).
export const PROGRESS_KEY = "af-learn-v1";
export const PROGRESS_VERSION = 1;

export type LetterStat = { correct: number; wrong: number; lastSeen: number };
export type LearnProgress = { version: typeof PROGRESS_VERSION; completedDays: number[]; letters: Record<string, LetterStat> };

type Storage = Pick<globalThis.Storage, "getItem" | "setItem">;

export const emptyProgress = (): LearnProgress => ({ version: PROGRESS_VERSION, completedDays: [], letters: {} });

const browserStorage = (): Storage | null => {
  try { return typeof window === "undefined" ? null : window.localStorage; } catch { return null; }
};

// Unknown or future versions start fresh rather than misreading data.
export const parseProgress = (raw: string | null): LearnProgress => {
  if (!raw) return emptyProgress();
  try {
    const value = JSON.parse(raw) as Partial<LearnProgress>;
    if (value.version !== PROGRESS_VERSION || !Array.isArray(value.completedDays) || typeof value.letters !== "object" || !value.letters) return emptyProgress();
    return { version: PROGRESS_VERSION, completedDays: value.completedDays.filter((day) => Number.isInteger(day)), letters: value.letters };
  } catch { return emptyProgress(); }
};

export const readProgress = (storage = browserStorage()) => {
  try { return parseProgress(storage?.getItem(PROGRESS_KEY) ?? null); } catch { return emptyProgress(); }
};

export const writeProgress = (progress: LearnProgress, storage = browserStorage()) => {
  try { storage?.setItem(PROGRESS_KEY, JSON.stringify(progress)); } catch {}
  return progress;
};

export const recordAnswer = (progress: LearnProgress, letter: string, correct: boolean, now = Date.now()): LearnProgress => {
  const stat = progress.letters[letter] ?? { correct: 0, wrong: 0, lastSeen: 0 };
  return { ...progress, letters: { ...progress.letters, [letter]: { correct: stat.correct + (correct ? 1 : 0), wrong: stat.wrong + (correct ? 0 : 1), lastSeen: now } } };
};

export const completeDay = (progress: LearnProgress, day: number): LearnProgress =>
  progress.completedDays.includes(day) ? progress : { ...progress, completedDays: [...progress.completedDays, day].sort((a, b) => a - b) };

// Letters most worth reviewing first: more mistakes than successes, then the longest unseen.
export const reviewPriority = (progress: LearnProgress, letters: readonly string[], limit: number, now = Date.now()) =>
  [...letters]
    .map((letter) => {
      const stat = progress.letters[letter] ?? { correct: 0, wrong: 0, lastSeen: 0 };
      const days = stat.lastSeen ? (now - stat.lastSeen) / 86_400_000 : 30;
      return { letter, score: stat.wrong * 2 - stat.correct + Math.min(days, 30) / 3 };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.letter);

export const nextDay = (progress: LearnProgress, availableDays: number) => {
  for (let day = 1; day <= availableDays; day++) if (!progress.completedDays.includes(day)) return day;
  return null;
};

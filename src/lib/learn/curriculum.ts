import { ARABIC_LETTERS } from "./alphabet";

export const COURSE_DAYS = 30;
export const CURRICULUM_VERSION = 1;

export type ReviewStatus = "awaiting-review" | "reviewed";

export type QaidahLesson = {
  day: number;
  slug: string;
  letters: string[];
  // Every lesson ships as a draft until a qualified teacher signs off; the flag keeps drafts off production.
  status: "draft" | "published";
  review: { explanation: ReviewStatus; audio: ReviewStatus; reviewer: string | null };
  sources: string[];
};

const SOURCES = [
  "Letters, names and joining forms: Unicode Character Database",
  "Practice words and word audio: Quran.Foundation Content API",
];

// Days 1–7 introduce the 28 letters four at a time in standard alphabetical order. Grouping, explanations and the
// remaining days are pending review by a qualified teacher; see docs/LEARN-QAIDAH.md.
export const QAIDAH_LESSONS: readonly QaidahLesson[] = Array.from({ length: 7 }, (_, index) => ({
  day: index + 1,
  slug: `day-${index + 1}`,
  letters: ARABIC_LETTERS.slice(index * 4, index * 4 + 4).map((letter) => letter.char),
  status: "draft" as const,
  review: { explanation: "awaiting-review" as const, audio: "awaiting-review" as const, reviewer: null },
  sources: SOURCES,
}));

export const lessonForDay = (day: number) => QAIDAH_LESSONS.find((lesson) => lesson.day === day);

export const lettersLearnedBefore = (day: number) => QAIDAH_LESSONS.filter((lesson) => lesson.day < day).flatMap((lesson) => lesson.letters);

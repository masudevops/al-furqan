import { ARABIC_LETTERS } from "./alphabet";
import type { MarkId } from "./marks";

export const COURSE_DAYS = 30;
export const CURRICULUM_VERSION = 2;

export type ReviewStatus = "awaiting-review" | "reviewed";

export type LessonFocus =
  | { kind: "letters"; letters: string[] }
  | { kind: "review" }
  | { kind: "forms"; position: "initial" | "medial" | "final" }
  | { kind: "first-letter" }
  | { kind: "mark"; marks: MarkId[] }
  | { kind: "first-vowel" }
  | { kind: "marks-review"; marks: MarkId[] }
  | { kind: "listen"; minLetters: number; maxLetters: number }
  | { kind: "read-along"; chapterId: number; chapterName: string };

export type QaidahLesson = {
  day: number;
  slug: string;
  title: string;
  subtitle: string;
  focus: LessonFocus;
  // Letters introduced on this day (days 1–7); empty for later days.
  letters: string[];
  // Every lesson ships as a draft until a qualified teacher signs off; the flag keeps drafts off production.
  status: "draft" | "published";
  review: { explanation: ReviewStatus; audio: ReviewStatus; reviewer: string | null };
  sources: string[];
};

const LETTER_SOURCES = ["Letters, names and joining forms: Unicode Character Database", "Practice words and word audio: Quran.Foundation Content API"];
const MARK_SOURCES = ["Marks and their names: Unicode Character Database", "Practice words, word audio and transliteration: Quran.Foundation Content API"];
const READING_SOURCES = ["Words, word audio, transliteration and word-by-word translation: Quran.Foundation Content API"];

const lesson = (day: number, title: string, subtitle: string, focus: LessonFocus, sources: string[], letters: string[] = []): QaidahLesson => ({
  day, slug: `day-${day}`, title, subtitle, focus, letters, status: "draft",
  review: { explanation: "awaiting-review", audio: "awaiting-review", reviewer: null }, sources,
});

const BASIC_MARKS: MarkId[] = ["fatha", "kasra", "damma", "fathatan", "dammatan", "kasratan", "sukun", "shadda"];

// The 30-day order is a placeholder built only from sourced material (Unicode marks and real Quran words). The plan,
// grouping and any explanations are pending review by a qualified teacher; see docs/LEARN-QAIDAH.md.
export const QAIDAH_LESSONS: readonly QaidahLesson[] = [
  ...Array.from({ length: 7 }, (_, index) => {
    const letters = ARABIC_LETTERS.slice(index * 4, index * 4 + 4).map((letter) => letter.char);
    return lesson(index + 1, `Letters ${letters.join(" ")}`, "Four new letters", { kind: "letters", letters }, LETTER_SOURCES, letters);
  }),
  lesson(8, "Review all letters", "All 28 letters, mixed", { kind: "review" }, LETTER_SOURCES),
  lesson(9, "Start forms", "Each letter at the start of a word", { kind: "forms", position: "initial" }, LETTER_SOURCES),
  lesson(10, "Middle forms", "Each letter in the middle of a word", { kind: "forms", position: "medial" }, LETTER_SOURCES),
  lesson(11, "End forms", "Each letter at the end of a word", { kind: "forms", position: "final" }, LETTER_SOURCES),
  lesson(12, "First letters", "Which letter begins a real Quran word", { kind: "first-letter" }, LETTER_SOURCES),
  lesson(13, "Fatha", "The mark ◌َ", { kind: "mark", marks: ["fatha"] }, MARK_SOURCES),
  lesson(14, "Kasra", "The mark ◌ِ", { kind: "mark", marks: ["kasra"] }, MARK_SOURCES),
  lesson(15, "Damma", "The mark ◌ُ", { kind: "mark", marks: ["damma"] }, MARK_SOURCES),
  lesson(16, "Short vowels", "Fatha, kasra or damma on the first letter", { kind: "first-vowel" }, MARK_SOURCES),
  lesson(17, "Tanween", "Fathatan, dammatan and kasratan", { kind: "mark", marks: ["fathatan", "dammatan", "kasratan"] }, MARK_SOURCES),
  lesson(18, "Sukun", "The mark ◌ْ", { kind: "mark", marks: ["sukun"] }, MARK_SOURCES),
  lesson(19, "Shadda", "The mark ◌ّ", { kind: "mark", marks: ["shadda"] }, MARK_SOURCES),
  lesson(20, "Review: marks", "Every mark so far, mixed", { kind: "marks-review", marks: BASIC_MARKS }, MARK_SOURCES),
  lesson(21, "Maddah", "The mark ◌ٓ", { kind: "mark", marks: ["maddah"] }, MARK_SOURCES),
  lesson(22, "Superscript alef", "The mark ◌ٰ", { kind: "mark", marks: ["superscriptAlef"] }, MARK_SOURCES),
  lesson(23, "Review: all marks", "All ten marks, mixed", { kind: "marks-review", marks: [...BASIC_MARKS, "maddah", "superscriptAlef"] }, MARK_SOURCES),
  lesson(24, "Listen: short words", "Hear a word and find it — two or three letters", { kind: "listen", minLetters: 2, maxLetters: 3 }, READING_SOURCES),
  lesson(25, "Listen: medium words", "Four or five letters", { kind: "listen", minLetters: 4, maxLetters: 5 }, READING_SOURCES),
  lesson(26, "Listen: longer words", "Six letters or more", { kind: "listen", minLetters: 6, maxLetters: 99 }, READING_SOURCES),
  lesson(27, "Read along: Al-Kawthar", "Surah 108, word by word", { kind: "read-along", chapterId: 108, chapterName: "Al-Kawthar" }, READING_SOURCES),
  lesson(28, "Read along: Al-Ikhlas", "Surah 112, word by word", { kind: "read-along", chapterId: 112, chapterName: "Al-Ikhlas" }, READING_SOURCES),
  lesson(29, "Read along: An-Nas", "Surah 114, word by word", { kind: "read-along", chapterId: 114, chapterName: "An-Nas" }, READING_SOURCES),
  lesson(30, "Read along: Al-Fatihah", "Surah 1, word by word", { kind: "read-along", chapterId: 1, chapterName: "Al-Fatihah" }, READING_SOURCES),
];

export const lessonForDay = (day: number) => QAIDAH_LESSONS.find((item) => item.day === day);

export const lettersLearnedBefore = (day: number) => QAIDAH_LESSONS.filter((item) => item.day < day).flatMap((item) => item.letters);

export const ALL_LETTERS = ARABIC_LETTERS.map((letter) => letter.char);

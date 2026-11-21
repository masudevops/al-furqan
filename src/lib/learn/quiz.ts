import { letterByChar, letterForms, startsWithLetter, type LetterForm } from "./alphabet";

export type PracticeWord = { text: string; audioUrl: string | null; verseKey: string; position: number };

export type RecognitionQuestion = { kind: "recognition"; letter: string; form: LetterForm; options: string[] };
export type WordQuestion = { kind: "word"; letter: string; answer: PracticeWord; options: PracticeWord[] };

// Small seeded generator so a lesson's questions are stable for a given seed (and testable).
export const seededRandom = (seed: number) => () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};

export const shuffle = <T,>(items: readonly T[], random: () => number) => {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
};

// "Which letter is this?" — shows one contextual form; options are this lesson's letters plus earlier ones.
export const recognitionQuestions = (letters: readonly string[], distractors: readonly string[], count: number, random: () => number): RecognitionQuestion[] => {
  const pool = Array.from(new Set([...letters, ...distractors]));
  return Array.from({ length: count }, (_, index) => {
    const letter = letters[index % letters.length];
    const forms = letterForms(letterByChar(letter)!);
    const form = forms[Math.floor(random() * forms.length)];
    const others = shuffle(pool.filter((item) => item !== letter), random).slice(0, 3);
    return { kind: "recognition" as const, letter, form, options: shuffle([letter, ...others], random) };
  });
};

export const wordsStartingWith = (words: readonly PracticeWord[], letter: string) => words.filter((word) => startsWithLetter(word.text, letter));

// "Which word begins with this letter?" — only uses real Quran words from the source, never constructed ones.
export const wordQuestions = (letters: readonly string[], words: readonly PracticeWord[], random: () => number): WordQuestion[] =>
  letters.flatMap((letter) => {
    const matches = wordsStartingWith(words, letter);
    const others = words.filter((word) => !startsWithLetter(word.text, letter));
    if (!matches.length || others.length < 2) return [];
    const answer = matches[Math.floor(random() * matches.length)];
    return [{ kind: "word" as const, letter, answer, options: shuffle([answer, ...shuffle(others, random).slice(0, 2)], random) }];
  });

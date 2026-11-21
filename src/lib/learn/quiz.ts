import { ARABIC_LETTERS, baseLetters, letterByChar, letterForms, startsWithLetter, type LetterForm } from "./alphabet";
import { SHORT_VOWELS, firstLetterVowel, hasMark, letterCount, markById, type MarkId } from "./marks";

export type PracticeWord = { text: string; audioUrl: string | null; verseKey: string; position: number; transliteration?: string | null; translation?: string | null };

export type RecognitionQuestion = { kind: "recognition"; letter: string; form: LetterForm; options: string[] };
export type WordQuestion = { kind: "word"; letter: string; answer: PracticeWord; options: PracticeWord[] };
export type FirstLetterQuestion = { kind: "first-letter"; letter: string; word: PracticeWord; options: string[] };
export type MarkQuestion = { kind: "mark"; mark: MarkId; answer: PracticeWord; options: PracticeWord[] };
export type FirstVowelQuestion = { kind: "first-vowel"; vowel: MarkId; word: PracticeWord; options: MarkId[] };
export type ListenQuestion = { kind: "listen"; answer: PracticeWord; options: PracticeWord[] };
export type Question = RecognitionQuestion | WordQuestion | FirstLetterQuestion | MarkQuestion | FirstVowelQuestion | ListenQuestion;

export const wordKey = (word: PracticeWord) => `${word.verseKey}-${word.position}`;
const pick = <T,>(items: readonly T[], random: () => number) => items[Math.floor(random() * items.length)];

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
export const recognitionQuestions = (letters: readonly string[], distractors: readonly string[], count: number, random: () => number, position?: LetterForm["position"]): RecognitionQuestion[] => {
  const pool = Array.from(new Set([...letters, ...distractors]));
  return Array.from({ length: count }, (_, index) => {
    const letter = letters[index % letters.length];
    const forms = letterForms(letterByChar(letter)!).filter((form) => !position || form.position === position);
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

// Letters that have a given contextual form (right-joining letters have no start or middle form).
export const lettersWithForm = (position: LetterForm["position"]) =>
  ARABIC_LETTERS.filter((letter) => letterForms(letter).some((form) => form.position === position)).map((letter) => letter.char);

// "Which letter does this word begin with?" — only words whose first letter is one of the 28.
export const firstLetterQuestions = (words: readonly PracticeWord[], count: number, random: () => number): FirstLetterQuestion[] => {
  const alphabet = ARABIC_LETTERS.map((letter) => letter.char);
  const usable = shuffle(words.filter((word) => alphabet.includes(baseLetters(word.text)[0])), random).slice(0, count);
  return usable.map((word) => {
    const letter = baseLetters(word.text)[0];
    return { kind: "first-letter" as const, letter, word, options: shuffle([letter, ...shuffle(alphabet.filter((item) => item !== letter), random).slice(0, 3)], random) };
  });
};

// "Which word contains this mark?" — cycles through the given marks; distractors contain none of the group.
export const markQuestions = (marks: readonly MarkId[], words: readonly PracticeWord[], count: number, random: () => number): MarkQuestion[] => {
  const questions: MarkQuestion[] = [];
  for (let index = 0; index < count * 3 && questions.length < count; index++) {
    const mark = marks[index % marks.length];
    const matches = words.filter((word) => hasMark(word.text, markById(mark)));
    const others = words.filter((word) => !hasMark(word.text, markById(mark)));
    if (!matches.length || others.length < 2) continue;
    const answer = pick(matches, random);
    questions.push({ kind: "mark", mark, answer, options: shuffle([answer, ...shuffle(others, random).slice(0, 2)], random) });
  }
  return questions;
};

// "Which short vowel is on the first letter?" — only words with exactly one short vowel on the first letter.
export const firstVowelQuestions = (words: readonly PracticeWord[], count: number, random: () => number): FirstVowelQuestion[] => {
  const byVowel = SHORT_VOWELS.map((vowel) => words.filter((word) => firstLetterVowel(word.text) === vowel));
  return Array.from({ length: count }, (_, index) => {
    const vowel = SHORT_VOWELS[index % SHORT_VOWELS.length];
    const pool = byVowel[index % SHORT_VOWELS.length];
    return pool.length ? { kind: "first-vowel" as const, vowel, word: pick(pool, random), options: [...SHORT_VOWELS] } : null;
  }).filter((item): item is FirstVowelQuestion => Boolean(item));
};

export const wordsByLength = (words: readonly PracticeWord[], min: number, max: number) =>
  words.filter((word) => word.audioUrl && letterCount(word.text) >= min && letterCount(word.text) <= max);

// "Listen and choose the word you hear" — options come from the same pool, never constructed.
export const listenQuestions = (words: readonly PracticeWord[], count: number, random: () => number): ListenQuestion[] => {
  const unique = words.filter((word, index) => word.audioUrl && words.findIndex((other) => other.text === word.text) === index);
  if (unique.length < 3) return [];
  return shuffle(unique, random).slice(0, count).map((answer) => ({
    kind: "listen" as const,
    answer,
    options: shuffle([answer, ...shuffle(unique.filter((word) => word.text !== answer.text), random).slice(0, 2)], random),
  }));
};

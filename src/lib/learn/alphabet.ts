import { ARABIC_LETTERS, type ArabicLetter } from "./alphabet-data";

export { ARABIC_LETTERS, type ArabicLetter };

const TATWEEL = "\u0640";

export type LetterForm = { position: "isolated" | "initial" | "medial" | "final"; text: string };

// Contextual forms are shown the way printed primers do, joined to a tatweel (ـ) stroke, which every Arabic font
// shapes correctly. Right-joining letters (e.g. ا د ر و) never connect forward, so they have two forms.
export const letterForms = (letter: ArabicLetter): LetterForm[] => letter.joining === "dual"
  ? [{ position: "isolated", text: letter.char }, { position: "initial", text: letter.char + TATWEEL }, { position: "medial", text: TATWEEL + letter.char + TATWEEL }, { position: "final", text: TATWEEL + letter.char }]
  : [{ position: "isolated", text: letter.char }, { position: "final", text: TATWEEL + letter.char }];

export const letterByChar = (char: string) => ARABIC_LETTERS.find((letter) => letter.char === char);

// Vowel marks, Quranic annotation signs and tatweel are removed; alef variants (incl. hamzat al-wasl) count as alef.
const MARKS = /[ؐ-ًؚ-ٰٟۖ-ۭـ]/g;
const ALEF_VARIANTS = /[آأإٱٲٳ]/g;

export const baseLetters = (word: string) => word.normalize("NFC").replace(MARKS, "").replace(ALEF_VARIANTS, "ا");

export const startsWithLetter = (word: string, letter: string) => baseLetters(word).startsWith(letter);

import { ARABIC_MARKS, type ArabicMark, type MarkId } from "./marks-data";
import { baseLetters } from "./alphabet";

export { ARABIC_MARKS, type ArabicMark, type MarkId };

export const markById = (id: MarkId) => ARABIC_MARKS.find((mark) => mark.id === id)!;

// A mark shown on its own sits on a dotted circle (U+25CC), the Unicode convention for a combining mark.
export const markDisplay = (mark: ArabicMark) => `◌${mark.char}`;

export const hasMark = (word: string, mark: ArabicMark) => word.normalize("NFC").includes(mark.char);

// Arabic combining marks (harakat and Quranic annotation signs), matched without the ES2018 \p{} syntax.
const COMBINING = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08FF]/;

export const SHORT_VOWELS: readonly MarkId[] = ["fatha", "kasra", "damma"];

// The single short vowel written on a word's first letter, or null when there is none or more than one
// (e.g. shadda with a vowel is fine; two vowels or none are skipped so the question stays unambiguous).
export const firstLetterVowel = (word: string): MarkId | null => {
  const chars = Array.from(word.normalize("NFC"));
  const marks: string[] = [];
  for (let index = 1; index < chars.length && COMBINING.test(chars[index]); index++) marks.push(chars[index]);
  const vowels = SHORT_VOWELS.filter((id) => marks.includes(markById(id).char));
  return vowels.length === 1 ? vowels[0] : null;
};

export const letterCount = (word: string) => baseLetters(word).length;

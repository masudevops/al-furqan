import { describe, expect, it } from "vitest";

import { ARABIC_LETTERS, baseLetters, letterByChar, letterForms, startsWithLetter } from "./alphabet";
import { QAIDAH_LESSONS, lessonForDay, lettersLearnedBefore } from "./curriculum";
import { completeDay, emptyProgress, nextDay, parseProgress, recordAnswer, reviewPriority } from "./progress";
import { firstLetterQuestions, firstVowelQuestions, lettersWithForm, listenQuestions, markQuestions, recognitionQuestions, seededRandom, wordQuestions, wordsByLength, wordsStartingWith, type PracticeWord } from "./quiz";
import { firstLetterVowel, hasMark, markById } from "./marks";
import { READ_ALONG_CHAPTERS } from "../data";

describe("Arabic alphabet data", () => {
  it("has the 28 letters with Unicode code points matching their characters", () => {
    expect(ARABIC_LETTERS).toHaveLength(28);
    for (const letter of ARABIC_LETTERS) expect(letter.codePoint).toBe(`U+${letter.char.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}`);
  });

  it("gives dual-joining letters four forms and right-joining letters two", () => {
    expect(letterForms(letterByChar("ب")!).map((form) => form.position)).toEqual(["isolated", "initial", "medial", "final"]);
    expect(letterForms(letterByChar("د")!).map((form) => form.position)).toEqual(["isolated", "final"]);
  });

  it("matches a word's first letter ignoring vowel marks and alef variants", () => {
    expect(baseLetters("بِسْمِ")).toBe("بسم");
    expect(startsWithLetter("ٱلْحَمْدُ", "ا")).toBe(true);
    expect(startsWithLetter("قُلْ", "ق")).toBe(true);
    expect(startsWithLetter("قُلْ", "ك")).toBe(false);
  });
});

describe("Qaidah curriculum", () => {
  it("has 30 consecutive days and covers all 28 letters once across days 1–7, all still drafts awaiting review", () => {
    expect(QAIDAH_LESSONS.map((lesson) => lesson.day)).toEqual(Array.from({ length: 30 }, (_, index) => index + 1));
    expect(QAIDAH_LESSONS.flatMap((lesson) => lesson.letters).join("")).toBe(ARABIC_LETTERS.map((letter) => letter.char).join(""));
    expect(QAIDAH_LESSONS.every((lesson) => lesson.status === "draft" && lesson.review.reviewer === null)).toBe(true);
    expect(lessonForDay(2)?.letters).toEqual(["ج", "ح", "خ", "د"]);
    expect(lettersLearnedBefore(2)).toEqual(["ا", "ب", "ت", "ث"]);
  });
});

describe("Learn progress storage", () => {
  it("starts fresh on missing, corrupt, or other-version data", () => {
    expect(parseProgress(null)).toEqual(emptyProgress());
    expect(parseProgress("{nope")).toEqual(emptyProgress());
    expect(parseProgress(JSON.stringify({ version: 99, completedDays: [1], letters: {} }))).toEqual(emptyProgress());
  });

  it("records answers, completes days, and finds the next lesson", () => {
    let progress = recordAnswer(emptyProgress(), "ب", false, 1);
    progress = recordAnswer(progress, "ب", true, 2);
    expect(progress.letters["ب"]).toEqual({ correct: 1, wrong: 1, lastSeen: 2 });
    progress = completeDay(completeDay(progress, 1), 1);
    expect(progress.completedDays).toEqual([1]);
    expect(nextDay(progress, 7)).toBe(2);
    expect(parseProgress(JSON.stringify(progress))).toEqual(progress);
  });

  it("reviews letters with more mistakes first", () => {
    let progress = emptyProgress();
    const now = Date.now();
    for (let i = 0; i < 3; i++) progress = recordAnswer(progress, "ث", false, now);
    progress = recordAnswer(progress, "ب", true, now);
    expect(reviewPriority(progress, ["ب", "ث"], 1, now)).toEqual(["ث"]);
  });
});

describe("Lesson quizzes", () => {
  const words: PracticeWord[] = [
    { text: "بِسْمِ", audioUrl: null, verseKey: "1:1", position: 1 },
    { text: "ٱلرَّحْمَـٰنِ", audioUrl: null, verseKey: "1:1", position: 3 },
    { text: "تَبَّتْ", audioUrl: null, verseKey: "111:1", position: 1 },
    { text: "قُلْ", audioUrl: null, verseKey: "112:1", position: 1 },
  ];

  it("asks about every lesson letter with four distinct options including the answer", () => {
    const questions = recognitionQuestions(["ا", "ب", "ت", "ث"], [], 8, seededRandom(1));
    expect(questions).toHaveLength(8);
    for (const question of questions) {
      expect(new Set(question.options).size).toBe(4);
      expect(question.options).toContain(question.letter);
    }
  });

  it("only builds word questions from real source words that begin with the letter", () => {
    expect(wordsStartingWith(words, "ب").map((word) => word.verseKey)).toEqual(["1:1"]);
    const questions = wordQuestions(["ب", "ث"], words, seededRandom(2));
    expect(questions).toHaveLength(1);
    expect(startsWith(questions[0].answer.text, "ب")).toBe(true);
    expect(questions[0].options.filter((option) => startsWith(option.text, "ب"))).toHaveLength(1);
  });
});

const startsWith = (text: string, letter: string) => startsWithLetter(text, letter);

describe("Letter recordings", () => {
  it("ships a recording for every letter, with the source license alongside", async () => {
    const { existsSync } = await import("node:fs");
    const { letterAudioUrl } = await import("./letter-audio");
    for (const letter of ARABIC_LETTERS) expect(existsSync(`public${letterAudioUrl(letter)}`), letter.unicodeName).toBe(true);
    expect(existsSync("public/learn/letters/LICENSE.txt")).toBe(true);
    expect(letterAudioUrl(letterByChar("ب")!)).toBe("/learn/letters/0628.mp3");
  });
});

describe("Marks and later-day quizzes", () => {
  const word = (text: string, verseKey: string, position = 1): PracticeWord => ({ text, audioUrl: `https://verses.quran.foundation/wbw/${verseKey}.mp3`, verseKey, position });
  const words = [word("بِسْمِ", "1:1"), word("قُلْ", "112:1"), word("هُوَ", "112:1", 2), word("ٱللَّهُ", "112:1", 3), word("أَحَدٌ", "112:1", 4), word("رَبِّ", "1:2", 3), word("كُفُوًا", "112:4", 3)];

  it("finds the single short vowel on a word's first letter", () => {
    expect(firstLetterVowel("بِسْمِ")).toBe("kasra");
    expect(firstLetterVowel("قُلْ")).toBe("damma");
    expect(firstLetterVowel("رَبِّ")).toBe("fatha");
    expect(firstLetterVowel("ٱللَّهُ")).toBeNull();
  });

  it("asks about marks only with words that truly contain or lack them", () => {
    const questions = markQuestions(["shadda", "fathatan", "dammatan"], words, 6, seededRandom(4));
    expect(questions.length).toBeGreaterThan(0);
    for (const question of questions) {
      const mark = markById(question.mark);
      expect(hasMark(question.answer.text, mark)).toBe(true);
      expect(question.options.filter((option) => hasMark(option.text, mark))).toHaveLength(1);
    }
  });

  it("builds first-letter, first-vowel and listen questions from real words", () => {
    for (const question of firstLetterQuestions(words, 5, seededRandom(5))) {
      expect(question.options).toContain(question.letter);
      expect(new Set(question.options).size).toBe(4);
    }
    for (const question of firstVowelQuestions(words, 6, seededRandom(6))) expect(firstLetterVowel(question.word.text)).toBe(question.vowel);
    for (const question of listenQuestions(words, 5, seededRandom(7))) expect(question.options.map((option) => option.text)).toContain(question.answer.text);
    expect(wordsByLength(words, 2, 3).every((item) => item.text !== "ٱللَّهُ")).toBe(true);
  });

  it("only asks start and middle forms of letters that have them", () => {
    expect(lettersWithForm("initial")).not.toContain("ا");
    expect(lettersWithForm("initial")).toHaveLength(22);
    expect(lettersWithForm("final")).toHaveLength(28);
  });

  it("reads along only Surahs whose words are loaded in order", () => {
    for (const lesson of QAIDAH_LESSONS) if (lesson.focus.kind === "read-along") expect(READ_ALONG_CHAPTERS as readonly number[]).toContain(lesson.focus.chapterId);
  });
});

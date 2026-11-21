"use client";

import Link from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import ContentState from "@/components/content-state";
import { Button, ButtonLink, Icon, Page, PageHeader } from "@/components/ui";
import { ARABIC_LETTERS, letterByChar, letterForms, type LetterForm } from "@/lib/learn/alphabet";
import { ALL_LETTERS, QAIDAH_LESSONS, lessonForDay, lettersLearnedBefore, type QaidahLesson } from "@/lib/learn/curriculum";
import { LETTER_AUDIO_SOURCE, letterAudioUrl } from "@/lib/learn/letter-audio";
import { SHORT_VOWELS, firstLetterVowel, hasMark, markById, markDisplay, type MarkId } from "@/lib/learn/marks";
import { completeDay, emptyProgress, readProgress, recordAnswer, reviewPriority, writeProgress, type LearnProgress } from "@/lib/learn/progress";
import { firstLetterQuestions, firstVowelQuestions, lettersWithForm, listenQuestions, markQuestions, recognitionQuestions, seededRandom, shuffle, wordKey, wordQuestions, wordsByLength, wordsStartingWith, type PracticeWord, type Question } from "@/lib/learn/quiz";
import type { PracticeWordPayload } from "@/lib/types";
import { DraftNotice } from "./learn-home";
import { useWordAudio } from "./use-word-audio";
import styles from "./learn.module.css";

type Audio = ReturnType<typeof useWordAudio>;
const POSITION_LABEL = { isolated: "On its own", initial: "Start", medial: "Middle", final: "End" } as const;
const fetcher = async (url: string) => { const response = await fetch(url); const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; };

function PlayWord({ word, audio, label }: { word: PracticeWord; audio: Audio; label?: string }) {
  if (!word.audioUrl) return null;
  const active = audio.playing === word.audioUrl;
  return <button type="button" className={styles.play} aria-label={label ?? `Play recitation of the word from ${word.verseKey}`} aria-pressed={active} onClick={() => audio.play(word.audioUrl)}><Icon name={active ? "pause" : "play"} /></button>;
}

function PlayLetter({ char, audio }: { char: string; audio: Audio }) {
  const letter = letterByChar(char)!;
  const url = letterAudioUrl(letter);
  return <button type="button" className={styles.letterPlay} aria-pressed={audio.playing === url} aria-label={`Play recording of ${letter.unicodeName} (speaker unidentified, awaiting review)`} title="Recording · speaker unidentified · awaiting review" onClick={() => audio.play(url)}><Icon name={audio.playing === url ? "pause" : "play"} /></button>;
}

// A real Quran word with its recitation, Quran.Foundation transliteration, and a link to its Ayah.
function WordRow({ word, audio }: { word: PracticeWord; audio: Audio }) {
  return <span className={styles.example}>
    <PlayWord word={word} audio={audio} />
    <span className={styles.wordMeta}>{word.transliteration ? <i>{word.transliteration}</i> : null}</span>
    <b lang="ar" dir="rtl" translate="no">{word.text}</b>
    <Link href={`/quran/${word.verseKey.replace(":", "/")}`}>{word.verseKey}</Link>
  </span>;
}

function MarkGlyph({ id, className }: { id: MarkId; className?: string }) {
  return <span className={className ?? styles.markGlyph} lang="ar" translate="no">{markDisplay(markById(id))}</span>;
}

// ---- Learn panels -------------------------------------------------------------------------------------------

function LettersLearn({ letters, words, wordError, audio }: { letters: string[]; words?: PracticeWord[]; wordError: boolean; audio: Audio }) {
  return <div className={styles.letterGrid}>{letters.map((char) => {
    const letter = letterByChar(char)!;
    const examples = words ? wordsStartingWith(words, char).slice(0, 3) : [];
    return <article className={styles.letterCard} key={char}>
      <div className={styles.letterHero}><PlayLetter char={char} audio={audio} /><span className={styles.bigLetter} lang="ar" translate="no">{char}</span><span className={styles.unicode}>{letter.unicodeName}<small>{letter.codePoint}</small></span></div>
      <p className={styles.recordingNote}>Recording: {LETTER_AUDIO_SOURCE.name} ({LETTER_AUDIO_SOURCE.license}) · speaker {LETTER_AUDIO_SOURCE.speaker} · awaiting review</p>
      <div className={styles.forms}>{letterForms(letter).map((form) => <span key={form.position}><b lang="ar" translate="no">{form.text}</b><small>{POSITION_LABEL[form.position]}</small></span>)}</div>
      <div className={styles.examples}>
        <p>In the Quran</p>
        {wordError ? <span className={styles.muted}>Examples are unavailable right now.</span> : !words ? <span className={styles.muted}>Loading examples…</span> : examples.map((word) => <WordRow key={wordKey(word)} word={word} audio={audio} />)}
      </div>
      <p className={styles.pending}><Icon name="info" />Teaching notes awaiting review.</p>
    </article>;
  })}</div>;
}

function AlphabetLearn({ position, audio }: { position?: Exclude<LetterForm["position"], "isolated">; audio: Audio }) {
  const letters = position ? lettersWithForm(position) : ALL_LETTERS;
  return <>
    {position ? <p className={styles.stepNote}>{position === "final" ? "Every letter has an end form." : <>Six letters (<bdi lang="ar" dir="rtl" translate="no">ا د ذ ر ز و</bdi>) never join to the letter after them, so they have no start or middle form.</>}</p> : null}
    <div className={styles.alphabetGrid}>{letters.map((char) => {
      const letter = letterByChar(char)!;
      const form = position ? letterForms(letter).find((item) => item.position === position)! : null;
      return <div className={styles.alphabetCell} key={char}>
        <PlayLetter char={char} audio={audio} />
        <b lang="ar" translate="no">{form ? form.text : char}</b>
        <small>{form ? <><span lang="ar" translate="no">{char}</span> · </> : null}{letter.unicodeName}</small>
      </div>;
    })}</div>
  </>;
}

function ExamplesLearn({ groups, audio }: { groups: Array<{ key: string; heading: ReactNode; caption?: string; words: PracticeWord[] }>; audio: Audio }) {
  return <div className={styles.letterGrid}>{groups.map((group) => <article className={styles.letterCard} key={group.key}>
    <div className={styles.markHead}>{group.heading}{group.caption ? <span className={styles.unicode}>{group.caption}</span> : null}</div>
    <div className={styles.examples}><p>In the Quran</p>{group.words.length ? group.words.map((word) => <WordRow key={wordKey(word)} word={word} audio={audio} />) : <span className={styles.muted}>No examples were returned.</span>}</div>
    <p className={styles.pending}><Icon name="info" />Teaching notes awaiting review.</p>
  </article>)}</div>;
}

function ReadAlong({ words, audio }: { words: PracticeWord[]; audio: Audio }) {
  const verses = useMemo(() => {
    const map = new Map<string, PracticeWord[]>();
    for (const word of words) map.set(word.verseKey, [...(map.get(word.verseKey) ?? []), word]);
    return Array.from(map.entries());
  }, [words]);
  if (!words.length) return <ContentState kind="empty" message="The words for this Surah were not returned." />;
  return <div className={styles.readAlong}>{verses.map(([verseKey, verseWords]) => <section key={verseKey} className={styles.readVerse} aria-label={`Ayah ${verseKey}`}>
    <header><Link href={`/quran/${verseKey.replace(":", "/")}`}>{verseKey}</Link></header>
    <div className={styles.readWords} dir="rtl">{verseWords.map((word) => <button type="button" key={wordKey(word)} className={styles.readWord} aria-pressed={audio.playing === word.audioUrl} aria-label={`Play ${word.transliteration ?? "word"}`} onClick={() => audio.play(word.audioUrl)}>
      <b lang="ar" translate="no">{word.text}</b>
      <i dir="ltr">{word.transliteration}</i>
      <small dir="ltr">{word.translation}</small>
    </button>)}</div>
  </section>)}<p className={styles.stepNote}>Word-by-word transliteration and translation: Quran.Foundation. Tap a word to hear it recited.</p></div>;
}

// ---- Quiz -----------------------------------------------------------------------------------------------------

type Answer = { chosen: string; correct: boolean };

function answerOf(question: Question) {
  switch (question.kind) {
    case "recognition": case "first-letter": return question.letter;
    case "word": case "mark": case "listen": return wordKey(question.answer);
    case "first-vowel": return question.vowel;
  }
}

const statKey = (question: Question) => question.kind === "mark" ? `mark:${question.mark}` : question.kind === "first-vowel" ? `mark:${question.vowel}` : question.kind === "listen" ? `word:${question.answer.text}` : question.letter;

function optionClass(question: Question, given: Answer | undefined, value: string) {
  if (!given) return undefined;
  if (value === answerOf(question)) return styles.optionRight;
  return value === given.chosen ? styles.optionWrong : undefined;
}

function QuestionView({ question, given, choose, audio, reviewLetters }: { question: Question; given?: Answer; choose: (value: string) => void; audio: Audio; reviewLetters: readonly string[] }) {
  const letterOptions = (options: string[]) => <div className={styles.options}>{options.map((option) => <button type="button" key={option} className={optionClass(question, given, option)} disabled={Boolean(given)} onClick={() => choose(option)}><b lang="ar" translate="no">{option}</b><small>{letterByChar(option)?.unicodeName}</small></button>)}</div>;
  const wordOptions = (options: PracticeWord[], playable = true) => <div className={styles.wordOptions}>{options.map((option) => {
    const key = wordKey(option);
    return <div key={key} className={optionClass(question, given, key)}>
      <button type="button" className={styles.wordChoice} disabled={Boolean(given)} onClick={() => choose(key)}><b lang="ar" dir="rtl" translate="no">{option.text}</b>{given ? <small>{option.transliteration ? `${option.transliteration} · ` : ""}{option.verseKey}</small> : null}</button>
      {playable ? <PlayWord word={option} audio={audio} /> : null}
    </div>;
  })}</div>;
  switch (question.kind) {
    case "recognition": return <><div className={styles.prompt}><span lang="ar" translate="no">{question.form.text}</span><small>{POSITION_LABEL[question.form.position]}{reviewLetters.includes(question.letter) ? " · Review" : ""}</small></div>{letterOptions(question.options)}</>;
    case "word": return <><div className={styles.prompt}><span lang="ar" translate="no">{question.letter}</span><small>Which word begins with this letter?</small></div>{wordOptions(question.options)}</>;
    case "first-letter": return <><div className={styles.prompt}><span className={styles.promptWord} lang="ar" dir="rtl" translate="no">{question.word.text}</span><small>Which letter does this word begin with?</small><PlayWord word={question.word} audio={audio} /></div>{letterOptions(question.options)}</>;
    case "mark": return <><div className={styles.prompt}><MarkGlyph id={question.mark} className={styles.promptMark} /><small>Which word contains {markById(question.mark).unicodeName}?</small></div>{wordOptions(question.options)}</>;
    case "first-vowel": return <><div className={styles.prompt}><span className={styles.promptWord} lang="ar" dir="rtl" translate="no">{question.word.text}</span><small>Which mark is on the first letter?</small><PlayWord word={question.word} audio={audio} /></div>
      <div className={styles.options}>{question.options.map((option) => <button type="button" key={option} className={optionClass(question, given, option)} disabled={Boolean(given)} onClick={() => choose(option)}><MarkGlyph id={option} className={styles.optionMark} /><small>{markById(option).unicodeName}</small></button>)}</div></>;
    case "listen": return <><div className={styles.prompt}><button type="button" className={styles.bigPlay} aria-pressed={audio.playing === question.answer.audioUrl} aria-label="Play the word" onClick={() => audio.play(question.answer.audioUrl)}><Icon name={audio.playing === question.answer.audioUrl ? "pause" : "play"} /></button><small>Play the word, then choose what you heard</small></div>{wordOptions(question.options, false)}</>;
  }
}

function Quiz({ questions, onAnswer, onDone, doneLabel, audio, reviewLetters = [] }: { questions: Question[]; onAnswer: (question: Question, correct: boolean) => void; onDone: (score: number) => void; doneLabel: string; audio: Audio; reviewLetters?: readonly string[] }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const question = questions[index];
  const given = answers[index];
  const score = Object.values(answers).filter((item) => item.correct).length;
  if (!question) return <ContentState kind="empty" message="Not enough practice material was returned for this lesson." />;
  const choose = (value: string) => {
    if (given) return;
    const correct = value === answerOf(question);
    setAnswers((current) => ({ ...current, [index]: { chosen: value, correct } }));
    onAnswer(question, correct);
  };
  return <div className={styles.quiz}>
    <div className={styles.quizHead}><span>Question {index + 1} of {questions.length}</span><span>{score} correct</span></div>
    <div className={styles.quizBar}><span style={{ width: `${((index + (given ? 1 : 0)) / questions.length) * 100}%` }} /></div>
    <QuestionView question={question} given={given} choose={choose} audio={audio} reviewLetters={reviewLetters} />
    {given ? <div className={styles.feedback} role="status">
      <p className={given.correct ? styles.right : styles.wrong}><Icon name={given.correct ? "check" : "close"} />{given.correct ? "Correct" : "Not quite — the correct answer is highlighted"}</p>
      {index + 1 < questions.length ? <Button variant="primary" trailingIcon="arrowRight" onClick={() => setIndex(index + 1)}>Next</Button> : <Button variant="primary" onClick={() => onDone(score)}>{doneLabel}</Button>}
    </div> : null}
  </div>;
}

// ---- Lesson ---------------------------------------------------------------------------------------------------

function buildPractice(lesson: QaidahLesson, data: PracticeWordPayload | undefined, seed: number, progress: LearnProgress): Question[] {
  const random = seededRandom(seed);
  const words = data?.words ?? [];
  const focus = lesson.focus;
  switch (focus.kind) {
    case "letters": return [];
    case "review": return [...recognitionQuestions(reviewPriority(progress, ALL_LETTERS, 8), ALL_LETTERS, 8, random), ...recognitionQuestions(shuffle(ALL_LETTERS, random).slice(0, 4), ALL_LETTERS, 4, random)];
    case "forms": { const letters = shuffle(lettersWithForm(focus.position), random).slice(0, 10); return recognitionQuestions(letters, lettersWithForm(focus.position), 10, random, focus.position); }
    case "first-letter": return firstLetterQuestions(words, 10, random);
    case "mark": return markQuestions(focus.marks, words, 8, random);
    case "first-vowel": return firstVowelQuestions(words, 9, random);
    case "marks-review": return markQuestions(shuffle(focus.marks, random), words, 10, random);
    case "listen": return listenQuestions(wordsByLength(words, focus.minLetters, focus.maxLetters), 8, random);
    case "read-along": return listenQuestions(data?.sequences[focus.chapterId] ?? [], 8, random);
  }
}

function learnTitle(lesson: QaidahLesson) {
  switch (lesson.focus.kind) {
    case "letters": return "Meet today's letters";
    case "review": return "All 28 letters";
    case "forms": return `${POSITION_LABEL[lesson.focus.position]} forms`;
    case "first-letter": return "First letters in real words";
    case "mark": case "marks-review": return lesson.focus.marks.length > 1 ? "Today's marks" : "Today's mark";
    case "first-vowel": return "Fatha, kasra and damma";
    case "listen": return "Listen first";
    case "read-along": return `${lesson.focus.chapterName}, word by word`;
  }
}

export default function QaidahLesson({ day }: { day: number }) {
  const lesson = lessonForDay(day)!;
  const focus = lesson.focus;
  const isLetters = focus.kind === "letters";
  const steps = isLetters ? ["Learn", "Recognise", "In the Quran", "Finish"] : ["Learn", "Practice", "Finish"];
  const [step, setStep] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [progress, setProgress] = useState<LearnProgress>(emptyProgress);
  const [scores, setScores] = useState<number[]>([]);
  const audio = useWordAudio();
  const { data, error } = useSWR<PracticeWordPayload>("/api/learn/words", fetcher, { revalidateOnFocus: false });
  useEffect(() => setProgress(readProgress()), []);
  useEffect(() => { setStep(0); setScores([]); }, [day]);

  const earlier = useMemo(() => lettersLearnedBefore(day), [day]);
  const recognition = useMemo(() => {
    if (!isLetters) return [];
    const random = seededRandom(day * 97 + attempt);
    const review = reviewPriority(readProgress(), earlier, 4);
    return [...recognitionQuestions(lesson.letters, earlier, 8, random), ...recognitionQuestions(review, lesson.letters, review.length, random)];
  }, [attempt, day, earlier, isLetters, lesson.letters]);
  const letterWords = useMemo(() => data && isLetters ? wordQuestions(lesson.letters, data.words, seededRandom(day * 31 + attempt)) : [], [attempt, data, day, isLetters, lesson.letters]);
  // Built once per attempt (progress is read at that moment) so answering does not reshuffle the questions.
  const practice = useMemo(() => buildPractice(lesson, data, day * 53 + attempt, readProgress()), [attempt, data, day, lesson]);

  const save = (next: LearnProgress) => setProgress(writeProgress(next));
  const record = (question: Question, correct: boolean) => save(recordAnswer(readProgress(), statKey(question), correct));
  const goTo = (next: number) => { setStep(next); window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); };
  const finishStep = steps.length - 1;
  const complete = progress.completedDays.includes(day);
  const nextLesson = QAIDAH_LESSONS.find((item) => item.day === day + 1);
  const words = data?.words ?? [];
  const needsWords = !["letters", "review", "forms"].includes(focus.kind);
  const usesLetterAudio = ["letters", "review", "forms"].includes(focus.kind);

  const learnPanel = (() => {
    if (needsWords && error) return <ContentState kind="error" message="Practice words from the Quran are unavailable right now." />;
    if (needsWords && !data) return <ContentState message="Loading words from the Quran…" />;
    switch (focus.kind) {
      case "letters": return <LettersLearn letters={lesson.letters} words={data?.words} wordError={Boolean(error)} audio={audio} />;
      case "review": return <AlphabetLearn audio={audio} />;
      case "forms": return <AlphabetLearn position={focus.position} audio={audio} />;
      case "first-letter": return <ExamplesLearn audio={audio} groups={shuffle(ARABIC_LETTERS, seededRandom(day)).slice(0, 6).map((letter) => ({ key: letter.char, heading: <span className={styles.bigLetter} lang="ar" translate="no">{letter.char}</span>, caption: letter.unicodeName, words: wordsStartingWith(words, letter.char).slice(0, 2) }))} />;
      case "mark": case "marks-review": return <ExamplesLearn audio={audio} groups={focus.marks.map((id) => ({ key: id, heading: <MarkGlyph id={id} />, caption: `${markById(id).unicodeName} · ${markById(id).codePoint}`, words: words.filter((word) => hasMark(word.text, markById(id))).slice(0, focus.marks.length === 1 ? 6 : 3) }))} />;
      case "first-vowel": return <ExamplesLearn audio={audio} groups={SHORT_VOWELS.map((id) => ({ key: id, heading: <MarkGlyph id={id} />, caption: `${markById(id).unicodeName} on the first letter`, words: words.filter((word) => firstLetterVowel(word.text) === id).slice(0, 3) }))} />;
      case "listen": return <div className={styles.listenList}>{wordsByLength(words, focus.minLetters, focus.maxLetters).slice(0, 8).map((word) => <WordRow key={wordKey(word)} word={word} audio={audio} />)}</div>;
      case "read-along": return <ReadAlong words={data?.sequences[focus.chapterId] ?? []} audio={audio} />;
    }
  })();

  return <Page narrow>
    <PageHeader back={{ href: "/learn", label: "Noorani Qaidah" }} kicker={`Day ${day} of 30`} kickerIcon="learn" title={isLetters ? <>Letters <span className={styles.titleLetters} lang="ar" dir="rtl" translate="no">{lesson.letters.join(" ")}</span></> : lesson.title} description={isLetters ? undefined : lesson.subtitle} />
    <DraftNotice />
    <ol className={styles.steps} style={{ gridTemplateColumns: `repeat(${steps.length}, 1fr)` }} aria-label="Lesson steps">{steps.map((label, index) => <li key={label}><button type="button" aria-current={index === step ? "step" : undefined} className={index < step ? styles.stepDone : undefined} onClick={() => goTo(index)}><span>{index < step ? <Icon name="check" /> : index + 1}</span>{label}</button></li>)}</ol>

    {step === 0 ? <section aria-labelledby="learn-title">
      <h2 id="learn-title" className={styles.stepTitle}>{learnTitle(lesson)}</h2>
      {isLetters ? <p className={styles.stepIntro}>Each letter changes shape depending on where it sits in a word. Listen to how it sounds inside real words from the Quran.</p> : null}
      {learnPanel}
      {audio.failed ? <p className={styles.wrongText} role="alert">That recording could not be played right now.</p> : null}
      <div className={styles.stepActions}><Button variant="primary" trailingIcon="arrowRight" onClick={() => goTo(1)}>{isLetters ? "Practise recognising them" : "Start practice"}</Button></div>
    </section> : null}

    {isLetters && step === 1 ? <section aria-labelledby="recognise-title">
      <h2 id="recognise-title" className={styles.stepTitle}>Which letter is this?</h2>
      <p className={styles.stepIntro}>Letters are shown in different positions.{earlier.length ? " A few earlier letters come back for review." : ""}</p>
      <Quiz key={`r-${attempt}`} questions={recognition} audio={audio} reviewLetters={earlier} doneLabel="Continue" onAnswer={record} onDone={(score) => { setScores([score]); goTo(2); }} />
    </section> : null}

    {isLetters && step === 2 ? <section aria-labelledby="quran-title">
      <h2 id="quran-title" className={styles.stepTitle}>Find it in the Quran</h2>
      <p className={styles.stepIntro}>Choose the word that begins with the letter. Tap play to hear each word as it is recited.</p>
      {error ? <ContentState kind="error" message="Practice words from the Quran are unavailable right now." /> : !data ? <ContentState message="Loading words from the Quran…" /> : <Quiz key={`w-${attempt}`} questions={letterWords} audio={audio} doneLabel="Finish lesson" onAnswer={record} onDone={(score) => { setScores((current) => [...current, score]); goTo(3); }} />}
    </section> : null}

    {!isLetters && step === 1 ? <section aria-labelledby="practice-title">
      <h2 id="practice-title" className={styles.stepTitle}>Practice</h2>
      {needsWords && error ? <ContentState kind="error" message="Practice words from the Quran are unavailable right now." /> : needsWords && !data ? <ContentState message="Loading words from the Quran…" /> : <Quiz key={`p-${attempt}`} questions={practice} audio={audio} doneLabel="Finish lesson" onAnswer={record} onDone={(score) => { setScores([score]); goTo(2); }} />}
    </section> : null}

    {step === finishStep ? <section aria-labelledby="finish-title" className={styles.finish}>
      <span className={styles.finishIcon} aria-hidden="true"><Icon name="check" /></span>
      <h2 id="finish-title" className={styles.stepTitle}>Day {day} {complete ? "completed" : "done"}</h2>
      <p className={styles.stepIntro}>{isLetters ? [scores[0] != null ? `Letters: ${scores[0]} of ${recognition.length}.` : "", scores[1] != null ? `Quran words: ${scores[1]} of ${letterWords.length}.` : ""].join(" ") : scores[0] != null ? `Practice: ${scores[0]} of ${practice.length}.` : ""}</p>
      <div className={styles.stepActions}>
        {complete ? null : <Button variant="primary" icon="check" onClick={() => save(completeDay(readProgress(), day))}>Mark day {day} complete</Button>}
        <Button icon="back" onClick={() => { setAttempt((value) => value + 1); setScores([]); goTo(1); }}>Practise again</Button>
        {nextLesson ? <ButtonLink href={`/learn/qaidah/${nextLesson.day}`} trailingIcon="arrowRight">Day {nextLesson.day}</ButtonLink> : <ButtonLink href="/learn">Back to course</ButtonLink>}
      </div>
    </section> : null}

    <p className={styles.sources}>Sources: {lesson.sources.join(" · ")}{usesLetterAudio ? <> · Letter recordings: <a href={LETTER_AUDIO_SOURCE.url} target="_blank" rel="noreferrer">{LETTER_AUDIO_SOURCE.name}</a>, {LETTER_AUDIO_SOURCE.copyright}, <a href={LETTER_AUDIO_SOURCE.licenseUrl} target="_blank" rel="noreferrer">{LETTER_AUDIO_SOURCE.license} license</a>, speaker unidentified</> : null}. Lesson status: draft, awaiting qualified review.</p>
  </Page>;
}

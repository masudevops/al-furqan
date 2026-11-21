"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import ContentState from "@/components/content-state";
import { Button, ButtonLink, Icon, Page, PageHeader } from "@/components/ui";
import { letterByChar, letterForms } from "@/lib/learn/alphabet";
import { QAIDAH_LESSONS, lessonForDay, lettersLearnedBefore } from "@/lib/learn/curriculum";
import { completeDay, emptyProgress, readProgress, recordAnswer, reviewPriority, writeProgress, type LearnProgress } from "@/lib/learn/progress";
import { recognitionQuestions, seededRandom, wordQuestions, wordsStartingWith, type PracticeWord, type RecognitionQuestion, type WordQuestion } from "@/lib/learn/quiz";
import type { PracticeWordPayload } from "@/lib/types";
import { DraftNotice } from "./learn-home";
import { useWordAudio } from "./use-word-audio";
import styles from "./learn.module.css";

const STEPS = ["Learn", "Recognise", "In the Quran", "Finish"] as const;
const POSITION_LABEL = { isolated: "On its own", initial: "Start", medial: "Middle", final: "End" } as const;
const fetcher = async (url: string) => { const response = await fetch(url); const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; };

function PlayWord({ word, audio, label }: { word: PracticeWord; audio: ReturnType<typeof useWordAudio>; label?: string }) {
  if (!word.audioUrl) return null;
  const active = audio.playing === word.audioUrl;
  return <button type="button" className={styles.play} aria-label={label ?? `Play recitation of the word from ${word.verseKey}`} aria-pressed={active} onClick={() => audio.play(word.audioUrl)}><Icon name={active ? "pause" : "play"} /></button>;
}

type Answer = { chosen: string; correct: boolean };

function Quiz<T extends RecognitionQuestion | WordQuestion>({ questions, render, isCorrect, onAnswer, onDone, doneLabel }: {
  questions: T[];
  render: (question: T, answer: Answer | undefined, choose: (value: string) => void) => React.ReactNode;
  isCorrect: (question: T, value: string) => boolean;
  onAnswer: (question: T, correct: boolean) => void;
  onDone: (score: number) => void;
  doneLabel: string;
}) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const question = questions[index];
  const answer = answers[index];
  const choose = (value: string) => {
    if (answer) return;
    const correct = isCorrect(question, value);
    setAnswers((current) => ({ ...current, [index]: { chosen: value, correct } }));
    onAnswer(question, correct);
  };
  const score = Object.values(answers).filter((item) => item.correct).length;
  if (!question) return null;
  return <div className={styles.quiz}>
    <div className={styles.quizHead}><span>Question {index + 1} of {questions.length}</span><span>{score} correct</span></div>
    <div className={styles.quizBar}><span style={{ width: `${((index + (answer ? 1 : 0)) / questions.length) * 100}%` }} /></div>
    {render(question, answer, choose)}
    {answer ? <div className={styles.feedback} role="status">
      <p className={answer.correct ? styles.right : styles.wrong}><Icon name={answer.correct ? "check" : "close"} />{answer.correct ? "Correct" : "Not quite — the correct answer is highlighted"}</p>
      {index + 1 < questions.length ? <Button variant="primary" trailingIcon="arrowRight" onClick={() => setIndex(index + 1)}>Next</Button> : <Button variant="primary" onClick={() => onDone(score)}>{doneLabel}</Button>}
    </div> : null}
  </div>;
}

export default function QaidahLesson({ day }: { day: number }) {
  const lesson = lessonForDay(day)!;
  const [step, setStep] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [progress, setProgress] = useState<LearnProgress>(emptyProgress);
  const [scores, setScores] = useState<{ recognition?: number; words?: number }>({});
  const audio = useWordAudio();
  const { data: wordData, error: wordError } = useSWR<PracticeWordPayload>("/api/learn/words", fetcher, { revalidateOnFocus: false });
  useEffect(() => setProgress(readProgress()), []);
  useEffect(() => { setStep(0); setScores({}); }, [day]);

  const earlier = useMemo(() => lettersLearnedBefore(day), [day]);
  const recognition = useMemo(() => {
    const random = seededRandom(day * 97 + attempt);
    const review = reviewPriority(readProgress(), earlier, 4);
    return [...recognitionQuestions(lesson.letters, earlier, 8, random), ...recognitionQuestions(review, lesson.letters, review.length, random)];
  }, [attempt, day, earlier, lesson.letters]);
  const words = useMemo(() => wordData ? wordQuestions(lesson.letters, wordData.words, seededRandom(day * 31 + attempt)) : [], [attempt, day, lesson.letters, wordData]);

  const save = (next: LearnProgress) => setProgress(writeProgress(next));
  const answer = (letter: string, correct: boolean) => save(recordAnswer(readProgress(), letter, correct));
  const goTo = (next: number) => { setStep(next); window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); };
  const complete = progress.completedDays.includes(day);
  const nextLesson = QAIDAH_LESSONS.find((item) => item.day === day + 1);

  return <Page narrow>
    <PageHeader back={{ href: "/learn", label: "Noorani Qaidah" }} kicker={`Day ${day} of 30`} kickerIcon="quran" title={<>Letters <span className={styles.titleLetters} lang="ar" dir="rtl" translate="no">{lesson.letters.join(" ")}</span></>} />
    <DraftNotice />
    <ol className={styles.steps} aria-label="Lesson steps">{STEPS.map((label, index) => <li key={label}><button type="button" aria-current={index === step ? "step" : undefined} className={index < step ? styles.stepDone : undefined} onClick={() => goTo(index)}><span>{index < step ? <Icon name="check" /> : index + 1}</span>{label}</button></li>)}</ol>

    {step === 0 ? <section aria-labelledby="learn-title">
      <h2 id="learn-title" className={styles.stepTitle}>Meet today&apos;s letters</h2>
      <p className={styles.stepIntro}>Each letter changes shape depending on where it sits in a word. Listen to how it sounds inside real words from the Quran.</p>
      <div className={styles.letterGrid}>{lesson.letters.map((char) => {
        const letter = letterByChar(char)!;
        const examples = wordData ? wordsStartingWith(wordData.words, char).slice(0, 3) : [];
        return <article className={styles.letterCard} key={char}>
          <div className={styles.letterHero}><span className={styles.bigLetter} lang="ar" translate="no">{char}</span><span className={styles.unicode}>{letter.unicodeName}<small>{letter.codePoint}</small></span></div>
          <div className={styles.forms}>{letterForms(letter).map((form) => <span key={form.position}><b lang="ar" translate="no">{form.text}</b><small>{POSITION_LABEL[form.position]}</small></span>)}</div>
          <div className={styles.examples}>
            <p>In the Quran</p>
            {wordError ? <span className={styles.muted}>Examples are unavailable right now.</span> : !wordData ? <span className={styles.muted}>Loading examples…</span> : examples.map((word) => <span className={styles.example} key={`${word.verseKey}-${word.position}`}><PlayWord word={word} audio={audio} /><b lang="ar" dir="rtl" translate="no">{word.text}</b><Link href={`/quran/${word.verseKey.replace(":", "/")}`}>{word.verseKey}</Link></span>)}
          </div>
          <p className={styles.pending}><Icon name="info" />Pronunciation recording and teaching notes awaiting review.</p>
        </article>;
      })}</div>
      {audio.failed ? <p className={styles.wrongText} role="alert">That recitation could not be played right now.</p> : null}
      <div className={styles.stepActions}><Button variant="primary" trailingIcon="arrowRight" onClick={() => goTo(1)}>Practise recognising them</Button></div>
    </section> : null}

    {step === 1 ? <section aria-labelledby="recognise-title">
      <h2 id="recognise-title" className={styles.stepTitle}>Which letter is this?</h2>
      <p className={styles.stepIntro}>Letters are shown in different positions.{earlier.length ? " A few earlier letters come back for review." : ""}</p>
      <Quiz key={`r-${attempt}`} questions={recognition} doneLabel="Continue"
        isCorrect={(question, value) => value === question.letter}
        onAnswer={(question, correct) => answer(question.letter, correct)}
        onDone={(score) => { setScores((current) => ({ ...current, recognition: score })); goTo(2); }}
        render={(question, given, choose) => <>
          <div className={styles.prompt}><span lang="ar" translate="no">{question.form.text}</span><small>{POSITION_LABEL[question.form.position]}{earlier.includes(question.letter) ? " · Review" : ""}</small></div>
          <div className={styles.options}>{question.options.map((option) => <button type="button" key={option} className={given ? option === question.letter ? styles.optionRight : option === given.chosen ? styles.optionWrong : undefined : undefined} disabled={Boolean(given)} onClick={() => choose(option)}><b lang="ar" translate="no">{option}</b><small>{letterByChar(option)?.unicodeName}</small></button>)}</div>
        </>} />
    </section> : null}

    {step === 2 ? <section aria-labelledby="quran-title">
      <h2 id="quran-title" className={styles.stepTitle}>Find it in the Quran</h2>
      <p className={styles.stepIntro}>Choose the word that begins with the letter. Tap play to hear each word as it is recited.</p>
      {wordError ? <ContentState kind="error" message="Practice words from the Quran are unavailable right now." /> : !wordData ? <ContentState message="Loading words from the Quran…" /> : words.length ? <Quiz key={`w-${attempt}`} questions={words} doneLabel="Finish lesson"
        isCorrect={(question, value) => value === `${question.answer.verseKey}-${question.answer.position}`}
        onAnswer={(question, correct) => answer(question.letter, correct)}
        onDone={(score) => { setScores((current) => ({ ...current, words: score })); goTo(3); }}
        render={(question, given, choose) => <>
          <div className={styles.prompt}><span lang="ar" translate="no">{question.letter}</span><small>Which word begins with this letter?</small></div>
          <div className={styles.wordOptions}>{question.options.map((option) => {
            const key = `${option.verseKey}-${option.position}`;
            const right = key === `${question.answer.verseKey}-${question.answer.position}`;
            return <div key={key} className={given ? right ? styles.optionRight : key === given.chosen ? styles.optionWrong : undefined : undefined}>
              <button type="button" className={styles.wordChoice} disabled={Boolean(given)} onClick={() => choose(key)}><b lang="ar" dir="rtl" translate="no">{option.text}</b>{given ? <small>{option.verseKey}</small> : null}</button>
              <PlayWord word={option} audio={audio} />
            </div>;
          })}</div>
        </>} /> : <ContentState kind="empty" message="No practice words were returned for these letters." />}
    </section> : null}

    {step === 3 ? <section aria-labelledby="finish-title" className={styles.finish}>
      <span className={styles.finishIcon} aria-hidden="true"><Icon name="check" /></span>
      <h2 id="finish-title" className={styles.stepTitle}>Day {day} {complete ? "completed" : "done"}</h2>
      <p className={styles.stepIntro}>{scores.recognition != null ? `Letters: ${scores.recognition} of ${recognition.length}. ` : ""}{scores.words != null ? `Quran words: ${scores.words} of ${words.length}.` : ""}</p>
      <div className={styles.stepActions}>
        {complete ? null : <Button variant="primary" icon="check" onClick={() => save(completeDay(readProgress(), day))}>Mark day {day} complete</Button>}
        <Button icon="back" onClick={() => { setAttempt((value) => value + 1); setScores({}); goTo(1); }}>Practise again</Button>
        {nextLesson ? <ButtonLink href={`/learn/qaidah/${nextLesson.day}`} trailingIcon="arrowRight">Day {nextLesson.day}</ButtonLink> : <ButtonLink href="/learn">Back to course</ButtonLink>}
      </div>
    </section> : null}

    <p className={styles.sources}>Sources: {lesson.sources.join(" · ")}. Lesson status: draft, awaiting qualified review.</p>
  </Page>;
}

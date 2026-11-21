"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ButtonLink, Icon, Page, PageHeader } from "@/components/ui";
import { COURSE_DAYS, QAIDAH_LESSONS } from "@/lib/learn/curriculum";
import { emptyProgress, nextDay, readProgress, type LearnProgress } from "@/lib/learn/progress";
import styles from "./learn.module.css";

export function DraftNotice() {
  return <aside className={styles.draft} aria-label="Preview notice">
    <Icon name="info" />
    <p><strong>Preview — not yet published.</strong> Letters and their forms come from the Unicode Standard, and practice uses real Quran words with recitation from Quran.Foundation. Letter recordings come from an MIT-licensed set by an unidentified speaker. Teaching notes, the recordings and the lesson plan are all awaiting review by a qualified teacher.</p>
  </aside>;
}

export default function LearnHome() {
  const [progress, setProgress] = useState<LearnProgress>(emptyProgress);
  useEffect(() => setProgress(readProgress()), []);
  const available = QAIDAH_LESSONS.length;
  const done = progress.completedDays.filter((day) => day <= available).length;
  const upNext = nextDay(progress, available);

  return <Page narrow>
    <PageHeader kicker="Learn" kickerIcon="learn" title="Learn to read the Quran" description="Start with the Arabic letters, one short lesson a day, practising on real words from the Quran." />
    <DraftNotice />
    <section className={styles.course} aria-labelledby="course-title">
      <div className={styles.courseHead}>
        <div><p className={styles.courseKicker}>Course</p><h2 id="course-title">Noorani Qaidah</h2><p className={styles.courseMeta}>{COURSE_DAYS} days · letters, forms, marks, listening and reading along</p></div>
        <ButtonLink variant="primary" href={`/learn/qaidah/${upNext ?? 1}`} trailingIcon="arrowRight">{done === 0 ? "Start day 1" : upNext ? `Continue with day ${upNext}` : "Review day 1"}</ButtonLink>
      </div>
      <div className={styles.courseProgress}><span style={{ width: `${(done / available) * 100}%` }} /></div>
      <p className={styles.courseMeta}>{done} of {available} lessons completed. Go at your own pace — there is no streak to keep.</p>
      <ol className={styles.days}>
        {QAIDAH_LESSONS.map((lesson) => {
          const complete = progress.completedDays.includes(lesson.day);
          return <li key={lesson.day}><Link href={`/learn/qaidah/${lesson.day}`} aria-current={lesson.day === upNext ? "step" : undefined}>
            <span className={complete ? styles.dayDone : styles.dayNumber}>{complete ? <Icon name="check" /> : lesson.day}</span>
            <span className={styles.dayText}><strong>{lesson.letters.length ? `Day ${lesson.day}` : lesson.title}</strong><span>{complete ? "Completed" : lesson.day === upNext ? `Up next · ${lesson.subtitle}` : lesson.letters.length ? lesson.subtitle : `Day ${lesson.day} · ${lesson.subtitle}`}</span></span>
            {lesson.letters.length ? <span className={styles.dayLetters} lang="ar" dir="rtl" translate="no">{lesson.letters.join(" ")}</span> : <span />}
            <Icon name="arrowRight" />
          </Link></li>;
        })}
      </ol>
    </section>
  </Page>;
}

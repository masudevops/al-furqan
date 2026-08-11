"use client";

import Link from "next/link";
import useSWR from "swr";
import styles from "./daily-content.module.css";

type DailyPayload = {
  day: string;
  hadith: null | { collectionId: string; collectionName: string; hadithNumber: number; text: string; authenticityContext: string };
  verse: null | { arabicText: string; chapterName: string; translationName: string; translationText: string; verseKey: string };
};

const fetcher = async (url: string) => {
  const response = await fetch(url);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
};

export default function DailyContent() {
  const { data, error, isLoading } = useSWR<DailyPayload>("/api/daily-content", fetcher, { revalidateOnFocus: false });
  if (isLoading) return <section className={styles.grid} aria-label="Loading daily sourced content"><article className={styles.skeleton}/><article className={styles.skeleton}/></section>;
  if (error) return <p className={styles.unavailable}>Today&apos;s sourced verse and Hadith are unavailable right now.</p>;
  if (!data?.verse && !data?.hadith) return null;
  return <section className={styles.grid} aria-label="Daily sourced content">
    {data.verse ? <article className={styles.card}>
      <p className={styles.kicker}>Verse of the day</p>
      <p className={styles.arabic} lang="ar" dir="rtl" translate="no">{data.verse.arabicText}</p>
      <div className={styles.translation} translate="no" dangerouslySetInnerHTML={{ __html: data.verse.translationText }}/>
      <footer><span>{data.verse.chapterName} · {data.verse.verseKey}<small>{data.verse.translationName} · Quran.Foundation</small></span><Link href={`/quran/${data.verse.verseKey.replace(":", "/")}`}>Read in context →</Link></footer>
    </article> : null}
    {data.hadith ? <article className={styles.card}>
      <p className={styles.kicker}>Hadith of the day</p>
      <p className={styles.hadith} translate="no">{data.hadith.text}</p>
      <footer><span>{data.hadith.collectionName} · Hadith {data.hadith.hadithNumber}<small>Reported grade: {data.hadith.authenticityContext}</small></span><Link href={`/sunnah/${data.hadith.collectionId}/${data.hadith.hadithNumber}`}>Read Arabic & English →</Link></footer>
    </article> : null}
  </section>;
}

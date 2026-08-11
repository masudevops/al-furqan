"use client";

import Link from "next/link";
import useSWR from "swr";
import styles from "./mutashabihat-panel.module.css";

type Item = { similarVerseKeys: string[]; verseKey: string };
const fetcher = async (url: string) => { const response = await fetch(url); const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; };

export default function MutashabihatPanel({ chapterId }: { chapterId: number }) {
  const { data, error, isLoading } = useSWR<{ items: Item[] }>(`/api/quran/mutashabihat/${chapterId}`, fetcher);
  return <section className={styles.panel} aria-label="Similar Ayahs for memorization"><div><strong>Similar Ayahs</strong><span>Curated references to commonly confused passages for Hifz review.</span></div>{isLoading ? <p>Loading references…</p> : null}{error ? <p>Similar-Ayah references are unavailable right now.</p> : null}{data?.items.length === 0 ? <p>No curated similar-Ayah references were returned for this Surah.</p> : null}<div className={styles.list}>{data?.items.map((item) => <article key={item.verseKey}><Link href={`/quran/${item.verseKey.replace(":", "/")}`}>{item.verseKey}</Link><span>Compare with</span><div>{item.similarVerseKeys.map((key) => <Link href={`/quran/${key.replace(":", "/")}`} key={key}>{key}</Link>)}</div></article>)}</div><small>Relationship source: Waqar144/Quran_Mutashabihat_Data, curated from the work of Qari Idrees Al Asim and memorization experience. Quran text remains sourced from Quran.Foundation.</small></section>;
}

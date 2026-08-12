"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";

import ContentState from "./content-state";
import type { QuranReflectItem, QuranReflectPayload } from "@/lib/types";
import styles from "./quran-tools.module.css";

const fetcher = (url: string) => fetch(url).then(async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Quran Reflect is unavailable.");
  return data;
});

const formatDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(date);
};

const fallbackTitle = (item: QuranReflectItem) => {
  const reference = item.references[0];
  return reference ? `${item.postType} on Quran ${reference.chapterId}:${reference.from}` : `Quran ${item.postType}`;
};

export default function QuranReflectPage() {
  const [page, setPage] = useState(1);
  const { data, error, isLoading } = useSWR<QuranReflectPayload>(`/api/quran/reflect?page=${page}`, fetcher, { keepPreviousData: true, revalidateOnFocus: false });
  const unavailable = error || data?.error;

  return <main className={`${styles.page} ${styles.reflectPage}`}>
    <header className={styles.header}><div><Link href="/quran">← Quran</Link><h1>Lessons & Reflections</h1><p>Explore Quran Reflect&apos;s QDC-curated lessons and reflections, each connected to the Ayahs it discusses.</p></div></header>
    {isLoading ? <ContentState message="Loading lessons and reflections…"/> : null}
    {unavailable ? <ContentState kind="error" message="Lessons and reflections are unavailable right now."/> : null}
    {data && !data.error && !data.items.length ? <ContentState kind="empty" message="No curated lessons or reflections are available right now."/> : null}
    <section className={styles.reflectionList} aria-live="polite">{data?.items.map((item) => {
      const published = formatDate(item.publishedAt);
      return <article className={styles.reflectionCard} key={item.id}>
        <header>
          <div className={styles.reflectionBadges}><span>{item.postType === "lesson" ? "Lesson" : "Reflection"}</span><span>QDC curated</span>{item.verified ? <span>Verified author</span> : null}</div>
          <h2><Link href={`/reflect/${item.id}`}>{item.title ?? fallbackTitle(item)}</Link></h2>
          <p className={styles.reflectionMeta}>{item.authorName ? `By ${item.authorName}` : "Quran Reflect contributor"}{published ? ` · ${published}` : ""}{item.languageName ? ` · ${item.languageName}` : ""}</p>
        </header>
        {item.references.length ? <nav aria-label="Referenced Ayahs">{item.references.map((reference) => <Link href={`/quran/${reference.chapterId}/${reference.from}`} key={`${reference.chapterId}:${reference.from}`}>Quran {reference.chapterId}:{reference.from}{reference.to !== reference.from ? `–${reference.to}` : ""}</Link>)}</nav> : null}
        {item.excerpt ? <p className={styles.reflectionExcerpt} translate="no">{item.excerpt}</p> : null}
        <footer><span/><Link className={styles.readMore} href={`/reflect/${item.id}`}>Read {item.postType === "lesson" ? "lesson" : "reflection"} <span aria-hidden="true">→</span></Link></footer>
      </article>;
    })}</section>
    {data && data.pages > 1 ? <nav className={styles.pagination} aria-label="Lessons and reflections pages"><button disabled={page <= 1 || isLoading} onClick={() => setPage((value) => Math.max(1, value - 1))}>← Previous</button><span>Page {page} of {data.pages}</span><button disabled={page >= data.pages || isLoading} onClick={() => setPage((value) => Math.min(data.pages, value + 1))}>Next →</button></nav> : null}
  </main>;
}

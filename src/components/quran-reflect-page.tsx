"use client";

import Link from "next/link";
import useSWR from "swr";

import type { QuranReflectPayload } from "@/lib/types";
import styles from "./quran-tools.module.css";

const fetcher = (url: string) => fetch(url).then(async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Quran Reflect is unavailable.");
  return data;
});

export default function QuranReflectPage() {
  const { data, error, isLoading } = useSWR<QuranReflectPayload>("/api/quran/reflect?page=1", fetcher, { revalidateOnFocus: false });
  return <main className={styles.page}>
    <header className={styles.header}><div><Link href="/quran">← Quran</Link><h1>Lessons & Reflections</h1><p>Curated Quran Reflect lessons and reflections connected to the Ayahs they discuss.</p></div></header>
    {isLoading ? <p>Loading lessons and reflections…</p> : null}
    {error ? <p className={styles.error}>Quran Reflect is unavailable for this API client right now. The production client requires the <code>post.read</code> scope.</p> : null}
    {data && !data.items.length ? <p className={styles.error}>No curated lessons or reflections are available right now.</p> : null}
    <section className={styles.reflectionList}>{data?.items.map((item) => <article className={styles.reflection} key={item.id}>
      <div><strong>{item.postType === "lesson" ? "Lesson" : "Reflection"}</strong>{item.verified ? <span>Verified</span> : null}</div>
      <div translate="no" dangerouslySetInnerHTML={{ __html: item.bodyHtml }} />
      {item.references.length ? <nav>{item.references.map((reference) => <Link href={`/quran/${reference.chapterId}/${reference.from}`} key={`${reference.chapterId}:${reference.from}`}>Quran {reference.chapterId}:{reference.from}{reference.to !== reference.from ? `–${reference.to}` : ""}</Link>)}</nav> : null}
      <small>{item.authorName ? `By ${item.authorName} · ` : ""}Quran Reflect{item.languageName ? ` · ${item.languageName}` : ""}</small>
      <Link className={styles.readMore} href={`/reflect/${item.id}`}>Open lesson or reflection →</Link>
    </article>)}</section>
  </main>;
}

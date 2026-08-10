"use client";

import Link from "next/link";
import useSWR from "swr";

import type { QuranReflectItem } from "@/lib/types";
import styles from "./quran-tools.module.css";

const fetcher = (url: string) => fetch(url).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; });

export default function QuranReflectDetail({ postId }: { postId: number }) {
  const { data, error, isLoading } = useSWR<{ item: QuranReflectItem }>(`/api/quran/reflect/${postId}`, fetcher, { revalidateOnFocus: false });
  const item = data?.item;
  const reference = item?.references[0];
  const title = item?.title ?? (item ? `${item.postType}${reference ? ` on Quran ${reference.chapterId}:${reference.from}` : ""}` : "Lesson or Reflection");
  const published = item?.publishedAt ? new Date(item.publishedAt) : null;
  const publishedLabel = published && !Number.isNaN(published.getTime()) ? new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(published) : null;
  return <main className={`${styles.page} ${styles.reflectDetail}`}>
    <header className={styles.header}><div><Link href="/reflect">← Lessons & Reflections</Link><p className={styles.detailKicker}>{item?.postType ?? "Quran Reflect"} · QDC curated</p><h1>{title}</h1>{item ? <p className={styles.reflectionMeta}>{item.authorName ? `By ${item.authorName}` : "Quran Reflect contributor"}{publishedLabel ? ` · ${publishedLabel}` : ""}{item.languageName ? ` · ${item.languageName}` : ""}</p> : null}</div></header>
    {isLoading ? <p className={styles.loading}>Loading lesson or reflection…</p> : null}
    {error ? <p className={styles.error}>This lesson or reflection is unavailable right now.</p> : null}
    {item ? <article className={styles.reflectionDetailCard}>{item.references.length ? <nav aria-label="Referenced Ayahs">{item.references.map((entry) => <Link href={`/quran/${entry.chapterId}/${entry.from}`} key={`${entry.chapterId}:${entry.from}`}>Quran {entry.chapterId}:{entry.from}{entry.to !== entry.from ? `–${entry.to}` : ""}</Link>)}</nav> : null}<div className={styles.reflectionBody} translate="no" dangerouslySetInnerHTML={{ __html: item.bodyHtml }} /><footer><small>Source: Quran Reflect · QDC-curated feed</small></footer></article> : null}
  </main>;
}

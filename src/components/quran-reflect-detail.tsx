"use client";

import Link from "next/link";
import useSWR from "swr";

import type { QuranReflectItem } from "@/lib/types";
import styles from "./quran-tools.module.css";

const fetcher = (url: string) => fetch(url).then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; });

export default function QuranReflectDetail({ postId }: { postId: number }) {
  const { data, error, isLoading } = useSWR<{ item: QuranReflectItem }>(`/api/quran/reflect/${postId}`, fetcher, { revalidateOnFocus: false });
  const item = data?.item;
  return <main className={styles.page}><header className={styles.header}><div><Link href="/reflect">← Lessons & Reflections</Link><h1>{item?.postType === "lesson" ? "Lesson" : "Reflection"}</h1></div></header>{isLoading ? <p>Loading…</p> : null}{error ? <p className={styles.error}>This lesson or reflection is unavailable right now.</p> : null}{item ? <article className={styles.reflection}><div><strong>{item.postType}</strong>{item.verified ? <span>Verified</span> : null}</div><div translate="no" dangerouslySetInnerHTML={{ __html: item.bodyHtml }} />{item.references.length ? <nav>{item.references.map((reference) => <Link href={`/quran/${reference.chapterId}/${reference.from}`} key={`${reference.chapterId}:${reference.from}`}>Quran {reference.chapterId}:{reference.from}{reference.to !== reference.from ? `–${reference.to}` : ""}</Link>)}</nav> : null}<small>{item.authorName ? `By ${item.authorName} · ` : ""}Quran Reflect{item.languageName ? ` · ${item.languageName}` : ""}</small></article> : null}</main>;
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import type { DuaCategory, DuaEntry, DuaSummary } from "@/lib/dua";
import { hasLocalBookmark, readLocalBookmarks, toggleLocalBookmark } from "@/lib/local-bookmarks";
import BookmarkButton from "./bookmark-button";
import ContentState from "./content-state";
import styles from "./feature-pages.module.css";

const fetcher = (url: string) => fetch(url).then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; });
const icons: Record<string,string> = { "morning-dhikr":"☀", "evening-dhikr":"☾", "daily-dua":"✦", "selected-dua":"❖", "dhikr-after-salah":"◈" };

export function DuaCategories() {
  const { data, error, isLoading } = useSWR<{items:DuaCategory[]}>("/api/dua/categories", fetcher);
  return <main className={styles.page}>
    <header className={styles.pageHeader}><div><span className={styles.eyebrow}>Hisnul Muslim</span><h1>Dua</h1><p>Authentic daily duas and dhikr, kept with their Arabic, meaning, and source reference.</p></div></header>
    {isLoading ? <ContentState message="Loading Dua categories…"/> : null}
    {error ? <ContentState kind="error" message="Dua content is unavailable right now. No substitute content has been used."/> : null}
    <section className={styles.categoryGrid}>{data?.items.map(item => <Link className={styles.categoryCard} href={`/dua/${item.slug}`} key={item.slug}><span className={styles.categoryIcon}>{icons[item.slug] ?? "✦"}</span><div><h2>{item.name}</h2><p>{item.total} entries</p></div><b>→</b></Link>)}</section>
  </main>;
}

export function DuaCategoryList({ slug }: { slug:string }) {
  const { data, error, isLoading } = useSWR<{items:DuaSummary[]}>(`/api/dua/categories/${slug}`, fetcher);
  const [query, setQuery] = useState("");
  const items = useMemo(() => data?.items.filter(item => item.title.toLowerCase().includes(query.toLowerCase())) ?? [], [data, query]);
  return <main className={styles.page}>
    <Link className={styles.backLink} href="/dua">← All Dua categories</Link>
    <header className={styles.pageHeader}><div><span className={styles.eyebrow}>Dua collection</span><h1>{data?.items[0]?.categoryName ?? "Dua"}</h1><p>Open an entry to read its Arabic, transliteration, translation, and source.</p></div></header>
    <label className={styles.searchBox}><span className="sr-only">Search this Dua category</span><input aria-label="Search this Dua category" type="search" placeholder="Search this category" value={query} onChange={event => setQuery(event.target.value)}/></label>
    {isLoading ? <ContentState message="Loading Duas…"/> : null}
    {error ? <ContentState kind="error" message="This category is unavailable right now."/> : null}
    {!isLoading && !error && items.length === 0 ? <ContentState kind="empty" message="No Duas match this search."/> : null}
    <section className={styles.duaList}>{items.map((item,index) => <Link className={styles.duaCard} href={`/dua/${slug}/${item.id}`} key={item.id}><div className={styles.duaHead}><h2>{index+1}. {item.title}</h2><b>→</b></div></Link>)}</section>
  </main>;
}

export function DuaDetail({ slug, id }: { slug:string; id:string }) {
  const { data, error, isLoading } = useSWR<{item:DuaEntry}>(`/api/dua/categories/${slug}/${id}`, fetcher);
  const [bookmarks, setBookmarks] = useState(readLocalBookmarks);
  const [audioError, setAudioError] = useState(false);
  useEffect(() => setBookmarks(readLocalBookmarks()), []);
  const item = data?.item;
  const bookmarkId = `dua:${slug}:${id}`;
  return <main className={styles.page}>
    <Link className={styles.backLink} href={`/dua/${slug}`}>← Back to category</Link>
    {isLoading ? <ContentState message="Loading Dua…"/> : null}
    {error ? <ContentState kind="error" message="This Dua is unavailable right now. No substitute content has been used."/> : null}
    {item ? <article className={styles.duaCard}>
      <div className={styles.duaHead}><div><span className={styles.eyebrow}>{item.categoryName} · {item.id}</span><h1>{item.title}</h1></div><BookmarkButton saved={hasLocalBookmark(bookmarks,bookmarkId)} label={item.title} onClick={() => setBookmarks(toggleLocalBookmark({id:bookmarkId,label:item.title,reference:item.source,type:"dua",url:`/dua/${slug}/${id}`}))}/></div>
      {item.audio ? <section className={styles.duaAudio}><div><strong>Listen to this Dua</strong><span>Arabic recitation</span></div><audio controls preload="none" onError={() => setAudioError(true)} aria-label={`Arabic recitation of ${item.title}`}><source src={item.audio.url} type="audio/mpeg"/></audio>{audioError ? <p className={styles.errorText}>The recording is unavailable right now.</p> : null}</section> : <p className={styles.audioUnavailable}>A verified recording is not available for this Dua yet.</p>}
      <p className={styles.duaArabic} lang="ar" dir="rtl" translate="no">{item.arabic}</p><p className={styles.transliteration}>{item.latin}</p><p className={styles.translation} translate="no">{item.translation}</p>{item.notes ? <p><strong>Practice:</strong> {item.notes}</p> : null}{item.fawaid ? <p><strong>Benefit:</strong> {item.fawaid}</p> : null}<p className={styles.reference}>Reference: {item.source || "Reference unavailable"}</p>
    </article> : null}
  </main>;
}

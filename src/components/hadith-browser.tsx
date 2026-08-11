"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import useSWR from "swr";
import { hasLocalBookmark, readLocalBookmarks, toggleLocalBookmark } from "@/lib/local-bookmarks";
import styles from "./hadith-browser.module.css";

type Collection = { id: string; name: string; sections: Array<{ id: string; name: string }> };
type Hadith = { arabic: string; authenticityContext: string; bookNumber: number; collectionId: string; collectionName: string; grades: Array<{ grade: string; scholar: string }>; hadithNumber: number; narrator: string; referenceNumber: number; sectionName: string; text: string };
const fetcher = async (url: string) => { const response = await fetch(url); const value = await response.json(); if (!response.ok) throw value; return value; };

export default function HadithBrowser({ collectionId, hadithNumber }: { collectionId?: string; hadithNumber?: string }) {
  const { data: catalog, error: catalogError } = useSWR<{ items: Collection[] }>("/api/hadith/collections", fetcher);
  const [collection, setCollection] = useState(collectionId ?? "bukhari");
  const [section, setSection] = useState("all");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [bookmarks, setBookmarks] = useState(readLocalBookmarks);
  useEffect(() => setBookmarks(readLocalBookmarks()), []);
  useEffect(() => { if (collectionId) setCollection(collectionId); }, [collectionId]);
  const selected = catalog?.items.find((item) => item.id === collection);
  useEffect(() => { if (selected?.sections.length && !selected.sections.some((item) => item.id === section)) setSection(selected.sections[0].id); }, [selected, section]);
  const listUrl = !hadithNumber && selected ? `/api/hadith/${collection}?${query ? `query=${encodeURIComponent(query)}` : `section=${encodeURIComponent(section)}`}` : null;
  const { data: list, error: listError, isLoading } = useSWR<{ items: Hadith[] }>(listUrl, fetcher);
  const { data: detail, error: detailError } = useSWR<{ item: Hadith }>(hadithNumber && collectionId ? `/api/hadith/${collectionId}/${hadithNumber}` : null, fetcher);
  const item = detail?.item;
  const bookmarkId = item ? `sunnah:${item.collectionId}:${item.hadithNumber}` : "";
  const bookmarked = hasLocalBookmark(bookmarks, bookmarkId);
  const search = (event: FormEvent) => { event.preventDefault(); setQuery(queryInput.trim()); };

  if (hadithNumber) return <main className={styles.main}>{detailError ? <State text="This sourced Hadith record is unavailable right now. No substitute content has been used." /> : !item ? <State text="Loading sourced Hadith…" /> : <article className={styles.detail}><Link href="/sunnah">← Sunnah library</Link><p className={styles.kicker}>{item.collectionName} · Volume {item.bookNumber} · Reference {item.referenceNumber}</p><h1>{item.sectionName}</h1>{item.narrator ? <p className={styles.narrator}>{item.narrator}</p> : null}<p className={styles.arabic} lang="ar" dir="rtl" translate="no">{item.arabic}</p><p className={styles.translation} translate="no">{item.text}</p><section><strong>Authenticity context supplied by source</strong><span>{item.authenticityContext}</span><small>sunnah.now v0.1.0 does not return a separate per-Hadith grade. Al-Furqan does not infer one.</small></section><button onClick={() => setBookmarks(toggleLocalBookmark({ id: bookmarkId, label: `${item.collectionName} ${item.hadithNumber}`, reference: `${item.collectionName}, Hadith ${item.hadithNumber}`, type: "sunnah", url: `/sunnah/${item.collectionId}/${item.hadithNumber}` }))}>{bookmarked ? "Remove bookmark" : "Bookmark Hadith"}</button><small>Source: sunnah.now Early Access API. Arabic, English, identifiers, and collection metadata are displayed as supplied.</small></article>}</main>;

  return <main className={styles.main}><header><p className={styles.kicker}>Sourced Sunnah</p><h1>Sunnah library</h1><p>Browse Arabic and English Hadith with exact source references and clearly identified provenance.</p></header>{catalogError ? <State text="Sunnah collections are unavailable right now. No substitute content has been used." /> : <><div className={styles.controls}><label>Collection<select value={collection} onChange={(event) => { setCollection(event.target.value); setQuery(""); }}>{catalog?.items.map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}</select></label><label>Scope<select value={section} onChange={(event) => { setSection(event.target.value); setQuery(""); }}>{selected?.sections.map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}</select></label></div><form className={styles.search} onSubmit={search}><input value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="Search the currently loaded Arabic or English records" aria-label="Search Hadith" /><button>Search</button></form>{listError ? <State text="Sunnah content is unavailable right now. No substitute content has been used." /> : isLoading ? <State text="Loading sourced Hadith…" /> : <section className={styles.list}>{list?.items.map((entry) => <Link href={`/sunnah/${entry.collectionId}/${entry.hadithNumber}`} key={entry.hadithNumber}><span>{entry.collectionName} · Volume {entry.bookNumber} · Hadith {entry.hadithNumber}</span><h2>{entry.sectionName}</h2>{entry.narrator ? <small>{entry.narrator}</small> : null}<p>{entry.text}</p><strong>{entry.authenticityContext} · Collection-level context</strong></Link>)}{list?.items.length === 0 ? <State text="No complete sourced records matched. Try another search." /> : null}</section>}</>}</main>;
}

function State({ text }: { text: string }) { return <p className={styles.state}>{text}</p>; }

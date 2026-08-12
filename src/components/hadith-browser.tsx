"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import useSWR from "swr";
import { hasLocalBookmark, readLocalBookmarks, toggleLocalBookmark } from "@/lib/local-bookmarks";
import styles from "./hadith-browser.module.css";

type Collection = { id: string; name: string; sections: Array<{ id: string; name: string }>; total: number };
type Hadith = { arabic: string; authenticityContext: string; bookNumber: number; collectionId: string; collectionName: string; grades: Array<{ grade: string; scholar: string }>; hadithNumber: number; narrator: string; referenceNumber: number; sectionName: string; text: string };
type HadithPage = { items: Hadith[]; page: number; pages: number; total: number };
const fetcher = async (url: string) => { const response = await fetch(url); const value = await response.json(); if (!response.ok) throw value; return value; };

export default function HadithBrowser({ collectionId, hadithNumber, initialCatalog, initialItem, initialList }: { collectionId?: string; hadithNumber?: string; initialCatalog?: Collection[]; initialItem?: Hadith | null; initialList?: HadithPage }) {
  const { data: catalog, error: catalogError } = useSWR<{ items: Collection[] }>("/api/hadith/collections", fetcher, { fallbackData: initialCatalog ? { items: initialCatalog } : undefined, revalidateOnFocus: false });
  const [collection, setCollection] = useState(collectionId ?? "bukhari");
  const [section, setSection] = useState("all");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [bookmarks, setBookmarks] = useState(readLocalBookmarks);
  useEffect(() => setBookmarks(readLocalBookmarks()), []);
  useEffect(() => { if (collectionId) setCollection(collectionId); }, [collectionId]);
  const selected = catalog?.items.find((item) => item.id === collection);
  useEffect(() => { if (selected?.sections.length && !selected.sections.some((item) => item.id === section)) setSection(selected.sections[0].id); }, [selected, section]);
  const listUrl = !hadithNumber && selected ? `/api/hadith/${collection}?${query ? `query=${encodeURIComponent(query)}` : `page=${page}`}` : null;
  const { data: list, error: listError, isLoading } = useSWR<HadithPage>(listUrl, fetcher, { fallbackData: initialList, revalidateOnFocus: false });
  const { data: detail, error: detailError } = useSWR<{ item: Hadith }>(hadithNumber && collectionId ? `/api/hadith/${collectionId}/${hadithNumber}` : null, fetcher, { fallbackData: initialItem ? { item: initialItem } : undefined, revalidateOnFocus: false });
  const item = detail?.item;
  const bookmarkId = item ? `sunnah:${item.collectionId}:${item.hadithNumber}` : "";
  const bookmarked = hasLocalBookmark(bookmarks, bookmarkId);
  const search = (event: FormEvent) => { event.preventDefault(); setQuery(queryInput.trim()); };

  if (hadithNumber) return <main className={styles.main}>{detailError ? <State text="This sourced Hadith record is unavailable right now. No substitute content has been used." /> : !item ? <State text="Loading sourced Hadith…" /> : <article className={styles.detail}><Link href="/sunnah">← Sunnah library</Link><p className={styles.kicker}>{item.collectionName} · Hadith {item.referenceNumber}</p><h1>{item.sectionName}</h1><p className={styles.arabic} lang="ar" dir="rtl" translate="no">{item.arabic}</p><p className={styles.translation} translate="no">{item.text}</p><section><strong>Reported grade</strong><span>{item.authenticityContext}</span></section><button onClick={() => setBookmarks(toggleLocalBookmark({ id: bookmarkId, label: `${item.collectionName} ${item.hadithNumber}`, reference: `${item.collectionName}, Hadith ${item.hadithNumber}`, type: "sunnah", url: `/sunnah/${item.collectionId}/${item.hadithNumber}` }))}>{bookmarked ? "Remove bookmark" : "Bookmark Hadith"}</button><details className={styles.sourceDisclosure}><summary>Source information</summary><small>Hadith text, translation, reference, and reported grade are provided through UmmahAPI. A grading authority is not named for this record, and Al-Furqan does not infer one.</small></details></article>}</main>;

  return <main className={styles.main}><header><p className={styles.kicker}>Hadith collections</p><h1>Sunnah library</h1><p>Browse Arabic and English Hadith by collection and reference.</p></header>{catalogError ? <State text="Sunnah collections are unavailable right now. No substitute content has been used." /> : <><div className={styles.controls}><label>Collection<select value={collection} onChange={(event) => { setCollection(event.target.value); setQuery(""); setPage(1); }}>{catalog?.items.map((entry) => <option value={entry.id} key={entry.id}>{entry.name} ({entry.total.toLocaleString()})</option>)}</select></label><label>Scope<select value={section} onChange={(event) => { setSection(event.target.value); setQuery(""); setPage(1); }}>{selected?.sections.map((entry) => <option value={entry.id} key={entry.id}>{entry.name}</option>)}</select></label></div><form className={styles.search} onSubmit={(event) => { search(event); setPage(1); }}><input value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder="Search this collection in Arabic or English" aria-label="Search Hadith" /><button>Search</button></form>{query ? <button className={styles.clearSearch} onClick={() => { setQuery(""); setQueryInput(""); }}>Clear search</button> : null}{listError ? <State text="Sunnah content is unavailable right now. No substitute content has been used." /> : isLoading ? <State text="Loading sourced Hadith…" /> : <><section className={styles.list}>{list?.items.map((entry) => <Link href={`/sunnah/${entry.collectionId}/${entry.hadithNumber}`} key={entry.hadithNumber}><span>{entry.collectionName} · Hadith {entry.hadithNumber}</span><h2>{entry.sectionName}</h2><p>{entry.text}</p><strong>Reported grade: {entry.authenticityContext}</strong></Link>)}{list?.items.length === 0 ? <State text="No complete sourced records matched. Try another search." /> : null}</section>{!query&&list&&list.pages>1?<nav className={styles.pagination} aria-label="Hadith pages"><button disabled={list.page<=1} onClick={()=>setPage(value=>Math.max(1,value-1))}>← Previous</button><span>Page {list.page} of {list.pages} · {list.total.toLocaleString()} records</span><button disabled={list.page>=list.pages} onClick={()=>setPage(value=>value+1)}>Next →</button></nav>:null}</>}</>}</main>;
}

function State({ text }: { text: string }) { return <p className={styles.state}>{text}</p>; }

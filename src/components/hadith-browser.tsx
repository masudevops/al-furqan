"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import styles from "./hadith-browser.module.css";

type Collection = { id: string; name: string; sections: Array<{ id: string; name: string }> };
type Hadith = { arabic: string; bookNumber: number; collectionId: string; collectionName: string; grades: Array<{ grade: string; scholar: string }>; hadithNumber: number; referenceNumber: number; sectionName: string; text: string };
const fetcher = async (url: string) => { const response = await fetch(url); const value = await response.json(); if (!response.ok) throw value; return value; };

export default function HadithBrowser({ collectionId, hadithNumber }: { collectionId?: string; hadithNumber?: string }) {
  const { data: catalog, error: catalogError } = useSWR<{items: Collection[]}>("/api/hadith/collections", fetcher);
  const [collection, setCollection] = useState(collectionId ?? "tirmidhi");
  const [section, setSection] = useState("1");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => { try { setSaved(JSON.parse(localStorage.getItem("af-hadith-bookmarks") ?? "[]")); } catch {} }, []);
  useEffect(() => { if (collectionId) setCollection(collectionId); }, [collectionId]);
  const selected = catalog?.items.find(item => item.id === collection);
  useEffect(() => { if (selected?.sections.length && !selected.sections.some(item => item.id === section)) setSection(selected.sections[0].id); }, [selected, section]);
  const listUrl = !hadithNumber && selected ? `/api/hadith/${collection}?${query ? `query=${encodeURIComponent(query)}` : `section=${encodeURIComponent(section)}`}` : null;
  const { data: list, error: listError, isLoading } = useSWR<{items: Hadith[]}>(listUrl, fetcher);
  const { data: detail, error: detailError } = useSWR<{item: Hadith}>(hadithNumber && collectionId ? `/api/hadith/${collectionId}/${hadithNumber}` : null, fetcher);
  const item = detail?.item;
  const key = item ? `${item.collectionId}:${item.hadithNumber}` : "";
  const bookmarked = saved.includes(key);
  const toggle = () => { const next = bookmarked ? saved.filter(value => value !== key) : [...saved, key]; setSaved(next); localStorage.setItem("af-hadith-bookmarks", JSON.stringify(next)); };
  const search = (event: FormEvent) => { event.preventDefault(); setQuery(queryInput.trim()); };
  const references = useMemo(() => item?.grades.map(grade => `${grade.grade} — ${grade.scholar}`) ?? [], [item]);

  if (hadithNumber) return <main className={styles.main}>{detailError ? <State text="This source does not provide a complete graded record for this reference."/> : !item ? <State text="Loading sourced Hadith…"/> : <article className={styles.detail}><Link href="/hadith">← Hadith library</Link><p className={styles.kicker}>{item.collectionName} · Book {item.bookNumber} · Reference {item.referenceNumber} · Hadith {item.hadithNumber}</p><h1>{item.sectionName}</h1><p className={styles.arabic} lang="ar" dir="rtl" translate="no">{item.arabic}</p><p className={styles.translation} translate="no">{item.text}</p><section><strong>Grades reported by source</strong>{references.map(value => <span key={value}>{value}</span>)}</section><button onClick={toggle}>{bookmarked ? "Remove bookmark" : "Bookmark Hadith"}</button><small>Source: fawazahmed0/hadith-api via jsDelivr. Grades are displayed exactly as supplied and may differ between named scholars.</small></article>}</main>;

  return <main className={styles.main}><header><p className={styles.kicker}>Sourced Hadith</p><h1>Hadith library</h1><p>Browse Arabic and English records only when the source supplies a reference and authenticity grade.</p></header>{catalogError ? <State text="Hadith collections are unavailable right now."/> : <><div className={styles.controls}><label>Collection<select value={collection} onChange={event => { setCollection(event.target.value); setQuery(""); }}>{catalog?.items.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label><label>Book<select value={section} onChange={event => { setSection(event.target.value); setQuery(""); }}>{selected?.sections.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label></div><form className={styles.search} onSubmit={search}><input value={queryInput} onChange={event => setQueryInput(event.target.value)} placeholder="Search this collection in Arabic or English"/><button>Search</button></form>{listError ? <State text="Hadith content is unavailable right now."/> : isLoading ? <State text="Loading sourced Hadith…"/> : <section className={styles.list}>{list?.items.map(item => <Link href={`/hadith/${item.collectionId}/${item.hadithNumber}`} key={item.hadithNumber}><span>{item.collectionName} · Book {item.bookNumber} · Hadith {item.hadithNumber}</span><h2>{item.sectionName}</h2><p>{item.text}</p><strong>{item.grades[0].grade} — {item.grades[0].scholar}</strong></Link>)}{list?.items.length === 0 ? <State text="No complete graded records matched. Try another book or search."/> : null}</section>}</>}</main>;
}

function State({ text }: { text: string }) { return <p className={styles.state}>{text}</p>; }

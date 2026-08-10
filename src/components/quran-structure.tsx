"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import styles from "./quran-tools.module.css";

const fetcher = (url: string) => fetch(url).then(async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
});

export function QuranStructureIndex() {
  const router = useRouter();
  const [pageNumber, setPageNumber] = useState(1);
  const [rangeFrom, setRangeFrom] = useState("1:1");
  const [rangeTo, setRangeTo] = useState("1:7");
  const groups = [
    { kind: "juz", label: "Juz", count: 30, description: "Thirty equal reading portions." },
    { kind: "hizb", label: "Hizb", count: 60, description: "Sixty half-Juz divisions." },
    { kind: "rub", label: "Rub el Hizb", count: 240, description: "Quarter-Hizb reading markers." },
    { kind: "ruku", label: "Ruku", count: 558, description: "Thematic Quran reading passages." },
    { kind: "manzil", label: "Manzil", count: 7, description: "Seven weekly reading divisions." },
  ];
  return <main className={styles.page}><header className={styles.header}><div><Link href="/quran">← Quran</Link><h1>Browse by structure</h1><p>Navigate the Quran using authoritative structural metadata from Quran.Foundation.</p></div><div className={styles.tools}><Link href="/quran/mushaf/1">Open Mushaf view →</Link></div></header><section className={styles.structureGrid}><article className={styles.structureCard}><h2>Mushaf page</h2><p>Open any official page from 1 to 604.</p><form className={styles.entryForm} onSubmit={(event) => { event.preventDefault(); router.push(`/quran/mushaf/${Math.min(604, Math.max(1, pageNumber))}`); }}><input aria-label="Mushaf page" max={604} min={1} onChange={(event) => setPageNumber(Number(event.target.value))} type="number" value={pageNumber} /><button>Open</button></form></article><article className={styles.structureCard}><h2>Ayah range</h2><p>Read a focused range using references such as 2:1.</p><form className={styles.entryForm} onSubmit={(event) => { event.preventDefault(); router.push(`/quran/range?from=${encodeURIComponent(rangeFrom)}&to=${encodeURIComponent(rangeTo)}`); }}><input aria-label="First Ayah" onChange={(event) => setRangeFrom(event.target.value)} value={rangeFrom} /><input aria-label="Last Ayah" onChange={(event) => setRangeTo(event.target.value)} value={rangeTo} /><button>Read</button></form></article>{groups.map((group) => <article className={styles.structureCard} key={group.kind}><h2>{group.label}</h2><p>{group.description}</p><div className={styles.numberGrid}>{Array.from({ length: group.count }, (_, index) => <Link href={`/quran/structure/${group.kind}/${index + 1}`} key={index + 1}>{index + 1}</Link>)}</div></article>)}</section></main>;
}

export function QuranRangeReader() {
  const search = useSearchParams();
  const from = search.get("from") ?? "1:1";
  const to = search.get("to") ?? from;
  const { data, error, isLoading } = useSWR<{ items: StructureVerse[] }>(`/api/quran/range?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, fetcher);
  return <main className={styles.page}><header className={styles.header}><div><Link href="/quran/structure">← Quran structure</Link><h1>Ayahs {from}–{to}</h1></div></header>{isLoading ? <p>Loading Quran verses…</p> : null}{error ? <p className={styles.error}>This Quran range is unavailable. Check both Ayah references and try again.</p> : null}<section className={styles.verseList}>{data?.items.map((item) => <article className={styles.verse} key={item.verseKey}><Link href={`/quran/${item.verseKey.replace(":", "/")}`}>{item.verseKey} · Mushaf page {item.pageNumber}</Link><p lang="ar" dir="rtl" translate="no">{item.arabicText}</p></article>)}</section></main>;
}

interface StructureVerse {
  arabicText: string;
  tajweedHtml: string | null;
  verseKey: string;
  pageNumber: number;
}

export function QuranStructureReader({ kind, id }: { kind: string; id: number }) {
  const valid = kind === "juz" || kind === "hizb" || kind === "rub" || kind === "ruku" || kind === "manzil";
  const { data, error, isLoading } = useSWR<{ items: StructureVerse[] }>(valid ? `/api/quran/structure?kind=${kind}&id=${id}` : null, fetcher);
  const [tajweedEnabled, setTajweedEnabled] = useState(false);
  useEffect(() => setTajweedEnabled(localStorage.getItem("af-tajweed") === "true"), []);
  const label = kind === "rub" ? "Rub el Hizb" : kind[0]?.toUpperCase() + kind.slice(1);
  return <main className={styles.page}>
    <header className={styles.header}>
      <div><Link href="/quran/structure">← Quran structure</Link><h1>{label} {id}</h1></div>
      <label className={styles.tajweedToggle}>Tajweed colors <input type="checkbox" checked={tajweedEnabled} onChange={(event) => { setTajweedEnabled(event.target.checked); localStorage.setItem("af-tajweed", String(event.target.checked)); }} /></label>
    </header>
    {isLoading ? <p>Loading Quran verses…</p> : null}
    {error ? <p className={styles.error}>This Quran section is unavailable right now.</p> : null}
    {tajweedEnabled && data ? <div className={styles.tajweedLegend} aria-label="Tajweed color legend"><strong>Tajweed colors</strong><span><i className={styles.tjMadd} />Madd</span><span><i className={styles.tjGhunnah} />Ghunnah</span><span><i className={styles.tjIkhfa} />Ikhfa</span><span><i className={styles.tjIdgham} />Idgham</span><span><i className={styles.tjQalqalah} />Qalqalah</span><span><i className={styles.tjSilent} />Silent letters</span></div> : null}
    <section className={styles.verseList}>{data?.items.map((item) => <article className={styles.verse} key={item.verseKey}><Link href={`/quran/${item.verseKey.replace(":", "/")}`}>{item.verseKey} · Mushaf page {item.pageNumber}</Link>{tajweedEnabled && item.tajweedHtml ? <p className={styles.tajweed} lang="ar" dir="rtl" translate="no" dangerouslySetInnerHTML={{ __html: item.tajweedHtml }} /> : <p lang="ar" dir="rtl" translate="no">{item.arabicText}</p>}</article>)}</section>
  </main>;
}

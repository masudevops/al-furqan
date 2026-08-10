"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import useSWR from "swr";
import styles from "./quran-tools.module.css";

const fetcher = (url: string) => fetch(url).then(async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
});

export function QuranStructureIndex() {
  const groups = [
    { kind: "juz", label: "Juz", count: 30, description: "Thirty equal reading portions." },
    { kind: "hizb", label: "Hizb", count: 60, description: "Sixty half-Juz divisions." },
    { kind: "rub", label: "Rub el Hizb", count: 240, description: "Quarter-Hizb reading markers." },
  ];
  return <main className={styles.page}><header className={styles.header}><div><Link href="/quran">← Quran</Link><h1>Browse by structure</h1><p>Navigate the Quran using authoritative structural metadata from Quran.Foundation.</p></div><div className={styles.tools}><Link href="/quran/mushaf/1">Open Mushaf view →</Link></div></header><section className={styles.structureGrid}>{groups.map((group) => <article className={styles.structureCard} key={group.kind}><h2>{group.label}</h2><p>{group.description}</p><div className={styles.numberGrid}>{Array.from({ length: group.count }, (_, index) => <Link href={`/quran/structure/${group.kind}/${index + 1}`} key={index + 1}>{index + 1}</Link>)}</div></article>)}</section></main>;
}

interface StructureVerse {
  arabicText: string;
  tajweedHtml: string | null;
  verseKey: string;
  pageNumber: number;
}

export function QuranStructureReader({ kind, id }: { kind: string; id: number }) {
  const valid = kind === "juz" || kind === "hizb" || kind === "rub";
  const { data, error, isLoading } = useSWR<{ items: StructureVerse[] }>(valid ? `/api/quran/structure?kind=${kind}&id=${id}` : null, fetcher);
  const [tajweedEnabled, setTajweedEnabled] = useState(false);
  useEffect(() => setTajweedEnabled(localStorage.getItem("af-tajweed") === "true"), []);
  const label = kind === "rub" ? "Rub el Hizb" : kind[0]?.toUpperCase() + kind.slice(1);
  return <main className={styles.page}>
    <header className={styles.header}>
      <div><Link href="/quran/structure">← Quran structure</Link><h1>{label} {id}</h1><p>Quran text and Tajweed annotations are provided directly by Quran.Foundation.</p></div>
      <label className={styles.tajweedToggle}>Tajweed colors <input type="checkbox" checked={tajweedEnabled} onChange={(event) => { setTajweedEnabled(event.target.checked); localStorage.setItem("af-tajweed", String(event.target.checked)); }} /></label>
    </header>
    {isLoading ? <p>Loading Quran verses…</p> : null}
    {error ? <p className={styles.error}>This Quran section is unavailable right now.</p> : null}
    {tajweedEnabled && data ? <div className={styles.tajweedLegend} aria-label="Tajweed color legend"><strong>Tajweed colors</strong><span><i className={styles.tjMadd} />Madd</span><span><i className={styles.tjGhunnah} />Ghunnah</span><span><i className={styles.tjIkhfa} />Ikhfa</span><span><i className={styles.tjIdgham} />Idgham</span><span><i className={styles.tjQalqalah} />Qalqalah</span><span><i className={styles.tjSilent} />Silent letters</span></div> : null}
    <section className={styles.verseList}>{data?.items.map((item) => <article className={styles.verse} key={item.verseKey}><Link href={`/quran/${item.verseKey.replace(":", "/")}`}>{item.verseKey} · Mushaf page {item.pageNumber}</Link>{tajweedEnabled && item.tajweedHtml ? <p className={styles.tajweed} lang="ar" dir="rtl" translate="no" dangerouslySetInnerHTML={{ __html: item.tajweedHtml }} /> : <p lang="ar" dir="rtl" translate="no">{item.arabicText}</p>}</article>)}</section>
  </main>;
}

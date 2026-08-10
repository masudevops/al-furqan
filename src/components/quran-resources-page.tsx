"use client";

import Link from "next/link";
import useSWR from "swr";

import type { QuranResourcePayload } from "@/lib/types";
import styles from "./quran-tools.module.css";

const fetcher = (url: string) => fetch(url).then(async (response) => {
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Quran resources are unavailable.");
  return data;
});

export default function QuranResourcesPage() {
  const { data, error, isLoading } = useSWR<QuranResourcePayload>("/api/quran/resources", fetcher, { revalidateOnFocus: false });
  return <main className={styles.page}><header className={styles.header}><div><Link href="/quran">← Quran</Link><h1>Quran resources</h1><p>Browse the languages, translation and Tafsir sources, recitation styles, and verse media currently available from Quran.Foundation.</p></div></header>{isLoading ? <p>Loading Quran resources…</p> : null}{error ? <p className={styles.error}>Quran resource information is unavailable right now.</p> : null}{data ? <div className={styles.resourceSections}><ResourceSection title={`Translations (${data.translations.length})`} items={data.translations.map((item) => ({ label: item.name, meta: [item.authorName, item.languageName].filter(Boolean).join(" · ") }))} /><ResourceSection title={`Tafsir (${data.tafsirs.length})`} items={data.tafsirs.map((item) => ({ label: item.name, meta: [item.authorName, item.languageName].filter(Boolean).join(" · ") }))} /><ResourceSection title={`Languages (${data.languages.length})`} items={data.languages.map((item) => ({ label: item.nativeName ? `${item.name} — ${item.nativeName}` : item.name, meta: [item.isoCode, item.direction].filter(Boolean).join(" · ") }))} /><ResourceSection title="Recitation styles" items={data.recitationStyles.map((item) => ({ label: item.label, meta: item.key }))} /><ResourceSection title={`Verse media (${data.verseMedia.length})`} items={data.verseMedia.map((item) => ({ label: item.name, meta: [item.authorName, item.languageName].filter(Boolean).join(" · ") }))} /></div> : null}</main>;
}

function ResourceSection({ items, title }: { items: Array<{ label: string; meta: string }>; title: string }) {
  return <section className={styles.resourceSection}><h2>{title}</h2>{items.length ? <ul>{items.map((item, index) => <li key={`${item.label}-${index}`}><strong>{item.label}</strong>{item.meta ? <small>{item.meta}</small> : null}</li>)}</ul> : <p>No resources were returned for this category.</p>}</section>;
}

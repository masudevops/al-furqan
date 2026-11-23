"use client";

import Link from "next/link";
import { FormEvent, Fragment, useEffect, useState } from "react";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";

import ContentState from "./content-state";
import { Button, Icon, Page, PageHeader } from "@/components/ui";
import type { SearchItem } from "@/lib/types";
import styles from "./quran-search.module.css";

type SearchPayload = { error: string | null; navigationItems: SearchItem[]; page: number; pages: number; query: string; total: number; verseItems: SearchItem[] };

const EXAMPLES = ["mercy", "patience", "Ayat al-Kursi", "2:255", "الرحمن", "Ya-Sin"];
const fetcher = async (url: string) => { const response = await fetch(url); const value = await response.json(); if (!response.ok) throw value; return value as SearchPayload; };
const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Marks the query's words in a verified translation; matching is ours, the text is the translation's own.
function Highlighted({ text, query }: { text: string; query: string }) {
  const words = query.split(/\s+/).filter((word) => word.length > 1 && !/[؀-ۿ]/.test(word)).map(escapeRegExp);
  if (!words.length) return <>{text}</>;
  const pattern = new RegExp(`(${words.join("|")})`, "gi");
  return <>{text.split(pattern).map((part, index) => index % 2 ? <mark key={index}>{part}</mark> : <Fragment key={index}>{part}</Fragment>)}</>;
}


const queryFromLocation = () => { try { return new URLSearchParams(window.location.search).get("q")?.trim() ?? ""; } catch { return ""; } };

type HadithResult = { arabic: string; authenticityContext: string; collectionId: string; collectionName: string; grades: unknown[]; hadithNumber: number; text: string };
type DuaResult = { id: number; title: string; category: string; categoryName: string };
type ListPayload<T> = { error: string | null; items: T[]; total: number };
type Scope = "quran" | "hadith" | "dua";
const listFetcher = async <T,>(url: string) => { const response = await fetch(url); const value = await response.json(); if (!response.ok) throw value; return value as ListPayload<T>; };

function QuranResults({ query }: { query: string }) {
  const { data, error, isLoading, isValidating, size, setSize } = useSWRInfinite<SearchPayload>(
    (index, previous) => previous && previous.page >= previous.pages ? null : `/api/search?query=${encodeURIComponent(query)}&page=${index + 1}`,
    fetcher,
    { revalidateFirstPage: false, revalidateOnFocus: false },
  );
  const first = data?.[0];
  const failure = error ? "Quran search is unavailable right now." : first?.error;
  const surahs = first?.navigationItems ?? [];
  const verses = data?.flatMap((page) => page.verseItems) ?? [];
  const last = data?.at(-1);
  const hasMore = Boolean(last && last.page < last.pages);
  const translationName = verses.find((item) => item.translationName)?.translationName;
  if (failure) return <ContentState kind="error" message={failure} />;
  if (isLoading && !data) return <div className={styles.loading} role="status" aria-label="Searching"><i /><i /><i /></div>;
  return <section aria-live="polite" aria-busy={isValidating}>
    <p className={styles.summary}>{first?.total ? `${first.total.toLocaleString()} Quran result${first.total === 1 ? "" : "s"} for “${query}”` : `No Quran results for “${query}”. Try another word, a Surah name or a reference like 2:255.`}</p>
    {surahs.length ? <div className={styles.surahs}>{surahs.map((item) => item.readerUrl ? <Link key={item.readerUrl} href={item.readerUrl} className={styles.surah}><span><strong>{item.label}</strong>{item.subtitle ? <b lang="ar" dir="rtl" translate="no">{item.subtitle}</b> : null}</span><Icon name="arrowRight" /></Link> : null)}</div> : null}
    <ol className={styles.results}>
      {verses.map((item) => <li key={item.verseKey}>
        <Link href={item.readerUrl ?? "/quran"} className={styles.result}>
          <span className={styles.key}>{item.verseKey}<Icon name="arrowRight" /></span>
          {item.arabicText ? <p className={styles.arabic} lang="ar" dir="rtl" translate="no">{item.arabicText}</p> : null}
          {item.text ? <p className={styles.translation} translate="no"><Highlighted text={item.text} query={query} /></p> : null}
        </Link>
      </li>)}
    </ol>
    {hasMore ? <div className={styles.more}><Button onClick={() => setSize(size + 1)} disabled={isValidating}>{isValidating ? "Loading…" : "Show more results"}</Button></div> : null}
    {verses.length ? <p className={styles.source}>Search by Quran.Foundation · Translation: {translationName ?? "verified English translation"}</p> : null}
  </section>;
}

function HadithResults({ query, result }: { query: string; result: { data?: ListPayload<HadithResult>; error?: unknown } }) {
  if (result.error) return <ContentState kind="error" message="Hadith search is unavailable right now. No substitute content has been used." />;
  if (!result.data) return <div className={styles.loading} role="status" aria-label="Searching Hadith"><i /><i /></div>;
  const { items } = result.data;
  return <section aria-live="polite">
    <p className={styles.summary}>{items.length ? `${items.length} Hadith for “${query}”${items.length >= 30 ? " (first 30)" : ""}` : `No Hadith matched “${query}”.`}</p>
    <ol className={styles.results}>{items.map((item) => <li key={`${item.collectionId}-${item.hadithNumber}`}>
      <Link href={`/sunnah/${item.collectionId}/${item.hadithNumber}`} className={styles.result}>
        <span className={styles.key}>{item.collectionName} {item.hadithNumber}{item.grades.length ? <span className={styles.grade}>{item.authenticityContext}</span> : null}<Icon name="arrowRight" /></span>
        <p className={`${styles.translation} ${styles.clamp}`} translate="no"><Highlighted text={item.text} query={query} /></p>
      </Link>
    </li>)}</ol>
    {items.length ? <p className={styles.source}>Hadith search by UmmahAPI · grades as the source reports them</p> : null}
  </section>;
}

function DuaResults({ query, result }: { query: string; result: { data?: ListPayload<DuaResult>; error?: unknown } }) {
  if (result.error) return <ContentState kind="error" message="Dua search is unavailable right now." />;
  if (!result.data) return <div className={styles.loading} role="status" aria-label="Searching Dua"><i /></div>;
  const { items } = result.data;
  return <section aria-live="polite">
    <p className={styles.summary}>{items.length ? `${items.length} Dua title${items.length === 1 ? "" : "s"} matching “${query}”` : `No Dua titles matched “${query}”. Dua search looks at titles and categories.`}</p>
    <ol className={styles.results}>{items.map((item) => <li key={`${item.category}-${item.id}`}>
      <Link href={`/dua/${item.category}/${item.id}`} className={`${styles.result} ${styles.duaResult}`}>
        <span><strong><Highlighted text={item.title} query={query} /></strong><small>{item.categoryName}</small></span><Icon name="arrowRight" />
      </Link>
    </li>)}</ol>
  </section>;
}

export default function QuranSearch() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<Scope>("quran");
  useEffect(() => {
    const sync = () => { const value = queryFromLocation(); setInput(value); setQuery(value); };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  // Hadith and Dua are searched alongside the Quran so each tab can show its count.
  const hadith = useSWR<ListPayload<HadithResult>>(query ? `/api/hadith/search?query=${encodeURIComponent(query)}` : null, listFetcher, { revalidateOnFocus: false });
  const dua = useSWR<ListPayload<DuaResult>>(query ? `/api/dua/search?query=${encodeURIComponent(query)}` : null, listFetcher, { revalidateOnFocus: false });
  const quranTotal = useSWRInfinite<SearchPayload>((index) => query && index === 0 ? `/api/search?query=${encodeURIComponent(query)}&page=1` : null, fetcher, { revalidateOnFocus: false, revalidateFirstPage: false }).data?.[0]?.total;

  const run = (value: string) => {
    const next = value.trim();
    setInput(next);
    setQuery(next);
    setScope("quran");
    // The query lives in the address so a search can be shared, bookmarked and restored with Back.
    window.history.pushState(null, "", next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  };
  const submit = (event: FormEvent) => { event.preventDefault(); run(input); };
  const count = (value: number | undefined) => value === undefined ? "" : ` ${value >= 30 && value !== quranTotal ? "30+" : value.toLocaleString()}`;
  const tabs: Array<[Scope, string, number | undefined]> = [["quran", "Quran", quranTotal], ["hadith", "Hadith", hadith.data?.items.length], ["dua", "Dua", dua.data?.items.length]];

  return <Page narrow>
    <PageHeader kicker="Search" kickerIcon="search" title="Search" description="Search the Quran, Hadith and Dua by word or phrase, in English or Arabic, or open a Surah or Ayah by name or reference." />
    <form className={styles.search} role="search" onSubmit={submit}>
      <Icon name="search" />
      <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Try mercy, 2:255 or an Arabic word" aria-label="Search the Quran, Hadith and Dua" type="search" enterKeyHint="search" autoFocus={!query} />
      {input ? <button type="button" className={styles.clear} onClick={() => run("")}>Clear</button> : null}
      <button className={styles.submit} disabled={!input.trim()}>Search</button>
    </form>

    {!query ? <div className={styles.examples}><p>Try</p>{EXAMPLES.map((example) => <button type="button" key={example} onClick={() => run(example)} lang={/[\u0600-\u06FF]/.test(example) ? "ar" : undefined}>{example}</button>)}</div> : <>
      <div className={styles.scopes} role="tablist" aria-label="Search in">{tabs.map(([value, label, total]) => <button type="button" role="tab" key={value} id={`scope-${value}`} aria-selected={scope === value} aria-controls="search-results" onClick={() => setScope(value)}>{label}<span>{count(total)}</span></button>)}</div>
      <div id="search-results" role="tabpanel" aria-labelledby={`scope-${scope}`}>
        {scope === "quran" ? <QuranResults query={query} /> : scope === "hadith" ? <HadithResults query={query} result={hadith} /> : <DuaResults query={query} result={dua} />}
      </div>
    </>}
  </Page>;
}

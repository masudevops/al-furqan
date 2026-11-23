"use client";

import Link from "next/link";
import { FormEvent, Fragment, useEffect, useState } from "react";
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

export default function QuranSearch() {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  useEffect(() => {
    const sync = () => { const value = queryFromLocation(); setInput(value); setQuery(value); };
    sync();
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);
  const { data, error, isLoading, isValidating, size, setSize } = useSWRInfinite<SearchPayload>(
    (index, previous) => !query || (previous && previous.page >= previous.pages) ? null : `/api/search?query=${encodeURIComponent(query)}&page=${index + 1}`,
    fetcher,
    { revalidateFirstPage: false, revalidateOnFocus: false },
  );

  const run = (value: string) => {
    const next = value.trim();
    setInput(next);
    setQuery(next);
    // The query lives in the address so a search can be shared, bookmarked and restored with Back.
    window.history.pushState(null, "", next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  };
  const submit = (event: FormEvent) => { event.preventDefault(); run(input); };

  const first = data?.[0];
  const failure = error ? "Quran search is unavailable right now." : first?.error;
  const surahs = first?.navigationItems ?? [];
  const verses = data?.flatMap((page) => page.verseItems) ?? [];
  const last = data?.at(-1);
  const hasMore = Boolean(last && last.page < last.pages);
  const translationName = verses.find((item) => item.translationName)?.translationName;

  return <Page narrow>
    <PageHeader kicker="Quran search" kickerIcon="search" title="Find a verse" description="Search by word, phrase, Surah name or reference, in English or Arabic." />
    <form className={styles.search} role="search" onSubmit={submit}>
      <Icon name="search" />
      <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="Try mercy, 2:255 or an Arabic word" aria-label="Search the Quran" type="search" enterKeyHint="search" autoFocus={!query} />
      {input ? <button type="button" className={styles.clear} onClick={() => run("")}>Clear</button> : null}
      <button className={styles.submit} disabled={!input.trim()}>Search</button>
    </form>

    {!query ? <div className={styles.examples}><p>Try</p>{EXAMPLES.map((example) => <button type="button" key={example} onClick={() => run(example)} lang={/[؀-ۿ]/.test(example) ? "ar" : undefined}>{example}</button>)}</div>
      : failure ? <ContentState kind="error" message={failure} />
      : isLoading && !data ? <div className={styles.loading} role="status" aria-label="Searching"><i /><i /><i /></div>
      : <section aria-live="polite" aria-busy={isValidating}>
        <p className={styles.summary}>{first?.total ? `${first.total.toLocaleString()} result${first.total === 1 ? "" : "s"} for “${query}”` : `No results for “${query}”. Try another word, a Surah name or a reference like 2:255.`}</p>
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
      </section>}
  </Page>;
}

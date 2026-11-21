"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, memo, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import ContentState from "./content-state";
import { Badge, ButtonLink, Chip, Icon, IconButton, Page, PageHeader } from "@/components/ui";
import { hasLocalBookmark, readLocalBookmarks, toggleLocalBookmark } from "@/lib/local-bookmarks";
import styles from "./hadith-browser.module.css";

type Collection = { id: string; name: string; sections: Array<{ id: string; name: string }>; total: number };
type Hadith = { arabic: string; authenticityContext: string; bookNumber: number; collectionId: string; collectionName: string; grades: Array<{ grade: string; scholar: string }>; hadithNumber: number; narrator: string; referenceNumber: number; sectionName: string; text: string };
type HadithPage = { items: Hadith[]; page: number; pages: number; total: number };
type Bookmarks = ReturnType<typeof readLocalBookmarks>;

const ARABIC_KEY = "af-hadith-arabic";
const fetcher = async (url: string) => { const response = await fetch(url); const value = await response.json(); if (!response.ok) throw value; return value; };
const hadithPath = (item: Pick<Hadith, "collectionId" | "hadithNumber">) => `/sunnah/${item.collectionId}/${item.hadithNumber}`;
const bookmarkFor = (item: Hadith) => ({ id: `sunnah:${item.collectionId}:${item.hadithNumber}`, label: `${item.collectionName} ${item.hadithNumber}`, reference: `${item.collectionName}, Hadith ${item.hadithNumber}`, type: "sunnah" as const, url: hadithPath(item) });

// Arabic is shown by default; the choice is remembered on this device.
function useArabicPreference() {
  const [showArabic, setShowArabic] = useState(true);
  useEffect(() => { try { setShowArabic(localStorage.getItem(ARABIC_KEY) !== "false"); } catch {} }, []);
  const change = (value: boolean) => { setShowArabic(value); try { localStorage.setItem(ARABIC_KEY, String(value)); } catch {} };
  return [showArabic, change] as const;
}

function useShareLink() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (path: string) => {
    try { await navigator.clipboard.writeText(`${location.origin}${path}`); setCopied(path); window.setTimeout(() => setCopied((current) => current === path ? null : current), 1800); } catch {}
  };
  const share = async (path: string, title: string) => {
    if (!navigator.share) return copy(path);
    try { await navigator.share({ title, url: `${location.origin}${path}` }); } catch {}
  };
  return { copied, copy, share };
}

// Grades are shown exactly as the source reports them; an absent grade is stated, never inferred.
function Grade({ item }: { item: Hadith }) {
  return item.grades.length ? <Badge>{item.authenticityContext}</Badge> : <span className={styles.noGrade}>No grade supplied by source</span>;
}

type HadithItemProps = { item: Hadith; showArabic: boolean; saved: boolean; copied: boolean; onBookmark: (item: Hadith) => void; onCopy: (path: string) => void; onShare: (path: string, title: string) => void };

const HadithItem = memo(function HadithItem({ item, showArabic, saved, copied, onBookmark, onCopy, onShare }: HadithItemProps) {
  const [expanded, setExpanded] = useState(false);
  const path = hadithPath(item);
  const label = `${item.collectionName}, Hadith ${item.hadithNumber}`;
  return <article className={styles.item} aria-label={label}>
    <div className={styles.itemBar}>
      <div className={styles.itemMeta}><Link className={styles.reference} href={path}>{item.collectionName} {item.hadithNumber}</Link><Grade item={item} /></div>
      <div className={styles.itemActions}>
        {copied ? <span className={styles.copied} role="status">Link copied</span> : null}
        <IconButton className={styles.action} icon="copy" label={`Copy link to ${label}`} onClick={() => onCopy(path)} />
        <IconButton className={`${styles.action} ${styles.wideOnly}`} icon="share" label={`Share ${label}`} onClick={() => onShare(path, label)} />
        <IconButton className={`${styles.action} ${styles.bookmark}`} icon="bookmark" label={`${saved ? "Remove bookmark from" : "Bookmark"} ${label}`} aria-pressed={saved} onClick={() => onBookmark(item)} />
      </div>
    </div>
    <div className={expanded ? styles.expanded : styles.clamped}>
      {showArabic ? <p className={styles.arabic} lang="ar" dir="rtl" translate="no">{item.arabic}</p> : null}
      <p className={styles.english} translate="no">{item.text}</p>
    </div>
    <div className={styles.itemFooter}>
      <button type="button" className={styles.textButton} aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>{expanded ? "Show less" : "Read more"}</button>
      <Link className={styles.textButton} href={path}>Open Hadith<Icon name="arrowRight" /></Link>
    </div>
  </article>;
});

function HadithDetail({ collectionId, hadithNumber, initialItem, total }: { collectionId: string; hadithNumber: string; initialItem?: Hadith | null; total?: number }) {
  const [showArabic, setShowArabic] = useArabicPreference();
  const [bookmarks, setBookmarks] = useState<Bookmarks>(readLocalBookmarks);
  useEffect(() => setBookmarks(readLocalBookmarks()), []);
  const { copied, copy, share } = useShareLink();
  const { data, error } = useSWR<{ item: Hadith }>(`/api/hadith/${collectionId}/${hadithNumber}`, fetcher, { fallbackData: initialItem ? { item: initialItem } : undefined, revalidateOnFocus: false });
  const item = data?.item;
  const number = Number(hadithNumber);
  const neighbours = <nav className={styles.pager} aria-label="Neighbouring Hadith">
    {number > 1 ? <ButtonLink href={`/sunnah/${collectionId}/${number - 1}`} icon="back">Hadith {number - 1}</ButtonLink> : <span />}
    {!total || number < total ? <ButtonLink href={`/sunnah/${collectionId}/${number + 1}`} trailingIcon="arrowRight">Hadith {number + 1}</ButtonLink> : null}
  </nav>;
  if (error) {
    const missing = (error as { item?: unknown; error?: string })?.error === "Hadith not found.";
    return <Page narrow>
      <PageHeader back={{ href: `/sunnah/${collectionId}`, label: "Collection" }} kicker="Hadith" kickerIcon="scroll" title={`Hadith ${hadithNumber}`} />
      {missing ? <ContentState kind="empty" title="No text for this number" message="The source dataset has no text recorded under this Hadith number, so nothing is shown. Try a neighbouring number." /> : <ContentState kind="error" message="This Hadith record is unavailable right now. No substitute content has been used." />}
      {neighbours}
    </Page>;
  }
  if (!item) return <Page narrow><ContentState message="Loading Hadith…" /></Page>;
  const path = hadithPath(item);
  const label = `${item.collectionName}, Hadith ${item.hadithNumber}`;
  const saved = hasLocalBookmark(bookmarks, bookmarkFor(item).id);
  return <Page narrow>
    <PageHeader back={{ href: `/sunnah/${item.collectionId}`, label: item.collectionName }} kicker="Hadith" kickerIcon="scroll" title={`${item.collectionName} ${item.hadithNumber}`}
      actions={<>
        <IconButton icon="copy" label={`Copy link to ${label}`} onClick={() => copy(path)} />
        <IconButton icon="share" label={`Share ${label}`} onClick={() => share(path, label)} />
        <IconButton className={styles.bookmark} icon="bookmark" label={`${saved ? "Remove bookmark from" : "Bookmark"} ${label}`} aria-pressed={saved} onClick={() => setBookmarks(toggleLocalBookmark(bookmarkFor(item)))} />
      </>} />
    {copied ? <p className={styles.copied} role="status">Link copied</p> : null}
    <article className={styles.detail}>
      <div className={styles.detailBar}><Grade item={item} /><label className={styles.toggle}><input type="checkbox" role="switch" checked={showArabic} onChange={(event) => setShowArabic(event.target.checked)} />Arabic</label></div>
      {showArabic ? <p className={`${styles.arabic} ${styles.detailArabic}`} lang="ar" dir="rtl" translate="no">{item.arabic}</p> : null}
      <p className={`${styles.english} ${styles.detailEnglish}`} translate="no">{item.text}</p>
      <p className={styles.source}>Source: UmmahAPI · {item.collectionName}, Hadith {item.hadithNumber}{item.grades.length ? " · Grade as reported; grading authority not identified by the provider" : ""}</p>
    </article>
    {neighbours}
  </Page>;
}

export default function HadithBrowser({ collectionId, hadithNumber, initialCatalog, initialItem, initialList }: { collectionId?: string; hadithNumber?: string; initialCatalog?: Collection[]; initialItem?: Hadith | null; initialList?: HadithPage }) {
  const router = useRouter();
  const { data: catalog, error: catalogError } = useSWR<{ items: Collection[] }>("/api/hadith/collections", fetcher, { fallbackData: initialCatalog ? { items: initialCatalog } : undefined, revalidateOnFocus: false });
  const collection = collectionId ?? "bukhari";
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [jumpError, setJumpError] = useState<string | null>(null);
  const [showArabic, setShowArabic] = useArabicPreference();
  const [bookmarks, setBookmarks] = useState<Bookmarks>(readLocalBookmarks);
  useEffect(() => setBookmarks(readLocalBookmarks()), []);
  const { copied, copy, share } = useShareLink();
  const selected = catalog?.items.find((item) => item.id === collection);
  const listUrl = !hadithNumber && selected ? `/api/hadith/${collection}?${query ? `query=${encodeURIComponent(query)}` : `page=${page}`}` : null;
  const { data: list, error: listError, isLoading } = useSWR<HadithPage>(listUrl, fetcher, { fallbackData: page === 1 && !query ? initialList : undefined, keepPreviousData: true, revalidateOnFocus: false });
  const savedIds = useMemo(() => new Set(bookmarks.map((bookmark) => bookmark.id)), [bookmarks]);
  const onBookmark = useMemo(() => (item: Hadith) => setBookmarks(toggleLocalBookmark(bookmarkFor(item))), []);

  if (hadithNumber && collectionId) return <HadithDetail collectionId={collectionId} hadithNumber={hadithNumber} initialItem={initialItem} total={selected?.total} />;

  const search = (event: FormEvent) => { event.preventDefault(); setQuery(queryInput.trim()); setPage(1); };
  const jump = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(new FormData(event.currentTarget).get("number"));
    if (!Number.isInteger(value) || value < 1 || (selected && value > selected.total)) { setJumpError(`Enter a number from 1 to ${selected?.total.toLocaleString() ?? "the collection size"}.`); return; }
    setJumpError(null);
    router.push(`/sunnah/${collection}/${value}`);
  };
  const changePage = (next: number) => { setPage(next); window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); };

  return <Page>
    <PageHeader kicker="Hadith collections" kickerIcon="scroll" title="Sunnah library" description="Browse major Hadith collections in Arabic and English, with the grade each source reports." />
    {catalogError ? <ContentState kind="error" message="Sunnah collections are unavailable right now. No substitute content has been used." /> : <>
      <nav className={styles.collections} aria-label="Hadith collections">
        {catalog?.items.map((entry) => <Link key={entry.id} href={`/sunnah/${entry.id}`} className={styles.collection} aria-current={entry.id === collection ? "page" : undefined}><strong>{entry.name}</strong><span>{entry.total.toLocaleString()} Hadith</span></Link>)}
      </nav>
      <div className={styles.toolbar}>
        <form className={styles.search} role="search" onSubmit={search}>
          <Icon name="search" />
          <input value={queryInput} onChange={(event) => setQueryInput(event.target.value)} placeholder={`Search ${selected?.name ?? "this collection"} in Arabic or English`} aria-label="Search Hadith" type="search" />
          {query ? <button type="button" className={styles.clear} onClick={() => { setQuery(""); setQueryInput(""); }}>Clear</button> : null}
          <button className={styles.searchButton}>Search</button>
        </form>
        <form className={styles.jump} onSubmit={jump}>
          <label htmlFor="hadith-number">Go to #</label>
          <input id="hadith-number" name="number" type="number" inputMode="numeric" min={1} max={selected?.total} placeholder="1" />
          <button aria-label="Open Hadith number">Go</button>
        </form>
        <Chip icon="quran" aria-pressed={showArabic} onClick={() => setShowArabic(!showArabic)}>Arabic</Chip>
      </div>
      {jumpError ? <p className={styles.error} role="alert">{jumpError}</p> : null}
      {query && list ? <p className={styles.summary}>{list.total.toLocaleString()} result{list.total === 1 ? "" : "s"} for “{query}” in {selected?.name}</p> : null}
      {listError ? <ContentState kind="error" message="Sunnah content is unavailable right now. No substitute content has been used." />
        : isLoading && !list ? <div className={styles.loading} role="status" aria-label="Loading Hadith"><i /><i /><i /></div>
        : <>
          <section className={styles.list} aria-label={`${selected?.name ?? "Hadith"} list`} aria-busy={isLoading}>
            {list?.items.map((entry) => <HadithItem key={`${entry.collectionId}-${entry.hadithNumber}`} item={entry} showArabic={showArabic} saved={savedIds.has(bookmarkFor(entry).id)} copied={copied === hadithPath(entry)} onBookmark={onBookmark} onCopy={copy} onShare={share} />)}
            {list?.items.length === 0 ? <ContentState kind="empty" message="No complete sourced records matched. Try another word or phrase." /> : null}
          </section>
          {!query && list && list.pages > 1 ? <nav className={styles.pager} aria-label="Hadith pages">
            <button type="button" className={styles.pageButton} disabled={list.page <= 1} onClick={() => changePage(Math.max(1, list.page - 1))}><Icon name="back" />Previous</button>
            <span>Page {list.page.toLocaleString()} of {list.pages.toLocaleString()}</span>
            <button type="button" className={styles.pageButton} disabled={list.page >= list.pages} onClick={() => changePage(list.page + 1)}>Next<Icon name="arrowRight" /></button>
          </nav> : null}
        </>}
    </>}
  </Page>;
}

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
type Book = { number: number; name: string; count: number };
type BookList = { books: Book[]; unassigned: number };
type BookPage = HadithPage & { book: Book };
type Bookmarks = ReturnType<typeof readLocalBookmarks>;

const ARABIC_KEY = "af-hadith-arabic";
const fetcher = async (url: string) => { const response = await fetch(url); const value = await response.json(); if (!response.ok) throw value; return value; };
const hadithPath = (item: Pick<Hadith, "collectionId" | "hadithNumber">) => `/sunnah/${item.collectionId}/${item.hadithNumber}`;
const bookPath = (collectionId: string, book: number) => `/sunnah/${collectionId}/book/${book}`;
// Sub-numbered records (e.g. 2787.2) have no page of their own: Hadith pages use whole numbers.
const linkable = (item: Hadith) => Number.isInteger(item.hadithNumber);
const PROVIDER_AUTHORITY = "Authority not identified by provider";
const COLLECTION_AUTHORITY = "Collection grade reported by UmmahAPI";
const scrollToTop = () => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
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
  if (!item.grades.length) return <span className={styles.noGrade}>No grade supplied by source</span>;
  const [first, ...rest] = item.grades;
  if (first.scholar === PROVIDER_AUTHORITY) return <Badge>{item.authenticityContext}</Badge>;
  if (first.scholar === COLLECTION_AUTHORITY) return <span className={styles.grade} title={item.authenticityContext}><Badge>{first.grade}</Badge><span>collection grade</span></span>;
  return <span className={styles.grade} title={item.authenticityContext}><Badge>{first.grade}</Badge><span>{first.scholar}{rest.length ? ` +${rest.length} more` : ""}</span></span>;
}

// Every grade the source names, with its scholar.
function GradeList({ item }: { item: Hadith }) {
  if (item.grades.length < 2 || [PROVIDER_AUTHORITY, COLLECTION_AUTHORITY].includes(item.grades[0].scholar)) return null;
  return <ul className={styles.gradeList} aria-label="Grades reported by the source">{item.grades.map((grade) => <li key={grade.scholar}><strong>{grade.grade}</strong> {grade.scholar}</li>)}</ul>;
}

function Pager({ label, page, pages, onChange }: { label: string; page: number; pages: number; onChange: (page: number) => void }) {
  if (pages <= 1) return null;
  return <nav className={styles.pager} aria-label={label}>
    <button type="button" className={styles.pageButton} disabled={page <= 1} onClick={() => onChange(Math.max(1, page - 1))}><Icon name="back" />Previous</button>
    <span>Page {page.toLocaleString()} of {pages.toLocaleString()}</span>
    <button type="button" className={styles.pageButton} disabled={page >= pages} onClick={() => onChange(page + 1)}>Next<Icon name="arrowRight" /></button>
  </nav>;
}

type HadithItemProps = { item: Hadith; showArabic: boolean; saved: boolean; copied: boolean; onBookmark: (item: Hadith) => void; onCopy: (path: string) => void; onShare: (path: string, title: string) => void };

const HadithItem = memo(function HadithItem({ item, showArabic, saved, copied, onBookmark, onCopy, onShare }: HadithItemProps) {
  const [expanded, setExpanded] = useState(false);
  const path = hadithPath(item);
  const label = `${item.collectionName}, Hadith ${item.hadithNumber}`;
  const hasPage = linkable(item);
  return <article className={styles.item} aria-label={label}>
    <div className={styles.itemBar}>
      <div className={styles.itemMeta}>{hasPage ? <Link className={styles.reference} href={path}>{item.collectionName} {item.hadithNumber}</Link> : <span className={styles.reference}>{item.collectionName} {item.hadithNumber}</span>}<Grade item={item} /></div>
      {hasPage ? <div className={styles.itemActions}>
        {copied ? <span className={styles.copied} role="status">Link copied</span> : null}
        <IconButton className={styles.action} icon="copy" label={`Copy link to ${label}`} onClick={() => onCopy(path)} />
        <IconButton className={`${styles.action} ${styles.wideOnly}`} icon="share" label={`Share ${label}`} onClick={() => onShare(path, label)} />
        <IconButton className={`${styles.action} ${styles.bookmark}`} icon="bookmark" label={`${saved ? "Remove bookmark from" : "Bookmark"} ${label}`} aria-pressed={saved} onClick={() => onBookmark(item)} />
      </div> : null}
    </div>
    <div className={expanded ? styles.expanded : styles.clamped}>
      {showArabic ? <p className={styles.arabic} lang="ar" dir="rtl" translate="no">{item.arabic}</p> : null}
      <p className={styles.english} translate="no">{item.text}</p>
      {expanded ? <GradeList item={item} /> : null}
    </div>
    <div className={styles.itemFooter}>
      <button type="button" className={styles.textButton} aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>{expanded ? "Show less" : "Read more"}</button>
      {hasPage ? <Link className={styles.textButton} href={path}>Open Hadith<Icon name="arrowRight" /></Link> : null}
    </div>
  </article>;
});

function HadithDetail({ collectionId, hadithNumber, book, initialItem, total }: { collectionId: string; hadithNumber: string; book?: Book | null; initialItem?: Hadith | null; total?: number }) {
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
    <PageHeader back={book ? { href: bookPath(item.collectionId, book.number), label: book.name } : { href: `/sunnah/${item.collectionId}`, label: item.collectionName }} kicker={book ? `Book ${book.number} · ${book.name}` : "Hadith"} kickerIcon="scroll" title={`${item.collectionName} ${item.hadithNumber}`}
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

function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<Bookmarks>(readLocalBookmarks);
  useEffect(() => setBookmarks(readLocalBookmarks()), []);
  const savedIds = useMemo(() => new Set(bookmarks.map((bookmark) => bookmark.id)), [bookmarks]);
  const onBookmark = useMemo(() => (item: Hadith) => setBookmarks(toggleLocalBookmark(bookmarkFor(item))), []);
  return { savedIds, onBookmark };
}

function HadithList({ items, label, busy, showArabic }: { items: Hadith[]; label: string; busy: boolean; showArabic: boolean }) {
  const { savedIds, onBookmark } = useBookmarks();
  const { copied, copy, share } = useShareLink();
  return <section className={styles.list} aria-label={label} aria-busy={busy}>
    {items.map((entry) => <HadithItem key={`${entry.collectionId}-${entry.hadithNumber}`} item={entry} showArabic={showArabic} saved={savedIds.has(bookmarkFor(entry).id)} copied={copied === hadithPath(entry)} onBookmark={onBookmark} onCopy={copy} onShare={share} />)}
  </section>;
}

// The collection's own books, as named by the source, with a filter for long lists.
function BooksPanel({ collectionId, books }: { collectionId: string; books: BookList }) {
  const [filter, setFilter] = useState("");
  const needle = filter.trim().toLowerCase();
  const shown = needle ? books.books.filter((book) => book.name.toLowerCase().includes(needle) || String(book.number) === needle) : books.books;
  return <section aria-labelledby="books-title">
    <div className={styles.booksHead}>
      <h2 id="books-title" className={styles.booksTitle}>{books.books.length} books</h2>
      <label className={styles.filter}><Icon name="search" /><input type="search" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Filter books" aria-label="Filter books by name or number" /></label>
    </div>
    {shown.length ? <ol className={styles.books}>
      {shown.map((book) => <li key={book.number}><Link href={bookPath(collectionId, book.number)}>
        <span className={styles.bookNumber}>{book.number}</span>
        <span className={styles.bookText}><strong>{book.name}</strong><span>{book.count.toLocaleString()} Hadith</span></span>
        <Icon name="arrowRight" />
      </Link></li>)}
    </ol> : <ContentState kind="empty" message={`No book name contains “${filter.trim()}”. Search Hadith text with the search box above.`} />}
    {books.unassigned ? <p className={styles.summary}>{books.unassigned.toLocaleString()} Hadith have no book in the source and are listed only under All Hadith.</p> : null}
  </section>;
}

function BookView({ collectionId, bookNumber, books, collectionName, initialBook }: { collectionId: string; bookNumber: number; books: BookList; collectionName: string; initialBook?: BookPage }) {
  const [page, setPage] = useState(1);
  const [showArabic, setShowArabic] = useArabicPreference();
  const { data, error, isLoading } = useSWR<BookPage>(`/api/hadith/${collectionId}/books/${bookNumber}?page=${page}`, fetcher, { fallbackData: page === 1 ? initialBook : undefined, keepPreviousData: true, revalidateOnFocus: false });
  const position = books.books.findIndex((entry) => entry.number === bookNumber);
  const book = books.books[position];
  const previous = books.books[position - 1];
  const next = books.books[position + 1];
  const changePage = (value: number) => { setPage(value); scrollToTop(); };
  return <Page>
    <PageHeader back={{ href: `/sunnah/${collectionId}`, label: collectionName }} kicker={`Book ${book.number} of ${books.books.length}`} kickerIcon="scroll" title={book.name} description={`${collectionName} · ${book.count.toLocaleString()} Hadith`}
      actions={<Chip icon="quran" aria-pressed={showArabic} onClick={() => setShowArabic(!showArabic)}>Arabic</Chip>} />
    {error ? <ContentState kind="error" message="This book is unavailable right now. No substitute content has been used." />
      : !data ? <div className={styles.loading} role="status" aria-label="Loading Hadith"><i /><i /><i /></div>
      : <>
        <HadithList items={data.items} label={`${book.name} Hadith`} busy={isLoading} showArabic={showArabic} />
        {data.items.length === 0 ? <ContentState kind="empty" message="The source has no complete Arabic and English records for this book." /> : null}
        <Pager label={`Pages of ${book.name}`} page={data.page} pages={data.pages} onChange={changePage} />
      </>}
    <nav className={styles.bookNav} aria-label="Neighbouring books">
      {previous ? <Link href={bookPath(collectionId, previous.number)}><span><Icon name="back" />Book {previous.number}</span><strong>{previous.name}</strong></Link> : <span />}
      {next ? <Link className={styles.bookNext} href={bookPath(collectionId, next.number)}><span>Book {next.number}<Icon name="arrowRight" /></span><strong>{next.name}</strong></Link> : null}
    </nav>
    <p className={styles.source}>Source: fawazahmed0/hadith-api (the dataset UmmahAPI serves) · book names and grades as the source gives them.</p>
  </Page>;
}

export default function HadithBrowser({ collectionId, hadithNumber, bookNumber, book, books, initialBook, initialCatalog, initialItem, initialList }: { collectionId?: string; hadithNumber?: string; bookNumber?: number; book?: Book | null; books?: BookList | null; initialBook?: BookPage; initialCatalog?: Collection[]; initialItem?: Hadith | null; initialList?: HadithPage }) {
  const router = useRouter();
  const { data: catalog, error: catalogError } = useSWR<{ items: Collection[] }>("/api/hadith/collections", fetcher, { fallbackData: initialCatalog ? { items: initialCatalog } : undefined, revalidateOnFocus: false });
  const collection = collectionId ?? "bukhari";
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [jumpError, setJumpError] = useState<string | null>(null);
  const [view, setView] = useState<"books" | "all">("books");
  const [showArabic, setShowArabic] = useArabicPreference();
  const selected = catalog?.items.find((item) => item.id === collection);
  const showBooks = Boolean(books?.books.length) && view === "books" && !query;
  const listUrl = !hadithNumber && !bookNumber && !showBooks && selected ? `/api/hadith/${collection}?${query ? `query=${encodeURIComponent(query)}` : `page=${page}`}` : null;
  const { data: list, error: listError, isLoading } = useSWR<HadithPage>(listUrl, fetcher, { fallbackData: page === 1 && !query ? initialList : undefined, keepPreviousData: true, revalidateOnFocus: false });

  if (hadithNumber && collectionId) return <HadithDetail collectionId={collectionId} hadithNumber={hadithNumber} book={book} initialItem={initialItem} total={selected?.total} />;
  if (bookNumber && collectionId && books) return <BookView collectionId={collectionId} bookNumber={bookNumber} books={books} collectionName={selected?.name ?? "Collection"} initialBook={initialBook} />;

  const search = (event: FormEvent) => { event.preventDefault(); setQuery(queryInput.trim()); setPage(1); };
  const jump = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = Number(new FormData(event.currentTarget).get("number"));
    if (!Number.isInteger(value) || value < 1 || (selected && value > selected.total)) { setJumpError(`Enter a number from 1 to ${selected?.total.toLocaleString() ?? "the collection size"}.`); return; }
    setJumpError(null);
    router.push(`/sunnah/${collection}/${value}`);
  };
  const changePage = (next: number) => { setPage(next); scrollToTop(); };

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
      {books?.books.length && !query ? <div className={styles.views} role="group" aria-label="Browse by">
        <button type="button" aria-pressed={view === "books"} onClick={() => setView("books")}>Books</button>
        <button type="button" aria-pressed={view === "all"} onClick={() => setView("all")}>All Hadith</button>
      </div> : null}
      {query && list ? <p className={styles.summary}>{list.total.toLocaleString()} result{list.total === 1 ? "" : "s"} for “{query}” in {selected?.name}</p> : null}
      {showBooks && books ? <BooksPanel collectionId={collection} books={books} />
        : listError ? <ContentState kind="error" message="Sunnah content is unavailable right now. No substitute content has been used." />
        : isLoading && !list ? <div className={styles.loading} role="status" aria-label="Loading Hadith"><i /><i /><i /></div>
        : <>
          <HadithList items={list?.items ?? []} label={`${selected?.name ?? "Hadith"} list`} busy={isLoading} showArabic={showArabic} />
          {list?.items.length === 0 ? <ContentState kind="empty" message="No complete sourced records matched. Try another word or phrase." /> : null}
          {!query && list ? <Pager label="Hadith pages" page={list.page} pages={list.pages} onChange={changePage} /> : null}
        </>}
    </>}
  </Page>;
}

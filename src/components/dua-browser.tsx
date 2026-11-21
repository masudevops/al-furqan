"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import type { DuaCategory, DuaEntry, DuaSummary } from "@/lib/dua";
import { hasLocalBookmark, readLocalBookmarks, toggleLocalBookmark } from "@/lib/local-bookmarks";
import ContentState from "./content-state";
import { ButtonLink, Icon, IconButton, Page, PageHeader, type IconName } from "@/components/ui";
import styles from "./dua.module.css";

const fetcher = (url: string) => fetch(url).then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; });
const icons: Record<string, IconName> = { "morning-dhikr": "sun", "evening-dhikr": "moon", "daily-dua": "dua", "selected-dua": "bookmark", "dhikr-after-salah": "salah" };

export function DuaCategories() {
  const { data, error, isLoading } = useSWR<{ items: DuaCategory[] }>("/api/dua/categories", fetcher);
  return <Page>
    <PageHeader kicker="Hisnul Muslim" kickerIcon="dua" title="Dua" description="Authentic daily duas and dhikr, kept with their Arabic, meaning, and source reference." />
    {isLoading ? <div className={styles.loadingGrid} role="status" aria-label="Loading Dua categories"><i /><i /><i /></div> : null}
    {error ? <ContentState kind="error" message="Dua content is unavailable right now. No substitute content has been used." /> : null}
    <section className={styles.categoryGrid}>{data?.items.map(item => <Link className={styles.categoryCard} href={`/dua/${item.slug}`} key={item.slug}>
      <span className={styles.categoryIcon} aria-hidden="true"><Icon name={icons[item.slug] ?? "dua"} /></span>
      <span className={styles.categoryText}><strong>{item.name}</strong><span>{item.total} entries</span></span>
      <Icon name="arrowRight" />
    </Link>)}</section>
  </Page>;
}

export function DuaCategoryList({ slug }: { slug: string }) {
  const { data, error, isLoading } = useSWR<{ items: DuaSummary[] }>(`/api/dua/categories/${slug}`, fetcher);
  const [query, setQuery] = useState("");
  const items = useMemo(() => data?.items.filter(item => item.title.toLowerCase().includes(query.toLowerCase())) ?? [], [data, query]);
  return <Page narrow>
    <PageHeader back={{ href: "/dua", label: "All Dua categories" }} kicker="Dua collection" kickerIcon={icons[slug] ?? "dua"} title={data?.items[0]?.categoryName ?? "Dua"} description="Open an entry to read its Arabic, transliteration, translation, and source." />
    <label className={styles.search}><Icon name="search" /><input aria-label="Search this Dua category" type="search" placeholder="Search this category" value={query} onChange={event => setQuery(event.target.value)} /></label>
    {isLoading ? <div className={styles.loadingList} role="status" aria-label="Loading Duas"><i /><i /><i /><i /></div> : null}
    {error ? <ContentState kind="error" message="This category is unavailable right now." /> : null}
    {!isLoading && !error && items.length === 0 ? <ContentState kind="empty" message="No Duas match this search." /> : null}
    <ol className={styles.list}>{items.map(item => <li key={item.id}><Link href={`/dua/${slug}/${item.id}`}><span className={styles.number}>{(data?.items.indexOf(item) ?? 0) + 1}</span><span className={styles.title}>{item.title}</span><Icon name="arrowRight" /></Link></li>)}</ol>
  </Page>;
}

export function DuaDetail({ slug, id }: { slug: string; id: string }) {
  const { data, error, isLoading } = useSWR<{ item: DuaEntry }>(`/api/dua/categories/${slug}/${id}`, fetcher);
  const { data: category } = useSWR<{ items: DuaSummary[] }>(`/api/dua/categories/${slug}`, fetcher);
  const [bookmarks, setBookmarks] = useState(readLocalBookmarks);
  const [audioError, setAudioError] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => setBookmarks(readLocalBookmarks()), []);
  const item = data?.item;
  const bookmarkId = `dua:${slug}:${id}`;
  const saved = hasLocalBookmark(bookmarks, bookmarkId);
  const index = category?.items.findIndex(entry => String(entry.id) === id) ?? -1;
  const previous = index > 0 ? category?.items[index - 1] : undefined;
  const next = index >= 0 ? category?.items[index + 1] : undefined;
  const path = `/dua/${slug}/${id}`;
  const copy = async () => { try { await navigator.clipboard.writeText(`${location.origin}${path}`); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch {} };
  const share = async () => { if (!navigator.share) return copy(); try { await navigator.share({ title: item?.title ?? "Dua", url: `${location.origin}${path}` }); } catch {} };
  return <Page narrow>
    <PageHeader back={{ href: `/dua/${slug}`, label: item?.categoryName ?? "Back to category" }} kicker={item ? `${item.categoryName} · ${index >= 0 ? index + 1 : item.id}` : "Dua"} kickerIcon={icons[slug] ?? "dua"} title={item?.title ?? "Dua"}
      actions={item ? <>
        <IconButton icon="copy" label={`Copy link to ${item.title}`} onClick={copy} />
        <IconButton icon="share" label={`Share ${item.title}`} onClick={share} />
        <IconButton className={styles.bookmark} icon="bookmark" label={`${saved ? "Remove bookmark from" : "Bookmark"} ${item.title}`} aria-pressed={saved} onClick={() => setBookmarks(toggleLocalBookmark({ id: bookmarkId, label: item.title, reference: item.source, type: "dua", url: path }))} />
      </> : undefined} />
    {copied ? <p className={styles.copied} role="status">Link copied</p> : null}
    {isLoading ? <div className={styles.loadingList} role="status" aria-label="Loading Dua"><i /><i /></div> : null}
    {error ? <ContentState kind="error" message="This Dua is unavailable right now. No substitute content has been used." /> : null}
    {item ? <article className={styles.detail}>
      {item.audio ? <section className={styles.audio} aria-label="Arabic recitation"><span className={styles.audioIcon} aria-hidden="true"><Icon name="dua" /></span><div><strong>Listen</strong><span>Arabic recitation</span></div><audio controls preload="none" onError={() => setAudioError(true)} aria-label={`Arabic recitation of ${item.title}`}><source src={item.audio.url} type="audio/mpeg" /></audio>{audioError ? <p className={styles.error}>The recording is unavailable right now.</p> : null}</section> : <p className={styles.noAudio}>A verified recording is not available for this Dua yet.</p>}
      <p className={styles.arabic} lang="ar" dir="rtl" translate="no">{item.arabic}</p>
      {item.latin ? <p className={styles.transliteration}>{item.latin}</p> : null}
      <p className={styles.translation} translate="no">{item.translation}</p>
      {item.notes ? <section className={styles.note}><h2>Practice</h2><p>{item.notes}</p></section> : null}
      {item.fawaid ? <section className={styles.note}><h2>Benefit</h2><p>{item.fawaid}</p></section> : null}
      <p className={styles.reference}>Reference: {item.source || "Reference unavailable"}</p>
    </article> : null}
    {item && (previous || next) ? <nav className={styles.pager} aria-label="Neighbouring Duas">
      {previous ? <ButtonLink href={`/dua/${slug}/${previous.id}`} icon="back">Previous</ButtonLink> : <span />}
      {next ? <ButtonLink href={`/dua/${slug}/${next.id}`} trailingIcon="arrowRight">Next</ButtonLink> : null}
    </nav> : null}
  </Page>;
}

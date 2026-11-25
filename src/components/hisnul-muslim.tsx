"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { HisnChapter, HisnChapterSummary, HisnEntry } from "@/lib/hisnul-muslim";
import { hasLocalBookmark, readLocalBookmarks, toggleLocalBookmark } from "@/lib/local-bookmarks";
import ContentState from "./content-state";
import { ButtonLink, Icon, IconButton, Page, PageHeader } from "@/components/ui";
import styles from "./dua.module.css";

export const HISN_PATH = "/dua/hisnul-muslim";
const SOURCE_NOTE = "Source: Hisnul Muslim (Fortress of the Muslim) by Sa'id bin Wahf al-Qahtani, as published on hisnmuslim.com. The site doesn't name its English translator, and this edition doesn't include each Dua's Hadith reference.";

export function HisnChapterList({ chapters }: { chapters: HisnChapterSummary[] | null }) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLowerCase();
  const shown = useMemo(() => chapters?.filter((chapter) => !needle || chapter.title.toLowerCase().includes(needle) || chapter.titleArabic.includes(query.trim()) || String(chapter.id) === needle) ?? [], [chapters, needle, query]);
  return <Page narrow>
    <PageHeader back={{ href: "/dua", label: "Dua" }} kicker="Fortress of the Muslim" kickerIcon="dua" title="Hisnul Muslim" titleArabic="حصن المسلم" description={chapters ? `${chapters.length} chapters of Duas and remembrance for daily life, each with its Arabic, English meaning and recitation.` : undefined} />
    {!chapters ? <ContentState kind="error" message="Hisnul Muslim is unavailable right now. No substitute content has been used." /> : <>
      <label className={styles.search}><Icon name="search" /><input aria-label="Find a chapter" type="search" placeholder="Find a chapter, e.g. sleep, travel, rain" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      {shown.length ? <ol className={styles.list}>{shown.map((chapter) => <li key={chapter.id}><Link href={`${HISN_PATH}/${chapter.id}`}>
        <span className={styles.number}>{chapter.id}</span>
        <span className={styles.chapterTitle}><span className={styles.title}>{chapter.title}</span>{chapter.titleArabic ? <span lang="ar" dir="rtl" translate="no">{chapter.titleArabic}</span> : null}</span>
        <Icon name="arrowRight" />
      </Link></li>)}</ol> : <ContentState kind="empty" message={`No chapter title contains “${query.trim()}”.`} />}
      <p className={styles.reference}>{SOURCE_NOTE}</p>
    </>}
  </Page>;
}

function Entry({ entry, index, title }: { entry: HisnEntry; index: number; title: string }) {
  const [audioError, setAudioError] = useState(false);
  return <article className={styles.detail} aria-label={`${title}, Dua ${index}`}>
    <div className={styles.entryBar}>
      <span className={styles.number}>{index}</span>
      {entry.repeat > 1 ? <span className={styles.repeat}>Say {entry.repeat} times</span> : null}
      {entry.audioUrl ? <audio className={styles.entryAudio} controls preload="none" onError={() => setAudioError(true)} aria-label={`Arabic recitation of Dua ${index}`}><source src={entry.audioUrl} type="audio/mpeg" /></audio> : null}
    </div>
    {audioError ? <p className={styles.error}>The recording is unavailable right now.</p> : null}
    <p className={styles.arabic} lang="ar" dir="rtl" translate="no">{entry.arabic}</p>
    {entry.note ? <p className={styles.transliteration} translate="no">{entry.note}</p> : null}
    {entry.translation ? <p className={styles.translation} translate="no">{entry.translation}</p> : null}
  </article>;
}

export function HisnChapterView({ chapter, previous, next }: { chapter: HisnChapter | null; previous?: HisnChapterSummary; next?: HisnChapterSummary }) {
  const [bookmarks, setBookmarks] = useState(readLocalBookmarks);
  const [copied, setCopied] = useState(false);
  useEffect(() => setBookmarks(readLocalBookmarks()), []);
  if (!chapter) return <Page narrow>
    <PageHeader back={{ href: HISN_PATH, label: "Hisnul Muslim" }} kicker="Hisnul Muslim" kickerIcon="dua" title="Chapter unavailable" />
    <ContentState kind="error" message="This chapter is unavailable right now. No substitute content has been used." />
  </Page>;
  const path = `${HISN_PATH}/${chapter.id}`;
  const bookmarkId = `dua:hisnul-muslim:${chapter.id}`;
  const saved = hasLocalBookmark(bookmarks, bookmarkId);
  const copy = async () => { try { await navigator.clipboard.writeText(`${location.origin}${path}`); setCopied(true); window.setTimeout(() => setCopied(false), 1800); } catch {} };
  const share = async () => { if (!navigator.share) return copy(); try { await navigator.share({ title: chapter.title, url: `${location.origin}${path}` }); } catch {} };
  return <Page narrow>
    <PageHeader back={{ href: HISN_PATH, label: "Hisnul Muslim" }} kicker={`Hisnul Muslim · Chapter ${chapter.id}`} kickerIcon="dua" title={chapter.title} titleArabic={chapter.titleArabic || undefined}
      actions={<>
        <IconButton icon="copy" label={`Copy link to ${chapter.title}`} onClick={copy} />
        <IconButton icon="share" label={`Share ${chapter.title}`} onClick={share} />
        <IconButton className={styles.bookmark} icon="bookmark" label={`${saved ? "Remove bookmark from" : "Bookmark"} ${chapter.title}`} aria-pressed={saved} onClick={() => setBookmarks(toggleLocalBookmark({ id: bookmarkId, label: chapter.title, reference: `Hisnul Muslim, chapter ${chapter.id}`, type: "dua", url: path }))} />
      </>} />
    {copied ? <p className={styles.copied} role="status">Link copied</p> : null}
    {chapter.entries.length ? <div className={styles.entries}>{chapter.entries.map((entry, index) => <Entry key={entry.id} entry={entry} index={index + 1} title={chapter.title} />)}</div>
      : <ContentState kind="empty" message="The source has no complete text for this chapter." />}
    <p className={styles.reference}>{SOURCE_NOTE} Hisnul Muslim, chapter {chapter.id}.</p>
    <nav className={styles.pager} aria-label="Neighbouring chapters">
      {previous ? <ButtonLink href={`${HISN_PATH}/${previous.id}`} icon="back">Chapter {previous.id}</ButtonLink> : <span />}
      {next ? <ButtonLink href={`${HISN_PATH}/${next.id}`} trailingIcon="arrowRight">Chapter {next.id}</ButtonLink> : null}
    </nav>
  </Page>;
}

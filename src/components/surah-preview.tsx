"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { preload } from "swr";

import styles from "@/components/seo-fallback.module.css";
import type { ReaderSelection } from "@/lib/reader-defaults";
import type { ReaderPayload } from "@/lib/types";

const SAVED_SELECTION_KEYS = { translationId: "af-translation-id", recitationId: "af-recitation-id", script: "af-quran-script" } as const;

// A saved choice that differs from the server's default means the reader will request a different key.
const savedSelectionMatches = (selection: ReaderSelection) =>
  (Object.keys(SAVED_SELECTION_KEYS) as (keyof ReaderSelection)[]).every((field) => {
    const saved = localStorage.getItem(SAVED_SELECTION_KEYS[field]);
    return !saved || saved === String(selection[field]);
  });

/**
 * Server-loaded Surah content, rendered as crawlable HTML while the interactive reader starts.
 * The same payload is handed to the reader through SWR's preload cache, so a visitor with default
 * reader settings downloads the Surah once instead of again from /api/reader.
 */
export default function SurahPreview({ payload, readerKey, selection }: { payload: ReaderPayload; readerKey: string | null; selection: ReaderSelection | null }) {
  // Runs once during the first client render, before the reader's request effect fires.
  const [seeded] = useState(() => {
    if (typeof window === "undefined" || !readerKey || !selection || !savedSelectionMatches(selection)) return false;
    void preload(readerKey, () => Promise.resolve(payload));
    return true;
  });

  // Child effects run before the app shell's own mount effect, which restores these saved choices.
  // First-time visitors therefore request the seeded key immediately instead of waiting for catalogs.
  useEffect(() => {
    if (!seeded || !selection) return;
    for (const field of Object.keys(SAVED_SELECTION_KEYS) as (keyof ReaderSelection)[]) {
      if (!localStorage.getItem(SAVED_SELECTION_KEYS[field])) localStorage.setItem(SAVED_SELECTION_KEYS[field], String(selection[field]));
    }
  }, [seeded, selection]);

  const { chapter, verses } = payload;
  return <section>
    <header className={styles.readerHeader}><p>Surah {chapter.id}</p><h1>{chapter.nameSimple}</h1><span>{chapter.translatedName} · {chapter.versesCount} Ayahs</span></header>
    <div className={styles.verses}>{verses.map((verse) => <article className={styles.verse} key={verse.verseKey}><Link className={styles.reference} href={`/quran/${chapter.id}/${verse.verseNumber}`} prefetch={false}>{verse.verseKey}</Link><p className={styles.arabic} lang="ar" dir="rtl" translate="no">{verse.arabicText}</p>{verse.translationText ? <div className={styles.translation} translate="no" dangerouslySetInnerHTML={{ __html: verse.translationText }}/> : null}<small className={styles.source}>Quran text and translation: Quran.Foundation{verse.translationName ? ` · ${verse.translationName}` : ""}</small></article>)}</div>
  </section>;
}

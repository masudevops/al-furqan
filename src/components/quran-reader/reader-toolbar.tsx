"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { memo, useEffect, useId, useRef, useState } from "react";

import type { ContentPreviewItem, ReaderPayload } from "@/lib/types";
import { ReaderIcon } from "./icons";
import { saveReadingMode } from "@/lib/reading-mode";
import { mushafHrefFor, positionLabels, positionOfVerse } from "./reader-position";
import styles from "./quran-reader.module.css";

type ReaderToolbarProps = {
  chapter: ReaderPayload["chapter"];
  chapters?: ContentPreviewItem[];
  verses: ReaderPayload["verses"];
  settingsActive: boolean;
  onOpenSettings: () => void;
};

// Tracks the Ayah under the toolbar itself so scrolling never re-renders the verse list.
function useVerseUnderToolbar(barRef: React.RefObject<HTMLElement>, verses: ReaderPayload["verses"]) {
  const [verseKey, setVerseKey] = useState<string | null>(null);
  useEffect(() => {
    setVerseKey(null);
    let frame = 0;
    const update = () => {
      frame = 0;
      const bar = barRef.current;
      if (!bar) return;
      const target = document.elementFromPoint(window.innerWidth / 2, bar.getBoundingClientRect().bottom + 16);
      const key = target?.closest<HTMLElement>("[data-verse-key]")?.dataset.verseKey;
      if (key) setVerseKey(key);
      else if (window.scrollY < 80) setVerseKey(null);
    };
    const schedule = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => { window.cancelAnimationFrame(frame); window.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); };
  }, [barRef, verses]);
  return verseKey;
}

const ReaderToolbar = memo(function ReaderToolbar({ chapter, chapters, verses, settingsActive, onOpenSettings }: ReaderToolbarProps) {
  const router = useRouter();
  const barRef = useRef<HTMLDivElement>(null);
  const selectId = useId();
  const verseKey = useVerseUnderToolbar(barRef, verses);
  const position = positionOfVerse(verses, verseKey);
  const labels = positionLabels(position);
  const total = chapter.versesCount ?? verses.length;
  const progress = total && verseKey && position ? Math.min(1, (position.index + 1) / total) : 0;

  return <div ref={barRef} className={styles.toolbar}>
    <div className={styles.toolbarInner}>
      <div className={styles.surahSelect}>
        <label className={styles.srOnly} htmlFor={selectId}>Choose a Surah</label>
        {chapters?.length
          ? <select id={selectId} value={chapter.id} onChange={(event) => router.push(`/quran/${event.target.value}`)}>{chapters.map((item) => <option key={item.id} value={item.id}>{item.id}. {item.nameSimple}</option>)}</select>
          : <select id={selectId} value={chapter.id} disabled><option value={chapter.id}>{chapter.id}. {chapter.nameSimple}</option></select>}
        <span className={styles.surahSelectValue} aria-hidden="true">{chapter.id}. {chapter.nameSimple}<ReaderIcon name="chevron" /></span>
      </div>
      <p className={styles.position} aria-live="off">
        {labels.page ? <strong>{labels.page}</strong> : null}
        {labels.section ? <span>{labels.section}</span> : null}
      </p>
      <div className={styles.toolbarEnd}>
        <nav className={styles.modeSwitch} aria-label="Reading mode">
          <span aria-current="page"><ReaderIcon name="verses" /><span className={styles.modeLabel}>Verse by Verse</span></span>
          <Link href={mushafHrefFor(position)} prefetch={false} onClick={() => saveReadingMode("mushaf")}><ReaderIcon name="page" /><span className={styles.modeLabel}>Mushaf</span></Link>
        </nav>
        <button type="button" className={`${styles.toolbarButton} ${styles.settingsButton}`} aria-label="Open reader settings" title="Settings" onClick={onOpenSettings}><ReaderIcon name="gear" />{settingsActive ? <span className={styles.activeDot} aria-hidden="true" /> : null}</button>
      </div>
    </div>
    <span className={styles.progress} style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
  </div>;
});

export default ReaderToolbar;

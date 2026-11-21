import Link from "next/link";

import type { ContentPreviewItem, ReaderPayload } from "@/lib/types";
import { ReaderIcon } from "./icons";
import { englishMeaning, revelationLabel } from "./reader-position";
import styles from "./quran-reader.module.css";

type SurahHeaderProps = {
  chapter: ReaderPayload["chapter"];
  catalogItem?: ContentPreviewItem;
  listenState: "unavailable" | "idle" | "playing" | "paused";
  onListen: () => void;
  infoOpen: boolean;
  onToggleInfo: () => void;
  onWarmInfo?: () => void;
  translationLabel?: string;
  onOpenSettings: () => void;
  quranFont: boolean;
};

export default function SurahHeader({ chapter, catalogItem, listenState, onListen, infoOpen, onToggleInfo, onWarmInfo, translationLabel, onOpenSettings, quranFont }: SurahHeaderProps) {
  const meaning = englishMeaning(catalogItem?.translatedName);
  const revelation = revelationLabel(catalogItem?.revelationPlace);
  const facts = [chapter.versesCount ? `${chapter.versesCount} Ayahs` : null, revelation ? `Revealed in ${revelation}` : null].filter(Boolean).join(" · ");
  return <header className={styles.surahHeader}>
    <Link className={styles.backLink} href="/quran"><ReaderIcon name="back" />All Surahs</Link>
    <div className={styles.surahIdentity}>
      <span className={styles.surahNumber} aria-hidden="true">{chapter.id}</span>
      <div className={styles.surahTitles}>
        <h1><span className={styles.srOnly}>Surah {chapter.id}: </span>{chapter.nameSimple}{meaning ? <span className={styles.surahMeaning}>{meaning}</span> : null}</h1>
        {facts ? <p>{facts}</p> : null}
      </div>
      {chapter.nameArabic ? <strong className={`${styles.surahArabic} ${quranFont ? styles.quranFont : ""}`} lang="ar" dir="rtl" translate="no">{chapter.nameArabic}</strong> : null}
    </div>
    <div className={styles.surahActions}>
      {listenState !== "unavailable" ? <button type="button" className={styles.pillPrimary} onClick={onListen}><ReaderIcon name={listenState === "playing" ? "pause" : "play"} />{listenState === "playing" ? "Pause" : listenState === "paused" ? "Resume" : "Listen"}</button> : null}
      <button type="button" className={styles.pill} aria-expanded={infoOpen} onClick={onToggleInfo} onPointerEnter={onWarmInfo} onFocus={onWarmInfo} onTouchStart={onWarmInfo}><ReaderIcon name="info" />Surah info</button>
      {translationLabel ? <button type="button" className={`${styles.pill} ${styles.translationPill}`} onClick={onOpenSettings} aria-label={`Translation: ${translationLabel}. Change translation`}><span>Translation: {translationLabel}</span><ReaderIcon name="chevron" /></button> : null}
    </div>
  </header>;
}

"use client";

import Link from "next/link";
import { memo, useEffect, useId, useState } from "react";
import useSWR, { preload } from "swr";

import type { AyahStudyPayload, AyahTafsirPayload, FootnotePayload, ReaderPayload, TajweedGlyphWord } from "@/lib/types";
import type { toggleLocalBookmark } from "@/lib/local-bookmarks";
import { fetchJson } from "./fetch-json";
import { ReaderIcon, type ReaderIconName } from "./icons";
import Popover from "./popover";
import QcfTajweedText from "./qcf-tajweed";
import { toArabicIndicDigits } from "./reader-position";
import styles from "./quran-reader.module.css";

type ReaderVerse = ReaderPayload["verses"][number];
type StudyPanel = "tafsir" | "hadith" | "answers";

export type VerseActions = {
  play: (verseKey: string | null) => void;
  copy: (verseKey: string, chapter: number | null, verse: number | null, details: HTMLDetailsElement | null) => void;
  share: (verseKey: string, chapter: number | null, verse: number | null, details: HTMLDetailsElement | null) => void;
  toggleBookmark: (bookmark: Parameters<typeof toggleLocalBookmark>[0]) => void;
  playWord: (url: string) => void;
};

export type WordDisplay = { meaning: boolean; transliteration: boolean };

type VerseCardProps = {
  verse: ReaderVerse; chapterId: number; chapterName: string; isActive: boolean; isPlaying: boolean; isSaved: boolean; isCopied: boolean; bookmarkNotice: "saved" | "removed" | null;
  activeWordPosition: number | null; wordMode: boolean; wordDisplay: WordDisplay; playingWordUrl: string | null; concealArabic: boolean; tajweedEnabled: boolean; tajweedWords: TajweedGlyphWord[] | null; uthmaniScript: boolean; tafsirAvailable: boolean; tafsirEverywhere: boolean; tafsirId: number | null;
  contentPending: boolean; translationResourceName?: string; translationAuthor?: string | null; tafsirResourceName?: string; actions: VerseActions;
};

const studyRequestUrl = (verseKey: string) => `/api/quran/study/${verseKey.replace(":", "/")}`;
const studyOptions = { dedupingInterval: 60 * 60 * 1000, revalidateIfStale: false, revalidateOnFocus: false, revalidateOnReconnect: false };

function TranslationFootnote({ id, label }: { id: number; label: string }) {
  const [open, setOpen] = useState(false);
  const { data, error, isLoading } = useSWR<FootnotePayload>(open ? `/api/quran/footnotes/${id}` : null, fetchJson, { revalidateOnFocus: false });
  return <details className={styles.footnote} onToggle={(event) => setOpen(event.currentTarget.open)}><summary>Footnote {label}</summary>{isLoading ? <p>Loading footnote…</p> : null}{error ? <p className={styles.unavailable}>This footnote is unavailable right now.</p> : null}{data ? <><div translate="no" dangerouslySetInnerHTML={{ __html: data.textHtml }} /><small>Translation footnote · {data.languageName ?? "source language"}</small></> : null}</details>;
}

function AyahTafsir({ verse, tafsirId, tafsirEverywhere, contentPending, fallbackName }: { verse: ReaderVerse; tafsirId: number | null; tafsirEverywhere: boolean; contentPending: boolean; fallbackName?: string }) {
  // "Tafsir under every Ayah" loads with the Surah; a single panel fetches only its own Ayah.
  const url = !tafsirEverywhere && tafsirId && verse.verseKey ? `/api/quran/tafsir/${verse.verseKey.replace(":", "/")}?tafsir=${tafsirId}` : null;
  const { data, error, isLoading } = useSWR<AyahTafsirPayload>(url, fetchJson, studyOptions);
  const text = tafsirEverywhere ? verse.tafsirText : data?.tafsirText;
  const name = (tafsirEverywhere ? verse.tafsirName : data?.tafsirName) ?? fallbackName ?? "Selected source";
  return <>
    <p className={styles.panelSource}>{name}</p>
    {text ? <p translate="no" dir="auto">{text}</p>
      : (tafsirEverywhere ? contentPending : isLoading || (!data && !error)) ? <p className={styles.panelState}>Loading tafsir…</p>
      : error ? <p className={styles.unavailable}>This Tafsir is unavailable right now.</p>
      : <p className={styles.unavailable}>No tafsir entry was returned for this Ayah.</p>}
  </>;
}

function StudyReferences({ verseKey, kind }: { verseKey: string; kind: "hadith" | "answers" }) {
  const { data, error, isLoading } = useSWR<AyahStudyPayload>(studyRequestUrl(verseKey), fetchJson, studyOptions);
  if (isLoading) return <p className={styles.panelState}>Loading sourced references…</p>;
  if (error) return <p className={styles.unavailable}>Sourced study references are unavailable right now.</p>;
  if (!data) return null;
  if (kind === "hadith") {
    if (!data.hadiths.length) return <p className={styles.unavailable}>No Hadith linked to this Ayah were returned by the source.</p>;
    return <>{data.hadiths.map((hadith, index) => <article className={styles.reference} key={`${hadith.collection}-${hadith.hadithNumber}-${index}`}><strong>{hadith.collection} · Hadith {hadith.hadithNumber}</strong>{hadith.bookNumber ? <small>Book {hadith.bookNumber}{hadith.chapterTitle ? ` · ${hadith.chapterTitle}` : ""}</small> : null}<div translate="no" dangerouslySetInnerHTML={{ __html: hadith.textHtml }} />{hadith.grades.map((grade) => <small key={`${grade.grade}-${grade.gradedBy}`}>Grade: {grade.grade}{grade.gradedBy ? ` — ${grade.gradedBy}` : ""}</small>)}<small>Source: Quran.Foundation Ayah-linked Hadith</small></article>)}</>;
  }
  if (!data.answers.length) return <p className={styles.unavailable}>No published answers for this Ayah were returned by the source.</p>;
  return <>{data.answers.map((answer) => <article className={styles.reference} key={answer.questionId}><strong>{answer.type ?? "Published question & answer"}{answer.theme ? ` · ${answer.theme}` : ""}</strong><div translate="no" dangerouslySetInnerHTML={{ __html: answer.questionHtml }} /><div translate="no" dangerouslySetInnerHTML={{ __html: answer.answerHtml }} /><small>{answer.answeredBy ? `Answered by ${answer.answeredBy} · ` : ""}Source: Quran.Foundation Answers</small></article>)}</>;
}

function IconButton({ label, icon, onClick, pressed, className }: { label: string; icon: ReaderIconName; onClick: () => void; pressed?: boolean; className?: string }) {
  return <button type="button" className={`${styles.iconButton} ${className ?? ""}`} aria-label={label} title={label} aria-pressed={pressed} onClick={onClick}><ReaderIcon name={icon} /></button>;
}

// Memoized so audio progress, bookmarks, and other reader state only re-render the Ayahs they affect.
const VerseCard = memo(function VerseCard({ verse, chapterId, chapterName, isActive, isPlaying, isSaved, isCopied, bookmarkNotice, activeWordPosition, wordMode, wordDisplay, playingWordUrl, concealArabic, tajweedEnabled, tajweedWords, uthmaniScript, tafsirAvailable, tafsirEverywhere, tafsirId, contentPending, translationResourceName, translationAuthor, tafsirResourceName, actions }: VerseCardProps) {
  // undefined follows the Surah-wide Tafsir setting until the reader picks a panel for this Ayah.
  const [panel, setPanel] = useState<StudyPanel | null | undefined>(undefined);
  const panelId = useId();
  const activePanel = panel === undefined ? (tafsirEverywhere ? "tafsir" : null) : panel;
  const verseKey = verse.verseKey ?? `${chapterId}:${verse.verseNumber}`;
  const label = `Ayah ${verse.verseNumber}`;
  const togglePanel = (kind: StudyPanel) => setPanel(activePanel === kind ? null : kind);
  const warmStudy = () => { if (verse.verseKey) void preload(studyRequestUrl(verse.verseKey), fetchJson); };
  // Tajweed uses the official QCF V4 glyphs; text_uthmani_tajweed is never rendered because it encodes marks
  // (e.g. U+0672) that no available font displays correctly. Plain Uthmani text uses the Uthmani Hafs font.
  const arabicClass = `${styles.arabic} ${uthmaniScript ? styles.quranFont : ""}`;
  // Test yourself: the Arabic stays hidden until the reader chooses to reveal this Ayah.
  const [revealed, setRevealed] = useState(false);
  useEffect(() => { if (!concealArabic) setRevealed(false); }, [concealArabic]);
  const concealed = concealArabic && !revealed;
  const studyLinks: Array<{ kind: StudyPanel; label: string; icon: ReaderIconName }> = [
    ...(tafsirAvailable ? [{ kind: "tafsir" as const, label: "Tafsir", icon: "book" as const }] : []),
    ...(verse.verseKey ? [{ kind: "hadith" as const, label: "Hadith", icon: "scroll" as const }, { kind: "answers" as const, label: "Answers", icon: "answer" as const }] : []),
  ];

  return <article id={`verse-${verse.verseNumber}`} data-verse-key={verse.verseKey ?? undefined} className={`${styles.verse} ${isActive ? styles.activeVerse : ""}`} aria-current={isActive ? "true" : undefined} aria-label={`${chapterName} ${verseKey}`}>
    <div className={styles.verseBar}>
      <div className={styles.verseBarGroup}>
        <a className={styles.verseKey} href={`#verse-${verse.verseNumber}`}>{verse.verseKey}</a>
        {verse.audioUrl ? <IconButton label={`${isPlaying ? "Pause" : "Play"} recitation of ${label}`} icon={isPlaying ? "pause" : "play"} pressed={isPlaying} className={isActive ? styles.iconButtonActive : undefined} onClick={() => actions.play(verse.verseKey)} /> : null}
        <IconButton label={`${isSaved ? "Remove bookmark from" : "Bookmark"} ${label}`} icon="bookmark" pressed={isSaved} className={styles.bookmarkButton} onClick={() => actions.toggleBookmark({ id: `quran:${verse.verseKey}`, label: `${chapterName} ${verse.verseKey}`, reference: verse.verseKey ?? "", type: "quran", url: `/quran/${chapterId}/${verse.verseNumber}` })} />
      </div>
      <div className={styles.verseBarGroup}>
        {isCopied ? <span className={styles.copyConfirmation} role="status">Link copied</span> : null}
        {bookmarkNotice ? <span className={styles.copyConfirmation} role="status">{bookmarkNotice === "saved" ? <>Saved · <Link href="/library">Library</Link></> : "Bookmark removed"}</span> : null}
        <IconButton label={`Copy link to ${label}`} icon="copy" className={styles.wideOnly} onClick={() => actions.copy(verseKey, chapterId, verse.verseNumber, null)} />
        <IconButton label={`Share ${label}`} icon="share" className={styles.wideOnly} onClick={() => actions.share(verseKey, chapterId, verse.verseNumber, null)} />
        <Popover className={styles.menu} summaryClassName={styles.iconButton} label={`More actions for ${label}`} summary={<ReaderIcon name="more" />}>
          {(close) => <>
            <Link href={`/quran/${chapterId}/${verse.verseNumber}`} prefetch={false} onClick={close}><ReaderIcon name="link" />Open Ayah</Link>
            <button type="button" className={styles.narrowOnly} onClick={(event) => actions.copy(verseKey, chapterId, verse.verseNumber, event.currentTarget.closest("details"))}><ReaderIcon name="copy" />Copy link</button>
            <button type="button" className={styles.narrowOnly} onClick={(event) => actions.share(verseKey, chapterId, verse.verseNumber, event.currentTarget.closest("details"))}><ReaderIcon name="share" />Share Ayah</button>
          </>}
        </Popover>
      </div>
    </div>
    <div className={concealed ? styles.concealed : undefined}>
      {/* React 18 has no boolean `inert`; an empty string sets the attribute so hidden text can't be focused or selected. */}
      <div aria-hidden={concealed || undefined} {...(concealed ? { inert: "" } as Record<string, string> : {})}>
    {wordMode && verse.words.length
      ? <div className={`${styles.wordGrid} ${uthmaniScript ? styles.quranFont : ""}`} lang="ar" dir="rtl" translate="no">{verse.words.filter((word) => word.charType === "word").map((word) => {
        const className = `${styles.word} ${activeWordPosition === word.position || (word.audioUrl && playingWordUrl === word.audioUrl) ? styles.activeWord : ""}`;
        const body = <><b>{word.arabicText}</b>{wordDisplay.transliteration && word.transliteration ? <small dir="ltr">{word.transliteration}</small> : null}{wordDisplay.meaning && word.translation ? <em dir="ltr">{word.translation}</em> : null}</>;
        // Each word plays its own Quran.Foundation recitation.
        return word.audioUrl ? <button type="button" className={className} key={word.position} onClick={() => actions.playWord(word.audioUrl!)} aria-label={`Play word ${word.position}${word.translation ? `: ${word.translation}` : ""}`}>{body}</button> : <span className={className} key={word.position}>{body}</span>;
      })}</div>
      : tajweedEnabled && tajweedWords
        ? <QcfTajweedText words={tajweedWords} verseNumber={verse.verseNumber} plainText={verse.arabicText} plainClassName={arabicClass} />
        : <p className={arabicClass} lang="ar" dir="rtl" translate="no">{verse.arabicText}{verse.verseNumber ? <> <span className={styles.ayahEnd}>{toArabicIndicDigits(verse.verseNumber)}</span></> : null}</p>}
      </div>
      {concealed ? <button type="button" className={styles.revealButton} onClick={() => setRevealed(true)}>Reveal Ayah {verse.verseNumber}</button> : null}
    </div>
    {verse.translationText
      ? <div className={styles.translationBlock}>
        <div className={styles.translation} dir="auto" translate="no" dangerouslySetInnerHTML={{ __html: verse.translationText }} />
        {verse.translationName || translationResourceName ? <p className={styles.attribution}>— {verse.translationName ?? translationResourceName}{translationAuthor && !(verse.translationName ?? translationResourceName ?? "").includes(translationAuthor) ? `, ${translationAuthor}` : ""}</p> : null}
        {verse.translationFootnotes.length ? <div className={styles.footnotes}>{verse.translationFootnotes.map((footnote) => <TranslationFootnote id={footnote.id} label={footnote.label} key={footnote.id} />)}</div> : null}
      </div>
      : <p className={styles.unavailable}>The selected translation is unavailable for this Ayah.</p>}
    {studyLinks.length ? <div className={styles.studyRow} role="group" aria-label={`Study ${label}`}>{studyLinks.map((link) => <button type="button" key={link.kind} aria-expanded={activePanel === link.kind} aria-controls={activePanel === link.kind ? panelId : undefined} onClick={() => togglePanel(link.kind)} {...(link.kind === "tafsir" ? {} : { onFocus: warmStudy, onPointerEnter: warmStudy })}><ReaderIcon name={link.icon} />{link.label}</button>)}</div> : null}
    {activePanel ? <section id={panelId} className={styles.studyPanel} aria-label={`${activePanel === "tafsir" ? "Tafsir" : activePanel === "hadith" ? "Hadith" : "Answers"} for ${label}`}>
      <header><strong>{activePanel === "tafsir" ? "Tafsir" : activePanel === "hadith" ? "Hadith linked to this Ayah" : "Answers about this Ayah"}</strong><button type="button" className={styles.iconButton} aria-label="Close panel" title="Close panel" onClick={() => setPanel(null)}><ReaderIcon name="close" /></button></header>
      {activePanel === "tafsir"
        ? <AyahTafsir verse={verse} tafsirId={tafsirId} tafsirEverywhere={tafsirEverywhere} contentPending={contentPending} fallbackName={tafsirResourceName} />
        : verse.verseKey ? <StudyReferences verseKey={verse.verseKey} kind={activePanel} /> : null}
    </section> : null}
  </article>;
});

export default VerseCard;

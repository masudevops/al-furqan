"use client";

import Link from "next/link";
import { memo, useEffect, useId, useRef, useState } from "react";
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

// A translator's note, opened from its number in the translation text.
function TranslatorNote({ id, label, translationName, panelId, onClose }: { id: number; label: string; translationName?: string | null; panelId: string; onClose: () => void }) {
  const { data, error, isLoading } = useSWR<FootnotePayload>(`/api/quran/footnotes/${id}`, fetchJson, { revalidateOnFocus: false });
  return <aside id={panelId} className={styles.note} aria-label={`Translator's note ${label}`}>
    <div className={styles.noteHead}><strong>Translator&apos;s note {label}{translationName ? <span> · {translationName}</span> : null}</strong><button type="button" className={styles.noteClose} aria-label={`Close translator's note ${label}`} onClick={onClose}>×</button></div>
    {isLoading ? <p className={styles.muted}>Loading note…</p> : null}
    {error ? <p className={styles.unavailable}>This note is unavailable right now.</p> : null}
    {data ? <div dir="auto" translate="no" dangerouslySetInnerHTML={{ __html: data.textHtml }} /> : null}
  </aside>;
}

// "114:1"–"114:6" → "114:1–6"; across Surahs both keys are written in full.
const passageLabel = (keys: string[]) => {
  const [first, last] = [keys[0], keys[keys.length - 1]];
  return first.split(":")[0] === last.split(":")[0] ? `${first}–${last.split(":")[1]}` : `${first}–${last}`;
};

function AyahTafsir({ verse, tafsirId, tafsirEverywhere, contentPending, fallbackName }: { verse: ReaderVerse; tafsirId: number | null; tafsirEverywhere: boolean; contentPending: boolean; fallbackName?: string }) {
  // "Tafsir under every Ayah" loads with the Surah, where a passage's entry sits under one of its Ayahs.
  // A single panel, or an Ayah with no entry of its own in that mode, asks for the entry covering this Ayah.
  const needsLookup = !tafsirEverywhere || (!contentPending && !verse.tafsirText);
  const url = needsLookup && tafsirId && verse.verseKey ? `/api/quran/tafsir/${verse.verseKey.replace(":", "/")}?tafsir=${tafsirId}` : null;
  const { data, error, isLoading } = useSWR<AyahTafsirPayload>(url, fetchJson, studyOptions);
  const passage = data && data.verseKeys.length > 1 ? passageLabel(data.verseKeys) : null;
  // In the Surah-wide view the passage's text is already shown under another Ayah, so point to it instead of repeating it.
  const sharedElsewhere = tafsirEverywhere && !verse.tafsirText && passage;
  const text = tafsirEverywhere ? verse.tafsirText ?? (sharedElsewhere ? null : data?.tafsirText) : data?.tafsirText;
  const name = (tafsirEverywhere ? verse.tafsirName ?? data?.tafsirName : data?.tafsirName) ?? fallbackName ?? "Selected source";
  return <>
    <p className={styles.panelSource}>{name}{passage && !sharedElsewhere ? <span className={styles.passage}> · Explains Ayahs {passage} together</span> : null}</p>
    {text ? <p translate="no" dir="auto">{text}</p>
      : sharedElsewhere ? <p className={styles.unavailable}>This Tafsir explains Ayahs {passage} together; its commentary appears under one of those Ayahs.</p>
      : (tafsirEverywhere ? contentPending || (url && isLoading) : isLoading || (!data && !error)) ? <p className={styles.panelState}>Loading tafsir…</p>
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
  // Translator's notes open from the superscript numbers in the translation, which become keyboard-operable buttons.
  const translationRef = useRef<HTMLDivElement>(null);
  const [openNote, setOpenNote] = useState<{ id: number; label: string } | null>(null);
  const notePanelId = `${useId()}-note`;
  useEffect(() => {
    translationRef.current?.querySelectorAll<HTMLElement>("sup[data-footnote]").forEach((marker) => {
      const id = Number(marker.dataset.footnote);
      marker.setAttribute("role", "button");
      marker.tabIndex = 0;
      marker.setAttribute("aria-label", `Translator's note ${marker.textContent ?? ""}`);
      marker.setAttribute("aria-expanded", String(openNote?.id === id));
      marker.setAttribute("aria-controls", notePanelId);
    });
  }, [verse.translationText, openNote, notePanelId]);
  const toggleNoteFrom = (target: EventTarget) => {
    const marker = target instanceof Element ? target.closest<HTMLElement>("sup[data-footnote]") : null;
    const id = Number(marker?.dataset.footnote);
    if (!marker || !id) return false;
    setOpenNote((current) => current?.id === id ? null : { id, label: marker.textContent?.trim() || String(id) });
    return true;
  };
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
        const body = <><b>{word.arabicText}</b>{wordDisplay.transliteration && word.transliteration ? <small dir="ltr">{word.transliteration}</small> : null}{wordDisplay.meaning && word.translation ? <em dir="auto">{word.translation}</em> : null}</>;
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
        <div ref={translationRef} className={styles.translation} dir="auto" translate="no" onClick={(event) => toggleNoteFrom(event.target)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { if (toggleNoteFrom(event.target)) event.preventDefault(); } }} dangerouslySetInnerHTML={{ __html: verse.translationText }} />
        {verse.translationName || translationResourceName ? <p className={styles.attribution}>— {verse.translationName ?? translationResourceName}{translationAuthor && !(verse.translationName ?? translationResourceName ?? "").includes(translationAuthor) ? `, ${translationAuthor}` : ""}</p> : null}
        {openNote ? <TranslatorNote id={openNote.id} label={openNote.label} translationName={verse.translationName ?? translationResourceName} panelId={notePanelId} onClose={() => setOpenNote(null)} /> : null}
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

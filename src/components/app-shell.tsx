"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";

import PrayerTimes from "@/components/prayer-times";
import type {
  ContentPreviewItem,
  ReaderPayload,
  RecitationResource,
  SearchItem,
  TafsirResource,
  TranslationResource,
} from "@/lib/types";
import { hasLocalBookmark, readLocalBookmarks, toggleLocalBookmark } from "@/lib/local-bookmarks";
import styles from "./app-shell.module.css";

type Theme = "light" | "dark" | "sepia";
type ChaptersPayload = { error: string | null; items: ContentPreviewItem[] };
type TranslationsPayload = { error: string | null; items: TranslationResource[] };
type RecitationsPayload = { error: string | null; items: RecitationResource[] };
type TafsirsPayload = { error: string | null; items: TafsirResource[] };
type LastRead = { chapterId: number; chapterName: string; verseNumber: number };
type SearchPayload = {
  error: string | null;
  navigationItems: SearchItem[];
  query: string;
  verseItems: SearchItem[];
};

const fetchJson = async <T,>(url: string): Promise<T> => {
  const response = await fetch(url, { credentials: "include" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw payload;
  return payload as T;
};

const messageOf = (error: unknown) => {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Quran content is unavailable right now. Please try again.";
};

function Icon({ name }: { name: "home" | "quran" | "saved" | "more" }) {
  const paths = {
    home: <><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/></>,
    quran: <><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v18H7.5A3.5 3.5 0 0 0 4 23Z"/><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H13v18h3.5A3.5 3.5 0 0 1 20 23Z"/></>,
    saved: <path d="M6 3h12v19l-6-4-6 4Z"/>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24">{paths[name]}</svg>;
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const params = useParams<{ chapterId?: string; verseNumber?: string; collection?: string; number?: string }>();
  const router = useRouter();
  const quranToolRoute = pathname.startsWith("/quran/mushaf") || pathname.startsWith("/quran/structure");
  const route = pathname === "/" ? "home" : pathname.startsWith("/quran") ? "quran" : pathname.startsWith("/sunnah") || pathname.startsWith("/hadith") ? "sunnah" : pathname.startsWith("/salah-times") ? "salah" : pathname.startsWith("/dua") ? "dua" : pathname.startsWith("/qibla") ? "qibla" : pathname.startsWith("/masjid-finder") ? "masjid" : pathname.startsWith("/search") ? "search" : "other";
  const chapterId = params?.chapterId;
  const verseNumber = params?.verseNumber;
  const [theme, setTheme] = useState<Theme>("light");
  const [arabicSize, setArabicSize] = useState(40);
  const [translationSize, setTranslationSize] = useState(17);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tajweedEnabled, setTajweedEnabled] = useState(false);
  const [filter, setFilter] = useState("");
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [selectedTranslation, setSelectedTranslation] = useState<number | null>(null);
  const [selectedRecitation, setSelectedRecitation] = useState<number | null>(null);
  const [playingVerseKey, setPlayingVerseKey] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [wordMode, setWordMode] = useState(false);
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const [selectedTafsir, setSelectedTafsir] = useState<number | null>(null);
  const [localBookmarks, setLocalBookmarks] = useState(readLocalBookmarks);

  const { data: chapters, error: chaptersError, isLoading: chaptersLoading } =
    useSWR<ChaptersPayload>(route === "home" || (route === "quran" && !chapterId) ? "/api/chapters" : null, fetchJson, { revalidateOnFocus: false });
  const { data: translations, error: translationsError } =
    useSWR<TranslationsPayload>(chapterId ? "/api/translations" : null, fetchJson, { revalidateOnFocus: false });
  const { data: recitations, error: recitationsError } =
    useSWR<RecitationsPayload>(chapterId ? "/api/recitations" : null, fetchJson, { revalidateOnFocus: false });
  const { data: tafsirs, error: tafsirsError } =
    useSWR<TafsirsPayload>(chapterId ? "/api/tafsirs" : null, fetchJson, { revalidateOnFocus: false });
  const { data: reader, error: readerError, isLoading: readerLoading } =
    useSWR<ReaderPayload>(chapterId && selectedTranslation && selectedRecitation ? `/api/reader/${chapterId}?translation=${selectedTranslation}&recitation=${selectedRecitation}${wordMode?"&words=1":""}${tafsirOpen&&selectedTafsir?`&tafsir=${selectedTafsir}`:""}` : null, fetchJson, { revalidateOnFocus: false });
  const { data: searchResults, error: searchError, isLoading: searchLoading } =
    useSWR<SearchPayload>(route === "search" && searchQuery ? `/api/search?query=${encodeURIComponent(searchQuery)}` : null, fetchJson, { keepPreviousData: true, revalidateOnFocus: false });

  useEffect(() => {
    const savedTheme = localStorage.getItem("af-theme") as Theme | null;
    const savedLastRead = localStorage.getItem("af-last-read");
    const savedArabic = Number(localStorage.getItem("af-arabic-size"));
    const savedTranslation = Number(localStorage.getItem("af-translation-size"));
    setTajweedEnabled(localStorage.getItem("af-tajweed") === "true");
    const initialTheme = savedTheme ?? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
    if (savedLastRead) { try { setLastRead(JSON.parse(savedLastRead) as LastRead); } catch {} }
    if (savedArabic >= 30 && savedArabic <= 64) setArabicSize(savedArabic);
    if (savedTranslation >= 14 && savedTranslation <= 26) setTranslationSize(savedTranslation);
  }, []);

  useEffect(() => {
    if (!translations?.items.length) return;
    const saved = Number(localStorage.getItem("af-translation-id"));
    const availableSaved = translations.items.find((item) => item.id === saved);
    const documentedDefault = translations.items.find((item) => item.id === 131);
    setSelectedTranslation(
      availableSaved?.id ?? documentedDefault?.id ?? translations.items[0].id,
    );
  }, [translations]);

  useEffect(() => {
    if (!recitations?.items.length) return;
    const saved = Number(localStorage.getItem("af-recitation-id"));
    setSelectedRecitation(recitations.items.find(item => item.id === saved)?.id ?? recitations.items.find(item => item.id === 7)?.id ?? recitations.items[0].id);
  }, [recitations]);

  useEffect(() => {
    if (!tafsirs?.items.length) return;
    const saved=Number(localStorage.getItem("af-tafsir-id"));
    setSelectedTafsir(tafsirs.items.find(item=>item.id===saved)?.id??tafsirs.items[0].id);
  },[tafsirs]);

  useEffect(()=>setLocalBookmarks(readLocalBookmarks()),[]);

  useEffect(() => {
    if (playingVerseKey) audioRef.current?.play().catch(() => setPlayingVerseKey(null));
  }, [playingVerseKey]);

  useEffect(() => {
    if (!reader?.chapter) return;
    const next = { chapterId: reader.chapter.id, chapterName: reader.chapter.nameSimple, verseNumber: Number(verseNumber) || 1 };
    setLastRead(next);
    localStorage.setItem("af-last-read", JSON.stringify(next));
  }, [reader?.chapter, verseNumber]);

  useEffect(() => {
    if (!reader || !verseNumber) return;
    document.getElementById(`verse-${verseNumber}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [reader, verseNumber]);

  const filteredChapters = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return chapters?.items ?? [];
    return (chapters?.items ?? []).filter((chapter) =>
      [chapter.id, chapter.nameSimple, chapter.nameArabic, chapter.translatedName].some((value) => String(value ?? "").toLowerCase().includes(query)),
    );
  }, [chapters, filter]);
  const selectedTranslationResource = translations?.items.find(item => item.id === selectedTranslation);
  const selectedTafsirResource = tafsirs?.items.find(item => item.id === selectedTafsir);

  const changeTheme = (next: Theme) => {
    setTheme(next); document.documentElement.dataset.theme = next; localStorage.setItem("af-theme", next);
  };
  const changeSize = (kind: "arabic" | "translation", value: number) => {
    if (kind === "arabic") { setArabicSize(value); localStorage.setItem("af-arabic-size", String(value)); }
    else { setTranslationSize(value); localStorage.setItem("af-translation-size", String(value)); }
  };
  const changeTranslation = (value: number) => {
    setSelectedTranslation(value);
    localStorage.setItem("af-translation-id", String(value));
  };
  const changeRecitation = (value: number) => {
    audioRef.current?.pause();
    setPlayingVerseKey(null);
    setSelectedRecitation(value);
    localStorage.setItem("af-recitation-id", String(value));
  };
  const playVerse = (verseKey: string | null) => {
    if (!verseKey) return;
    if (playingVerseKey === verseKey && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      return;
    }
    setPlayingVerseKey(verseKey);
  };
  const playNextVerse = () => {
    const index = reader?.verses.findIndex(verse => verse.verseKey === playingVerseKey) ?? -1;
    const next = reader?.verses[index + 1];
    setPlayingVerseKey(next?.audioUrl ? next.verseKey : null);
  };
  const jump = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const verse = Number(data.get("verse"));
    if (reader && verse >= 1 && verse <= (reader.chapter.versesCount ?? 0)) router.push(`/quran/${reader.chapter.id}/${verse}`);
  };
  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchQuery(searchInput.trim());
  };

  const renderHome = () => <main className={styles.main}>
    <section className={styles.hero}>
      <p className={styles.kicker}>بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ</p>
      <h1>A quiet place<br/>to return to the Quran.</h1>
      <p>Read with clarity, continue without friction, and keep the Quran at the center.</p>
      <Link className={styles.primary} href={lastRead ? `/quran/${lastRead.chapterId}/${lastRead.verseNumber}` : "/quran/1"}>Begin reading <span>→</span></Link>
    </section>
    <section className={styles.homeGrid}>
      <article className={styles.continueCard}>
        <p className={styles.label}>Continue reading</p>
        <div><div><h2>{lastRead?.chapterName ?? chapters?.items?.[0]?.nameSimple ?? "Al-Fatihah"}</h2><p>{lastRead ? `Ayah ${lastRead.verseNumber}` : "The Opening"}</p></div><span className={styles.arabicTitle}>{lastRead ? "اقرأ" : chapters?.items?.[0]?.nameArabic ?? "الفاتحة"}</span></div>
        <Link href={lastRead ? `/quran/${lastRead.chapterId}/${lastRead.verseNumber}` : "/quran/1"}>Resume <span>→</span></Link>
      </article>
      <Link className={styles.entryCard} href="/quran"><span className={styles.entryIcon}><Icon name="quran"/></span><div><p className={styles.label}>Quran</p><h2>Browse all 114 Surahs</h2><p>Arabic text and trusted translations from Quran.Foundation.</p></div><b>→</b></Link>
    </section>
    <PrayerTimes/>
    <section className={styles.quickLinks}><Link href="/dua"><span>Dua</span><b>Daily remembrance →</b></Link><Link href="/qibla"><span>Qibla</span><b>Find the direction →</b></Link><Link href="/masjid-finder"><span>Nearby</span><b>Find a masjid →</b></Link></section>
    <section className={styles.promise}><p className={styles.label}>Our promise</p><h2>No ads. No paywalls. No generated scripture.</h2><p>Every religious text in Al-Furqan stays attached to an identified source.</p></section>
  </main>;

  const renderLibrary = () => <main className={styles.main}>
    <header className={styles.pageHeader}><p className={styles.kicker}>The Noble Quran</p><h1>Choose a Surah</h1><p>Browse the complete Quran. Reading never requires an account.</p></header>
    <div className={styles.quranBrowseTools}><Link href="/quran/mushaf/1">Mushaf view</Link><Link href="/quran/structure">Browse by Juz, Hizb, or Rub</Link></div>
    <label className={styles.search}><span>⌕</span><input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search by Surah name or number"/><kbd>114</kbd></label>
    {chaptersLoading ? <div className={styles.skeletonGrid} aria-label="Loading chapters">{Array.from({length: 9},(_,i)=><i key={i}/>)}</div> : null}
    {chaptersError ? <ErrorState message={messageOf(chaptersError)}/> : null}
    {!chaptersLoading && !chaptersError ? <div className={styles.chapterList}>{filteredChapters.map(chapter => <Link href={chapter.readerUrl} className={styles.chapterRow} key={chapter.id}><span className={styles.chapterNumber}>{chapter.id}</span><div><h2>{chapter.nameSimple}</h2><p>{chapter.translatedName} · {chapter.versesCount} Ayahs</p></div><strong lang="ar" dir="rtl" translate="no">{chapter.nameArabic}</strong><b>›</b></Link>)}</div> : null}
    {!chaptersLoading && !chaptersError && filteredChapters.length === 0 ? <p className={styles.empty}>No Surahs match your search.</p> : null}
  </main>;

  const renderReader = () => <main className={`${styles.main} ${styles.readerMain}`} style={{"--arabic-size": `${arabicSize}px`, "--translation-size": `${translationSize}px`} as React.CSSProperties}>
    {readerLoading || (chapterId && (!selectedTranslation || !selectedRecitation) && !translationsError && !recitationsError) ? <ReaderSkeleton/> : null}
    {readerError || translationsError || recitationsError || tafsirsError ? <ErrorState message={messageOf(readerError ?? translationsError ?? recitationsError ?? tafsirsError)}/> : null}
    {reader ? <>
      <header className={styles.readerHeader}><div><Link href="/quran">← All Surahs</Link><p>Surah {reader.chapter.id}</p><h1>{reader.chapter.nameSimple}</h1><span>{reader.chapter.translatedName} · {reader.chapter.versesCount} Ayahs</span></div><strong lang="ar" dir="rtl" translate="no">{reader.chapter.nameArabic}</strong></header>
      <div className={styles.readerTools}><form onSubmit={jump}><label>Jump to Ayah <input name="verse" type="number" min="1" max={reader.chapter.versesCount ?? undefined} defaultValue={verseNumber ?? "1"}/></label><button>Go</button></form><label className={styles.translationPicker}>Translation <select aria-label="Quran translation" value={selectedTranslation ?? ""} onChange={event => changeTranslation(Number(event.target.value))}>{translations?.items.map(item => <option key={item.id} value={item.id}>{item.name}{item.authorName ? ` — ${item.authorName}` : ""}</option>)}</select></label><label className={styles.recitationPicker}>Reciter <select aria-label="Quran reciter" value={selectedRecitation ?? ""} onChange={event => changeRecitation(Number(event.target.value))}>{recitations?.items.map(item => <option key={item.id} value={item.id}>{item.name}{item.style ? ` — ${item.style}` : ""}</option>)}</select></label><button onClick={() => setSettingsOpen(true)}>Aa <span>Reader settings</span></button></div>
      <div className={styles.studyTools}><button className={wordMode?styles.selectedStudy:""} onClick={()=>setWordMode(value=>!value)}>Word by word</button><button className={tafsirOpen?styles.selectedStudy:""} onClick={()=>setTafsirOpen(value=>!value)}>Tafsir</button>{tafsirOpen?<label>Tafsir source<select value={selectedTafsir??""} onChange={event=>{const value=Number(event.target.value);setSelectedTafsir(value);localStorage.setItem("af-tafsir-id",String(value))}}>{tafsirs?.items.map(item=><option value={item.id} key={item.id}>{item.name}{item.authorName?` — ${item.authorName}`:""}</option>)}</select></label>:null}<Link href="/quran/mushaf/1">Mushaf view</Link><Link href="/quran/structure">Juz & structure</Link></div>
      {tajweedEnabled ? <aside className={styles.tajweedLegend} aria-label="Tajweed color legend"><strong>Tajweed colors</strong><span><i className={styles.tjMadd}/>Madd</span><span><i className={styles.tjGhunnah}/>Ghunnah</span><span><i className={styles.tjIkhfa}/>Ikhfa</span><span><i className={styles.tjIdgham}/>Idgham</span><span><i className={styles.tjQalqalah}/>Qalqalah</span><span><i className={styles.tjSilent}/>Silent letters</span></aside> : null}
      <section className={styles.verses} aria-label={`${reader.chapter.nameSimple} verses`}>{reader.verses.map(verse => {const bookmarkId=`quran:${verse.verseKey}`;return <article id={`verse-${verse.verseNumber}`} className={styles.verse} key={verse.id}><div className={styles.verseMeta}><a href={`#verse-${verse.verseNumber}`}>{verse.verseKey}</a><div>{verse.audioUrl ? <button className={styles.playVerse} aria-label={`${playingVerseKey === verse.verseKey ? "Pause" : "Play"} recitation of Ayah ${verse.verseNumber}`} onClick={() => playVerse(verse.verseKey)}>{playingVerseKey === verse.verseKey ? "❚❚" : "▶"}</button> : null}<button className={styles.saveVerse} onClick={()=>setLocalBookmarks(toggleLocalBookmark({id:bookmarkId,label:`${reader.chapter.nameSimple} ${verse.verseKey}`,reference:verse.verseKey??"",type:"quran",url:`/quran/${reader.chapter.id}/${verse.verseNumber}`}))}>{hasLocalBookmark(localBookmarks,bookmarkId)?"Saved":"Save"}</button><Link aria-label={`Open Ayah ${verse.verseNumber}`} href={`/quran/${reader.chapter.id}/${verse.verseNumber}`}>•••</Link></div></div>{wordMode&&verse.words.length?<div className={styles.wordGrid} lang="ar" dir="rtl" translate="no">{verse.words.filter(word=>word.charType==="word").map(word=><span key={word.position}><b>{word.arabicText}</b><small dir="ltr">{word.transliteration}</small><em dir="ltr">{word.translation}</em></span>)}</div>:tajweedEnabled && verse.tajweedHtml ? <p className={`${styles.arabic} ${styles.tajweed}`} lang="ar" dir="rtl" translate="no" dangerouslySetInnerHTML={{__html: verse.tajweedHtml}}/> : <p className={styles.arabic} lang="ar" dir="rtl" translate="no">{verse.arabicText}</p>}{verse.translationText ? <><div className={styles.translation} lang="en" translate="no" dangerouslySetInnerHTML={{__html: verse.translationText}}/>{verse.translationName || selectedTranslationResource ? <p className={styles.attribution}>Translation: {verse.translationName ?? selectedTranslationResource?.name}{selectedTranslationResource?.authorName ? ` — ${selectedTranslationResource.authorName}` : ""}</p> : null}</> : <p className={styles.unavailable}>The selected translation is unavailable for this Ayah.</p>}{tafsirOpen?<details className={styles.tafsir}><summary>Tafsir · {verse.tafsirName??selectedTafsirResource?.name??"Selected source"}</summary>{verse.tafsirText?<p translate="no">{verse.tafsirText}</p>:<p className={styles.unavailable}>No tafsir entry was returned for this Ayah.</p>}</details>:null}</article>})}</section>
      {playingVerseKey ? <div className={styles.audioPlayer}><span>Reciting {playingVerseKey}</span><audio ref={audioRef} controls autoPlay src={reader.verses.find(verse => verse.verseKey === playingVerseKey)?.audioUrl ?? undefined} onEnded={playNextVerse} onError={() => setPlayingVerseKey(null)}>Your browser does not support audio playback.</audio><button aria-label="Close audio player" onClick={() => { audioRef.current?.pause(); setPlayingVerseKey(null); }}>×</button></div> : null}
      <nav className={styles.chapterNav}>{reader.chapter.id > 1 ? <Link href={`/quran/${reader.chapter.id-1}`}>← Previous Surah</Link> : <span/>}{reader.chapter.id < 114 ? <Link href={`/quran/${reader.chapter.id+1}`}>Next Surah →</Link> : null}</nav>
    </> : null}
  </main>;

  const renderSearch = () => <main className={styles.main}>
    <header className={styles.pageHeader}><p className={styles.kicker}>Quran search</p><h1>Find a verse</h1><p>Search Quran.Foundation&apos;s indexed Quran content and open results in reading context.</p></header>
    <form className={styles.searchForm} role="search" onSubmit={search}><label htmlFor="quran-search">Search the Quran</label><div><input id="quran-search" type="search" value={searchInput} onChange={event => setSearchInput(event.target.value)} placeholder="Try mercy, guidance, or an Arabic phrase"/><button disabled={!searchInput.trim()}>Search</button></div></form>
    {searchLoading ? <div className={styles.searchLoading} aria-live="polite">Searching…</div> : null}
    {searchError || searchResults?.error ? <ErrorState message={messageOf(searchError ?? { message: searchResults?.error })}/> : null}
    {searchResults && !searchResults.error ? <section className={styles.results} aria-live="polite"><p className={styles.label}>Results for “{searchResults.query}”</p>{searchResults.navigationItems.map((item,index) => <Link className={styles.result} href={item.readerUrl ?? "/quran"} key={`navigation-${index}`}><div><h2>{item.label}</h2><p>{item.subtitle}</p></div><b>→</b></Link>)}{searchResults.verseItems.map((item,index) => <Link className={styles.result} href={item.readerUrl ?? "/quran"} key={`${item.verseKey}-${index}`}><div><span>{item.verseKey}</span>{item.arabicText ? <p className={styles.resultArabic} lang="ar" dir="rtl" translate="no">{item.arabicText}</p> : null}<p translate="no">{item.text}</p></div><b>→</b></Link>)}{searchResults.navigationItems.length + searchResults.verseItems.length === 0 ? <p className={styles.empty}>No results were found. Try another word or phrase.</p> : null}</section> : null}
  </main>;

  return <div className={styles.app}>
    <header className={styles.topbar}><Link className={styles.brand} href="/"><span>ف</span><div><strong>Al-Furqan</strong><small>الفرقان</small></div></Link><nav><Link className={route === "quran" ? styles.active : ""} href="/quran">Quran</Link><Link className={route === "sunnah" ? styles.active : ""} href="/sunnah">Sunnah</Link><Link className={route === "salah" ? styles.active : ""} href="/salah-times">Salah Times</Link><Link className={route === "dua" ? styles.active : ""} href="/dua">Dua</Link><Link className={route === "qibla" ? styles.active : ""} href="/qibla">Qibla</Link><Link className={route === "masjid" ? styles.active : ""} href="/masjid-finder">Masjid Finder</Link></nav><div className={styles.actions}><button aria-label="Toggle reading theme" onClick={() => changeTheme(theme === "light" ? "dark" : theme === "dark" ? "sepia" : "light")}>◐</button><button onClick={() => setSettingsOpen(true)}>Aa</button></div></header>
    {route === "home" ? renderHome() : quranToolRoute ? children : route === "quran" && !chapterId ? renderLibrary() : route === "quran" ? renderReader() : route === "sunnah" ? <FeatureUnavailable/> : route === "search" ? renderSearch() : children}
    <nav className={styles.mobileNav}><Link className={route === "quran" ? styles.active : ""} href="/quran"><Icon name="quran"/><span>Quran</span></Link><Link className={route === "sunnah" ? styles.active : ""} href="/sunnah"><span className={styles.mobileGlyph}>◉</span><span>Sunnah</span></Link><Link className={route === "salah" ? styles.active : ""} href="/salah-times"><span className={styles.mobileGlyph}>◷</span><span>Salah</span></Link><Link className={route === "dua" ? styles.active : ""} href="/dua"><span className={styles.mobileGlyph}>✦</span><span>Dua</span></Link><button className={route === "qibla" || route === "masjid" ? styles.active : ""} onClick={()=>setMoreOpen(value=>!value)}><Icon name="more"/><span>More</span></button></nav>
    {moreOpen?<div className={styles.moreMenu} role="dialog" aria-label="More navigation"><Link href="/qibla" onClick={()=>setMoreOpen(false)}>Qibla <span>→</span></Link><Link href="/masjid-finder" onClick={()=>setMoreOpen(false)}>Masjid Finder <span>→</span></Link></div>:null}
    {settingsOpen ? <div className={styles.scrim} onMouseDown={() => setSettingsOpen(false)}><aside className={styles.settings} role="dialog" aria-modal="true" aria-labelledby="reader-settings" onMouseDown={e => e.stopPropagation()}><header><h2 id="reader-settings">Reader settings</h2><button aria-label="Close settings" onClick={() => setSettingsOpen(false)}>×</button></header><fieldset><legend>Reading theme</legend><div className={styles.themeOptions}>{(["light","dark","sepia"] as Theme[]).map(value=><button className={theme===value?styles.selected:""} onClick={()=>changeTheme(value)} key={value}><i className={styles[value]}/>{value}</button>)}</div></fieldset><label className={styles.toggleSetting}>Tajweed colors <input type="checkbox" checked={tajweedEnabled} onChange={event => { setTajweedEnabled(event.target.checked); localStorage.setItem("af-tajweed", String(event.target.checked)); }}/></label><label>Arabic text size <output>{arabicSize}px</output><input type="range" min="30" max="64" value={arabicSize} onChange={e=>changeSize("arabic", Number(e.target.value))}/></label><label>Translation size <output>{translationSize}px</output><input type="range" min="14" max="26" value={translationSize} onChange={e=>changeSize("translation", Number(e.target.value))}/></label><p>Text and tajweed annotations are provided by Quran.Foundation. Quran and translation content is protected from automatic browser translation.</p></aside></div> : null}
  </div>;
}

function ErrorState({message}:{message:string}) { return <section className={styles.error} role="alert"><span>!</span><h2>We could not load this content</h2><p>{message}</p><button onClick={()=>location.reload()}>Try again</button></section>; }
function FeatureUnavailable() { return <main className={styles.main}><section className={styles.error} role="status"><span>•</span><h2>Sunnah is temporarily unavailable</h2><p>We are preparing a verified Sunnah.com integration. Sunnah browsing will return only after its source and production API access have been validated.</p><Link className={styles.primary} href="/quran">Read the Quran</Link></section></main>; }
function ReaderSkeleton() { return <div className={styles.readerSkeleton} aria-label="Loading Quran"><i/><i/><i/></div>; }

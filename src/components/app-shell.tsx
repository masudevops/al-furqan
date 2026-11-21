"use client";

import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import useSWR, { preload } from "swr";

import PrayerTimes from "@/components/prayer-times";
import DailyContent from "@/components/daily-content";
import MutashabihatPanel from "@/components/mutashabihat-panel";
import { fetchJson } from "@/components/quran-reader/fetch-json";
import { glyphPages, hasCompleteGlyphs, tajweedPaletteCss } from "@/components/quran-reader/qcf-tajweed";
import ReaderToolbar from "@/components/quran-reader/reader-toolbar";
import ReaderSettings, { type Theme } from "@/components/quran-reader/reader-settings";
import SurahHeader from "@/components/quran-reader/surah-header";
import VerseCard, { type VerseActions } from "@/components/quran-reader/verse-card";
import readerStyles from "@/components/quran-reader/quran-reader.module.css";
import {
  normalizeAyahRange,
  resolveNextAudioStep,
  type AyahRepeatCount,
} from "@/core/quran/audio";
import type {
  ContentPreviewItem,
  ChapterAudioPayload,
  ChapterInfoPayload,
  ChapterReciterResource,
  ReaderPayload,
  QuranScript,
  RecitationResource,
  SearchItem,
  TajweedGlyphPayload,
  TajweedGlyphWord,
  TafsirResource,
  TranslationResource,
} from "@/lib/types";
import { hasLocalBookmark, readLocalBookmarks, toggleLocalBookmark } from "@/lib/local-bookmarks";
import { publicFeatures } from "@/lib/features";
import { readMushafPage, readReadingMode, resumeHref, saveReadingMode, type ReadingMode } from "@/lib/reading-mode";
import styles from "./app-shell.module.css";

type ChaptersPayload = { error: string | null; items: ContentPreviewItem[] };
type TranslationsPayload = { error: string | null; items: TranslationResource[] };
type RecitationsPayload = { error: string | null; items: RecitationResource[] };
type ChapterRecitersPayload = { error: string | null; items: ChapterReciterResource[] };
type TafsirsPayload = { error: string | null; items: TafsirResource[] };
type LastRead = { chapterId: number; chapterName: string; verseNumber: number };
type QuranBrowseMode = "surah" | "juz" | "revelation";
type SearchPayload = {
  error: string | null;
  navigationItems: SearchItem[];
  query: string;
  verseItems: SearchItem[];
};

export const preferredTranslation = (items: TranslationResource[]) =>
  items.find((item) => /\b(saheeh|sahih) international\b/i.test(item.name));

export const preferredRecitation = (items: RecitationResource[]) =>
  items.find((item) => /minshawi/i.test(item.name) && /murattal/i.test(item.style ?? ""))
  ?? items.find((item) => /minshawi/i.test(item.name));

const messageOf = (error: unknown) => {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Quran content is unavailable right now. Please try again.";
};

function Icon({ name }: { name: "home" | "quran" | "saved" | "more" | "search" | "settings" }) {
  const paths = {
    home: <><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v10h13V10"/></>,
    quran: <><path d="M4 5.5A3.5 3.5 0 0 1 7.5 2H11v18H7.5A3.5 3.5 0 0 0 4 23Z"/><path d="M20 5.5A3.5 3.5 0 0 0 16.5 2H13v18h3.5A3.5 3.5 0 0 1 20 23Z"/></>,
    saved: <path d="M6 3h12v19l-6-4-6 4Z"/>,
    more: <><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.1A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3V9.6h.1A1.7 1.7 0 0 0 4.6 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.5 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.16.37.37.7.6 1 .3.3.68.48 1.1.5h.1v4h-.1c-.42.02-.8.2-1.1.5-.23.3-.44.63-.6 1Z"/></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24">{paths[name]}</svg>;
}

// Long Surahs render in batches so the first Ayahs appear without blocking the page on all of them.
const INITIAL_VERSE_BATCH = 20;
const VERSE_BATCH = 30;

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const params = useParams<{ chapterId?: string; verseNumber?: string; collection?: string; number?: string }>();
  const router = useRouter();
  const quranToolRoute = pathname.startsWith("/quran/mushaf") || pathname.startsWith("/quran/structure") || pathname.startsWith("/quran/range");
  const route = pathname === "/" ? "home" : pathname.startsWith("/quran") ? "quran" : pathname.startsWith("/sunnah") || pathname.startsWith("/hadith") ? "sunnah" : pathname.startsWith("/salah-times") ? "salah" : pathname.startsWith("/dua") ? "dua" : pathname.startsWith("/qibla") ? "qibla" : pathname.startsWith("/masjid-finder") ? "masjid" : pathname.startsWith("/search") ? "search" : "other";
  const chapterId = params?.chapterId;
  const verseNumber = params?.verseNumber;
  const [theme, setTheme] = useState<Theme>("sepia");
  const [arabicSize, setArabicSize] = useState(40);
  const [translationSize, setTranslationSize] = useState(17);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tajweedEnabled, setTajweedEnabled] = useState(true);
  const [quranScript, setQuranScript] = useState<QuranScript>("uthmani");
  const [filter, setFilter] = useState("");
  const [quranBrowseMode, setQuranBrowseMode] = useState<QuranBrowseMode>("surah");
  const [quranBrowseAscending, setQuranBrowseAscending] = useState(true);
  const [lastRead, setLastRead] = useState<LastRead | null>(null);
  const [selectedTranslation, setSelectedTranslation] = useState<number | null>(null);
  const [selectedRecitation, setSelectedRecitation] = useState<number | null>(null);
  const [copiedVerseKey, setCopiedVerseKey] = useState<string | null>(null);
  const [playingVerseKey, setPlayingVerseKey] = useState<string | null>(null);
  const [audioPaused, setAudioPaused] = useState(false);
  const [followRecitation, setFollowRecitation] = useState(true);
  const [memorizationOpen, setMemorizationOpen] = useState(false);
  const [repeatCount, setRepeatCount] = useState<AyahRepeatCount>(1);
  const [playbackIteration, setPlaybackIteration] = useState(1);
  const [rangeStart, setRangeStart] = useState(1);
  const [rangeEnd, setRangeEnd] = useState(1);
  const [activeRange, setActiveRange] = useState(false);
  const [pauseSeconds, setPauseSeconds] = useState(0);
  const [loopRange, setLoopRange] = useState(false);
  const [rangeError, setRangeError] = useState<string | null>(null);
  const [selectedChapterReciter, setSelectedChapterReciter] = useState<number | null>(null);
  const [synchronizedAudio, setSynchronizedAudio] = useState<ChapterAudioPayload | null>(null);
  const [activeWordPosition, setActiveWordPosition] = useState<number | null>(null);
  const [synchronizedLoading, setSynchronizedLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const settingsDialogRef = useRef<HTMLElement>(null);
  const settingsTriggerRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const playbackTimerRef = useRef<number | null>(null);
  const completedPlayRef = useRef(1);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const [wordMode, setWordMode] = useState(false);
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const [bookmarkNotice, setBookmarkNotice] = useState<{ id: string; saved: boolean } | null>(null);
  const [readingMode, setReadingMode] = useState<ReadingMode>("verses");
  const [mushafPage, setMushafPage] = useState<number | null>(null);
  const [chapterInfoOpen, setChapterInfoOpen] = useState(false);
  const [selectedTafsir, setSelectedTafsir] = useState<number | null>(null);
  const [localBookmarks, setLocalBookmarks] = useState(readLocalBookmarks);

  const closeSettings = () => setSettingsOpen(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("settings") === "open") setSettingsOpen(true);
  }, [pathname]);

  // The Mushaf view (outside this shell's state) can change the mode and page, so re-read them on navigation.
  useEffect(() => {
    setReadingMode(readReadingMode());
    setMushafPage(readMushafPage());
  }, [pathname]);

  useEffect(() => {
    if (!settingsOpen) return;
    if (!restoreFocusRef.current) restoreFocusRef.current = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : settingsTriggerRef.current;
    const dialog = settingsDialogRef.current;
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not([disabled]), select:not([disabled]), input:not([disabled]), [href]') ?? []);
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeSettings(); return; }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); restoreFocusRef.current?.focus(); restoreFocusRef.current = null; };
  }, [settingsOpen]);

  const copyVerseLink = async (verseKey:string,chapter:number|null,verse:number|null,details:HTMLDetailsElement|null) => {
    try {
      await navigator.clipboard.writeText(`${location.origin}/quran/${chapter}/${verse}`);
      setCopiedVerseKey(verseKey);
      if(details)details.open=false;
      window.setTimeout(()=>setCopiedVerseKey(current=>current===verseKey?null:current),1800);
    } catch { setCopiedVerseKey(null); }
  };

  const shareVerseLink = async (verseKey:string,chapter:number|null,verse:number|null,details:HTMLDetailsElement|null) => {
    const url = `${location.origin}/quran/${chapter}/${verse}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Quran ${verseKey}`, text: `Quran ${verseKey}`, url });
        if(details)details.open=false;
        return;
      }
      await copyVerseLink(verseKey,chapter,verse,details);
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setCopiedVerseKey(null);
    }
  };

  const { data: chapters, error: chaptersError, isLoading: chaptersLoading } =
    useSWR<ChaptersPayload>(route === "home" || route === "quran" ? "/api/chapters" : null, fetchJson, { revalidateOnFocus: false });
  const { data: translations, error: translationsError } =
    useSWR<TranslationsPayload>(chapterId ? "/api/translations" : null, fetchJson, { revalidateOnFocus: false });
  const { data: recitations, error: recitationsError } =
    useSWR<RecitationsPayload>(chapterId ? "/api/recitations" : null, fetchJson, { revalidateOnFocus: false });
  const { data: chapterReciters, error: chapterRecitersError } =
    useSWR<ChapterRecitersPayload>(chapterId ? "/api/chapter-reciters" : null, fetchJson, { revalidateOnFocus: false });
  const { data: tafsirs, error: tafsirsError } =
    useSWR<TafsirsPayload>(chapterId ? "/api/tafsirs" : null, fetchJson, { revalidateOnFocus: false });
  const readerKey = (id: string | number | undefined) => id && selectedTranslation && selectedRecitation ? `/api/reader/${id}?translation=${selectedTranslation}&recitation=${selectedRecitation}&script=${quranScript}${wordMode?"&words=1":""}${tafsirOpen&&selectedTafsir?`&tafsir=${selectedTafsir}`:""}` : null;
  // Start loading a Surah when the reader points at or focuses its link, so the request overlaps navigation.
  const warmReader = (id: string | number) => { const key = readerKey(id); if (key) void preload(key, fetchJson); };
  const warmReaderProps = (id: string | number) => ({ onFocus: () => warmReader(id), onPointerEnter: () => warmReader(id), onTouchStart: () => warmReader(id) });
  const { data: liveReader, error: readerError, isLoading: readerLoading } =
    useSWR<ReaderPayload>(readerKey(chapterId), fetchJson, { revalidateOnFocus: false });
  // Toggling word-by-word, tafsir, or script refetches the chapter; keep showing the current one meanwhile.
  const lastReaderRef = useRef<ReaderPayload | undefined>(undefined);
  if (liveReader) lastReaderRef.current = liveReader;
  const reader = liveReader ?? (lastReaderRef.current?.chapter.id === Number(chapterId) ? lastReaderRef.current : undefined);
  const { data: tajweedGlyphs } =
    useSWR<TajweedGlyphPayload>(chapterId && tajweedEnabled ? `/api/quran/tajweed/${chapterId}` : null, fetchJson, { revalidateOnFocus: false, revalidateIfStale: false });
  const tajweedByVerse = useMemo(() => {
    const byVerse = new Map<string, TajweedGlyphWord[]>();
    if (tajweedGlyphs?.chapterId !== Number(chapterId)) return byVerse;
    for (const verse of tajweedGlyphs.verses) if (hasCompleteGlyphs(verse.words)) byVerse.set(verse.verseKey, verse.words);
    return byVerse;
  }, [chapterId, tajweedGlyphs]);
  const tajweedPalettes = useMemo(() => tajweedPaletteCss(glyphPages(Array.from(tajweedByVerse.values()).flat()), theme), [tajweedByVerse, theme]);
  const chapterInfoKey = chapterId ? `/api/quran/chapter-info/${chapterId}` : null;
  const { data: chapterInfo, error: chapterInfoError, isLoading: chapterInfoLoading } =
    useSWR<ChapterInfoPayload>(chapterInfoOpen ? chapterInfoKey : null, fetchJson, { revalidateOnFocus: false });
  // Warm the Surah introduction so opening it is instant: on intent (hover/focus/press) and once the reader is idle.
  const warmChapterInfo = () => { if (chapterInfoKey) void preload(chapterInfoKey, fetchJson); };
  const readerReadyForWarmup = Boolean(liveReader);
  useEffect(() => {
    if (!chapterInfoKey || !readerReadyForWarmup) return;
    const idleWindow = window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    if (typeof idleWindow.requestIdleCallback === "function") {
      const id = idleWindow.requestIdleCallback(() => void preload(chapterInfoKey, fetchJson), { timeout: 4000 });
      return () => idleWindow.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(() => void preload(chapterInfoKey, fetchJson), 1500);
    return () => window.clearTimeout(id);
  }, [chapterInfoKey, readerReadyForWarmup]);
  const { data: searchResults, error: searchError, isLoading: searchLoading } =
    useSWR<SearchPayload>(route === "search" && searchQuery ? `/api/search?query=${encodeURIComponent(searchQuery)}` : null, fetchJson, { keepPreviousData: true, revalidateOnFocus: false });

  const translationGroups = useMemo(() => {
    const groups = new Map<string, TranslationResource[]>();
    for (const item of translations?.items ?? []) {
      const language = item.languageName?.trim() || "Other languages";
      groups.set(language, [...(groups.get(language) ?? []), item]);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a === "English" ? -1 : b === "English" ? 1 : a.localeCompare(b));
  }, [translations]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("af-theme") as Theme | null;
    const savedLastRead = localStorage.getItem("af-last-read");
    const savedArabic = Number(localStorage.getItem("af-arabic-size"));
    const savedTranslation = Number(localStorage.getItem("af-translation-size"));
    const savedTranslationId = Number(localStorage.getItem("af-translation-id"));
    const savedRecitationId = Number(localStorage.getItem("af-recitation-id"));
    setFollowRecitation(localStorage.getItem("af-follow-recitation") !== "false");
    setReadingMode(readReadingMode());
    setMushafPage(readMushafPage());
    setTajweedEnabled(localStorage.getItem("af-tajweed") !== "false");
    const savedScript = localStorage.getItem("af-quran-script") as QuranScript | null;
    if (["uthmani","uthmani_simple","imlaei","indopak","indopak_nastaleeq"].includes(savedScript ?? "")) setQuranScript(savedScript!);
    const initialTheme = savedTheme ?? "sepia";
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
    if (savedLastRead) { try { setLastRead(JSON.parse(savedLastRead) as LastRead); } catch {} }
    if (savedArabic >= 30 && savedArabic <= 64) setArabicSize(savedArabic);
    if (savedTranslation >= 14 && savedTranslation <= 26) setTranslationSize(savedTranslation);
    if (Number.isInteger(savedTranslationId) && savedTranslationId > 0) setSelectedTranslation(savedTranslationId);
    if (Number.isInteger(savedRecitationId) && savedRecitationId > 0) setSelectedRecitation(savedRecitationId);
  }, []);

  useEffect(() => {
    if (route !== "home" && !(route === "quran" && !chapterId)) return;
    const warmReaderResources = () => {
      void preload("/api/translations", fetchJson);
      void preload("/api/recitations", fetchJson);
    };
    const idleWindow = window as Window & {
      cancelIdleCallback?: (id: number) => void;
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
    };
    if (typeof idleWindow.requestIdleCallback === "function") {
      const id = idleWindow.requestIdleCallback(warmReaderResources, { timeout: 1500 });
      return () => idleWindow.cancelIdleCallback?.(id);
    }
    const id = setTimeout(warmReaderResources, 250);
    return () => clearTimeout(id);
  }, [chapterId, route]);

  useEffect(() => {
    if (!translations?.items.length) return;
    const saved = Number(localStorage.getItem("af-translation-id"));
    const availableSaved = translations.items.find((item) => item.id === saved);
    const selectedId = availableSaved?.id ?? preferredTranslation(translations.items)?.id ?? translations.items[0].id;
    setSelectedTranslation(selectedId);
    localStorage.setItem("af-translation-id", String(selectedId));
  }, [translations]);

  useEffect(() => {
    if (!recitations?.items.length) return;
    const saved = Number(localStorage.getItem("af-recitation-id"));
    const selectedId = recitations.items.find(item => item.id === saved)?.id ?? preferredRecitation(recitations.items)?.id ?? recitations.items[0].id;
    setSelectedRecitation(selectedId);
    localStorage.setItem("af-recitation-id", String(selectedId));
  }, [recitations]);

  useEffect(() => {
    if (!chapterReciters?.items.length) return;
    const saved = Number(localStorage.getItem("af-chapter-reciter-id"));
    setSelectedChapterReciter(chapterReciters.items.find(item => item.id === saved)?.id ?? chapterReciters.items[0].id);
  }, [chapterReciters]);

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
    if (!playingVerseKey || !followRecitation) return;
    const activeVerse = document.querySelector<HTMLElement>(`[data-verse-key="${playingVerseKey}"]`);
    if (!activeVerse) return;

    const frame = window.requestAnimationFrame(() => {
      const bounds = activeVerse.getBoundingClientRect();
      const topBoundary = window.innerWidth <= 900 ? 128 : 144;
      const bottomBoundary = window.innerHeight - (window.innerWidth <= 900 ? 168 : 104);
      if (bounds.top >= topBoundary && bounds.bottom <= bottomBoundary) return;
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      activeVerse.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [followRecitation, playingVerseKey]);

  useEffect(() => () => {
    if (playbackTimerRef.current !== null) window.clearTimeout(playbackTimerRef.current);
  }, []);

  useEffect(() => {
    const verseCount = reader?.chapter.versesCount;
    if (!verseCount) return;
    setRangeStart(1);
    setRangeEnd(verseCount);
    setActiveRange(false);
    completedPlayRef.current = 1;
    setPlaybackIteration(1);
  }, [reader?.chapter.id, reader?.chapter.versesCount]);

  useEffect(() => {
    if (playbackTimerRef.current !== null) {
      window.clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
    audioRef.current?.pause();
    setPlayingVerseKey(null);
    setSynchronizedAudio(null);
    setActiveWordPosition(null);
  }, [chapterId]);

  useEffect(() => {
    if (!reader?.chapter) return;
    const next = { chapterId: reader.chapter.id, chapterName: reader.chapter.nameSimple, verseNumber: Number(verseNumber) || 1 };
    setLastRead(next);
    localStorage.setItem("af-last-read", JSON.stringify(next));
  }, [reader?.chapter, verseNumber]);

  // Scroll to a deep-linked Ayah once per Surah/Ayah, not again when a setting refetches the Surah.
  const scrolledTargetRef = useRef<string | null>(null);
  const readerLoadedChapter = reader?.chapter.id;
  useEffect(() => {
    if (!readerLoadedChapter || !verseNumber) return;
    const target = `${readerLoadedChapter}:${verseNumber}`;
    if (scrolledTargetRef.current === target) return;
    scrolledTargetRef.current = target;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(`verse-${verseNumber}`)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
  }, [readerLoadedChapter, verseNumber]);

  const filteredChapters = useMemo(() => {
    const query = filter.trim().toLowerCase();
    if (!query) return chapters?.items ?? [];
    return (chapters?.items ?? []).filter((chapter) =>
      [chapter.id, chapter.nameSimple, chapter.nameArabic, chapter.translatedName].some((value) => String(value ?? "").toLowerCase().includes(query)),
    );
  }, [chapters, filter]);
  const displayedChapters = useMemo(() => {
    const items = [...filteredChapters];
    if (quranBrowseMode === "revelation") {
      items.sort((a, b) => (a.revelationOrder ?? Number.MAX_SAFE_INTEGER) - (b.revelationOrder ?? Number.MAX_SAFE_INTEGER));
    } else {
      items.sort((a, b) => a.id - b.id);
    }
    return quranBrowseAscending ? items : items.reverse();
  }, [filteredChapters, quranBrowseAscending, quranBrowseMode]);
  const displayedJuz = useMemo(() => {
    const query = filter.trim();
    const items = Array.from({ length: 30 }, (_, index) => index + 1).filter((juz) => !query || String(juz).includes(query));
    return quranBrowseAscending ? items : items.reverse();
  }, [filter, quranBrowseAscending]);
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
    if (playbackTimerRef.current !== null) window.clearTimeout(playbackTimerRef.current);
    playbackTimerRef.current = null;
    audioRef.current?.pause();
    setPlayingVerseKey(null);
    setActiveRange(false);
    setSynchronizedAudio(null);
    setActiveWordPosition(null);
    completedPlayRef.current = 1;
    setPlaybackIteration(1);
    setSelectedRecitation(value);
    localStorage.setItem("af-recitation-id", String(value));
  };
  const changeTajweed = (enabled: boolean) => { setTajweedEnabled(enabled); localStorage.setItem("af-tajweed", String(enabled)); };
  const changeReadingMode = (mode: ReadingMode) => { setReadingMode(mode); saveReadingMode(mode); };
  const changeFollowRecitation = () => {
    setFollowRecitation((current) => {
      const next = !current;
      localStorage.setItem("af-follow-recitation", String(next));
      return next;
    });
  };
  const playVerse = (verseKey: string | null) => {
    if (!verseKey) return;
    if (playbackTimerRef.current !== null) window.clearTimeout(playbackTimerRef.current);
    playbackTimerRef.current = null;
    if (playingVerseKey === verseKey && audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      return;
    }
    if (playingVerseKey === verseKey && audioRef.current?.paused) {
      audioRef.current.play().catch(() => setPlayingVerseKey(null));
      return;
    }
    setActiveRange(false);
    setSynchronizedAudio(null);
    setActiveWordPosition(null);
    completedPlayRef.current = 1;
    setPlaybackIteration(1);
    setPlayingVerseKey(verseKey);
  };
  const playNextVerse = () => {
    if (!reader) return;
    if (synchronizedAudio) {
      stopAudio();
      return;
    }
    const next = resolveNextAudioStep({
      activeRange,
      completedPlay: completedPlayRef.current,
      currentVerseKey: playingVerseKey,
      loopRange,
      rangeEnd,
      rangeStart,
      repeatCount,
      verses: reader.verses,
    });
    const advance = () => {
      playbackTimerRef.current = null;
      if (next.replayCurrent && audioRef.current) {
        completedPlayRef.current += 1;
        setPlaybackIteration(completedPlayRef.current);
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => setPlayingVerseKey(null));
        return;
      }
      completedPlayRef.current = 1;
      setPlaybackIteration(1);
      if (!next.nextVerseKey) setActiveRange(false);
      setPlayingVerseKey(next.nextVerseKey);
    };
    if (pauseSeconds > 0 && (next.replayCurrent || next.nextVerseKey)) {
      setAudioPaused(true);
      playbackTimerRef.current = window.setTimeout(advance, pauseSeconds * 1000);
    } else {
      advance();
    }
  };
  const startAyahRange = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!reader) return;
    const formData = new FormData(event.currentTarget);
    const range = normalizeAyahRange(Number(formData.get("rangeStart")), Number(formData.get("rangeEnd")), reader.chapter.versesCount ?? reader.verses.length);
    const first = reader.verses.find(verse => verse.audioUrl && verse.verseNumber && verse.verseNumber >= range.start && verse.verseNumber <= range.end);
    if (playbackTimerRef.current !== null) window.clearTimeout(playbackTimerRef.current);
    playbackTimerRef.current = null;
    setRangeStart(range.start);
    setRangeEnd(range.end);
    setRangeError(first ? null : "No sourced recitation audio is available in this Ayah range.");
    setSynchronizedAudio(null);
    setActiveWordPosition(null);
    completedPlayRef.current = 1;
    setPlaybackIteration(1);
    setActiveRange(Boolean(first));
    if (first?.verseKey === playingVerseKey && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(stopAudio);
    } else {
      setPlayingVerseKey(first?.verseKey ?? null);
    }
  };
  const stopAudio = () => {
    if (playbackTimerRef.current !== null) window.clearTimeout(playbackTimerRef.current);
    playbackTimerRef.current = null;
    audioRef.current?.pause();
    setPlayingVerseKey(null);
    setAudioPaused(false);
    setActiveRange(false);
    completedPlayRef.current = 1;
    setPlaybackIteration(1);
    setSynchronizedAudio(null);
    setActiveWordPosition(null);
  };
  const startSynchronizedRecitation = async () => {
    if (!reader || !selectedChapterReciter) return;
    stopAudio();
    setWordMode(true);
    setSynchronizedLoading(true);
    setRangeError(null);
    try {
      const payload = await fetchJson<ChapterAudioPayload>(`/api/quran/chapter-audio/${reader.chapter.id}?reciter=${selectedChapterReciter}`);
      setSynchronizedAudio(payload);
      setPlayingVerseKey(payload.timestamps[0]?.verseKey ?? null);
      setActiveWordPosition(null);
      localStorage.setItem("af-chapter-reciter-id", String(selectedChapterReciter));
    } catch (error) {
      setRangeError(messageOf(error));
    } finally {
      setSynchronizedLoading(false);
    }
  };
  const synchronizePlaybackPosition = () => {
    if (!synchronizedAudio || !audioRef.current) return;
    const position = audioRef.current.currentTime * 1000;
    const timestamp = synchronizedAudio.timestamps.find(item => position >= item.timestampFrom && position < item.timestampTo);
    if (!timestamp) {
      setActiveWordPosition(null);
      return;
    }
    setPlayingVerseKey(timestamp.verseKey);
    const segment = timestamp.segments.find(([, from, to]) => position >= from && position < to);
    setActiveWordPosition(segment?.[0] ?? null);
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
      <h1>A quiet place<br/>{"to meet the Quran."}</h1>
      <p>Read with clarity, continue without friction, and keep the Quran at the center.</p>
      <Link className={styles.primary} href={resumeHref(readingMode, lastRead, mushafPage)}>Begin reading <span>→</span></Link>
    </section>
    <section className={styles.homeGrid}>
      <article className={styles.continueCard}>
        <p className={styles.label}>Continue reading</p>
        <div><div><h2>{lastRead?.chapterName ?? chapters?.items?.[0]?.nameSimple ?? "Al-Fatihah"}</h2><p>{lastRead ? `Ayah ${lastRead.verseNumber}` : "The Opening"}</p></div><span className={styles.arabicTitle}>{lastRead ? "اقرأ" : chapters?.items?.[0]?.nameArabic ?? "الفاتحة"}</span></div>
        <Link href={resumeHref(readingMode, lastRead, mushafPage)} {...warmReaderProps(lastRead?.chapterId ?? 1)}>Resume{readingMode === "mushaf" ? " in Mushaf" : ""} <span>→</span></Link>
      </article>
      <Link className={styles.entryCard} href="/quran"><span className={styles.entryIcon}><Icon name="quran"/></span><div><p className={styles.label}>Quran</p><h2>Browse all 114 Surahs</h2><p>Arabic text, trusted translations, Tafsir, Tajweed, and recitation.</p></div><b>→</b></Link>
    </section>
    <DailyContent/>
    {publicFeatures.salahTimes ? <PrayerTimes/> : null}
    <section className={styles.quickLinks}>{publicFeatures.dua ? <Link href="/dua"><span>Dua</span><b>Daily remembrance →</b></Link> : null}{publicFeatures.qibla ? <Link href="/qibla"><span>Qibla</span><b>Find the direction →</b></Link> : null}{publicFeatures.masjidFinder ? <Link href="/masjid-finder"><span>Nearby</span><b>Find a masjid →</b></Link> : null}</section>
  </main>;

  const renderLibrary = () => <main className={styles.main}>
    <header className={styles.quranDirectoryHeader}><div><p className={styles.kicker}>The Noble Quran</p><h1>{quranBrowseMode === "juz" ? "Choose a Juz" : quranBrowseMode === "revelation" ? "Revelation Order" : "Choose a Surah"}</h1><p>{quranBrowseMode === "juz" ? "Browse all 30 Juz." : quranBrowseMode === "revelation" ? "Browse Surahs by their sourced revelation order." : "Browse all 114 Surahs."}</p></div><nav className={styles.quranBrowseTools} aria-label="Quran reading options"><Link href="/quran/mushaf/1">Mushaf view</Link><Link href="/quran/structure">Structure</Link><Link href="/reflect">Reflections</Link></nav></header>
    <div className={styles.directoryTabsRow}><div className={styles.directoryTabs} role="tablist" aria-label="Browse the Quran"><button type="button" role="tab" aria-selected={quranBrowseMode === "surah"} onClick={() => { setQuranBrowseMode("surah"); setFilter(""); }}>Surah</button><button type="button" role="tab" aria-selected={quranBrowseMode === "juz"} onClick={() => { setQuranBrowseMode("juz"); setFilter(""); }}>Juz</button><button type="button" role="tab" aria-selected={quranBrowseMode === "revelation"} onClick={() => { setQuranBrowseMode("revelation"); setFilter(""); }}>Revelation Order</button></div><button className={styles.sortDirection} type="button" onClick={() => setQuranBrowseAscending(value => !value)} aria-label={`Sort ${quranBrowseAscending ? "descending" : "ascending"}`}>{quranBrowseAscending ? "Ascending ↑" : "Descending ↓"}</button></div>
    <label className={styles.search}><span>⌕</span><input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={quranBrowseMode === "juz" ? "Search by Juz number" : "Search by Surah name or number"}/><kbd>{quranBrowseMode === "juz" ? "30" : "114"}</kbd></label>
    {chaptersLoading ? children ?? <div className={styles.skeletonGrid} aria-label="Loading chapters">{Array.from({length: 9},(_,i)=><i key={i}/>)}</div> : null}
    {chaptersError ? <ErrorState message={messageOf(chaptersError)}/> : null}
    {!chaptersLoading && !chaptersError && quranBrowseMode === "juz" ? <div className={styles.juzList}>{displayedJuz.map(juz => <Link href={`/quran/structure/juz/${juz}`} className={styles.juzRow} key={juz}><span className={styles.chapterNumber}>{juz}</span><div><h2>Juz {juz}</h2><p>Read by Quran structure</p></div><b>Read Juz →</b></Link>)}</div> : null}
    {!chaptersLoading && !chaptersError && quranBrowseMode !== "juz" ? <div className={styles.chapterList}>{displayedChapters.map(chapter => <Link href={chapter.readerUrl} className={styles.chapterRow} key={chapter.id} {...warmReaderProps(chapter.id)}><span className={styles.chapterNumber}>{quranBrowseMode === "revelation" ? chapter.revelationOrder : chapter.id}</span><div><h2>{chapter.nameSimple}</h2><p>{quranBrowseMode === "revelation" ? [`Surah ${chapter.id}`, chapter.revelationPlace, chapter.versesCount ? `${chapter.versesCount} Ayahs` : null].filter(Boolean).join(" · ") : `${chapter.translatedName} · ${chapter.versesCount} Ayahs`}</p></div><strong lang="ar" dir="rtl" translate="no">{chapter.nameArabic}</strong><b>›</b></Link>)}</div> : null}
    {!chaptersLoading && !chaptersError && (quranBrowseMode === "juz" ? displayedJuz.length === 0 : displayedChapters.length === 0) ? <p className={styles.empty}>No {quranBrowseMode === "juz" ? "Juz" : "Surahs"} match your search.</p> : null}
  </main>;

  const [verseBatch, setVerseBatch] = useState({ chapterId: 0, count: INITIAL_VERSE_BATCH });
  const readerChapterId = reader?.chapter.id ?? 0;
  const readerVerseTotal = reader?.verses.length ?? 0;
  const batchCount = verseBatch.chapterId === readerChapterId ? verseBatch.count : INITIAL_VERSE_BATCH;
  // Deep links, jumps, and audio follow need their target Ayah rendered immediately.
  const targetVerse = Math.max(Number(verseNumber) || 0, Number(playingVerseKey?.split(":")[1]) || 0);
  const visibleVerseCount = Math.max(batchCount, targetVerse + 3);
  useEffect(() => {
    if (!readerChapterId || batchCount >= readerVerseTotal) return;
    const timer = window.setTimeout(() => setVerseBatch({ chapterId: readerChapterId, count: batchCount + VERSE_BATCH }), 30);
    return () => window.clearTimeout(timer);
  }, [batchCount, readerChapterId, readerVerseTotal]);
  const verseHandlersRef = useRef({ playVerse, copyVerseLink, shareVerseLink });
  verseHandlersRef.current = { playVerse, copyVerseLink, shareVerseLink };
  const verseActions = useMemo<VerseActions>(() => ({
    play: (verseKey) => verseHandlersRef.current.playVerse(verseKey),
    copy: (...args) => { void verseHandlersRef.current.copyVerseLink(...args); },
    share: (...args) => { void verseHandlersRef.current.shareVerseLink(...args); },
    toggleBookmark: (bookmark) => {
      const next = toggleLocalBookmark(bookmark);
      setLocalBookmarks(next);
      setBookmarkNotice({ id: bookmark.id, saved: hasLocalBookmark(next, bookmark.id) });
      window.setTimeout(() => setBookmarkNotice(current => current?.id === bookmark.id ? null : current), 2400);
    },
  }), []);

  const revealReaderPanel = (id: string) => window.requestAnimationFrame(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  });
  const neighbourAudioKey = (step: 1 | -1) => {
    if (!reader || !playingVerseKey) return null;
    const index = reader.verses.findIndex(verse => verse.verseKey === playingVerseKey);
    for (let next = index + step; next >= 0 && next < reader.verses.length; next += step) if (reader.verses[next].audioUrl) return reader.verses[next].verseKey;
    return null;
  };
  const firstAudioVerseKey = reader?.verses.find(verse => verse.audioUrl)?.verseKey ?? null;
  const listenState = !firstAudioVerseKey ? "unavailable" : !playingVerseKey ? "idle" : audioPaused ? "paused" : "playing";
  const listen = () => playVerse(playingVerseKey ?? firstAudioVerseKey);
  const toggleMemorization = () => { const next = !memorizationOpen; setMemorizationOpen(next); if (next) revealReaderPanel("reader-memorization"); };
  const toggleIntroduction = () => { const next = !chapterInfoOpen; setChapterInfoOpen(next); if (next) revealReaderPanel("reader-introduction"); };

  const renderReader = () => <>
    {reader ? <ReaderToolbar chapter={reader.chapter} chapters={chapters?.items} verses={reader.verses} settingsActive={wordMode||tafsirOpen||memorizationOpen} onOpenSettings={() => setSettingsOpen(true)}/> : null}
    <main className={`${styles.main} ${styles.readerMain}`} style={{"--arabic-size": `${arabicSize}px`, "--translation-size": `${translationSize}px`} as React.CSSProperties}>
    {!reader && (readerLoading || (chapterId && (!selectedTranslation || !selectedRecitation) && !translationsError && !recitationsError)) ? children ?? <ReaderSkeleton/> : null}
    {readerError || translationsError || recitationsError || tafsirsError ? <ErrorState message={messageOf(readerError ?? translationsError ?? recitationsError ?? tafsirsError)}/> : null}
    {reader ? <>
      {tajweedEnabled && tajweedPalettes ? <style>{tajweedPalettes}</style> : null}
      <SurahHeader chapter={reader.chapter} catalogItem={chapters?.items.find(item => item.id === reader.chapter.id)} listenState={listenState} onListen={listen} infoOpen={chapterInfoOpen} onToggleInfo={() => setChapterInfoOpen(value => !value)} onWarmInfo={warmChapterInfo} translationLabel={selectedTranslationResource?.name} onOpenSettings={() => setSettingsOpen(true)} quranFont/>
      {chapterInfoOpen ? <aside id="reader-introduction" className={styles.chapterInfo} aria-label="Surah introduction">{chapterInfoLoading ? <div className={readerStyles.infoSkeleton} role="status" aria-label="Loading Surah introduction"><i/><i/><i/><i/></div> : null}{chapterInfoError ? <p className={styles.unavailable}>The Surah introduction is unavailable right now.</p> : null}{chapterInfo ? <div translate="no" dangerouslySetInnerHTML={{ __html: chapterInfo.textHtml }} /> : null}</aside> : null}
      {memorizationOpen ? <div id="reader-memorization" className={styles.memorizationPanel}><form className={styles.memorizationTools} onSubmit={startAyahRange} aria-label="Memorization playback"><div><strong>Ayah range</strong><span>Repeat sourced recitation for focused practice.</span></div><label>From<input aria-label="First Ayah" name="rangeStart" type="number" min="1" max={reader.chapter.versesCount ?? undefined} value={rangeStart} onChange={event=>setRangeStart(Number(event.target.value))}/></label><label>To<input aria-label="Last Ayah" name="rangeEnd" type="number" min="1" max={reader.chapter.versesCount ?? undefined} value={rangeEnd} onChange={event=>setRangeEnd(Number(event.target.value))}/></label><label>Repeat each<select aria-label="Ayah repeat count" value={repeatCount} onChange={event=>setRepeatCount(Number(event.target.value) as AyahRepeatCount)}><option value="1">1 time</option><option value="3">3 times</option><option value="5">5 times</option></select></label><label>Pause<select aria-label="Pause between Ayahs" value={pauseSeconds} onChange={event=>setPauseSeconds(Number(event.target.value))}><option value="0">No pause</option><option value="1">1 second</option><option value="2">2 seconds</option><option value="3">3 seconds</option></select></label><label className={styles.loopRange}><input type="checkbox" checked={loopRange} onChange={event=>setLoopRange(event.target.checked)}/>Loop range</label><button type="submit">Play range</button><div className={styles.synchronizedControls}><label>Synchronized reciter<select aria-label="Synchronized Quran reciter" value={selectedChapterReciter??""} onChange={event=>setSelectedChapterReciter(Number(event.target.value))}>{chapterReciters?.items.map(item=><option key={item.id} value={item.id}>{item.name}{item.style?` — ${item.style}`:""}</option>)}</select></label><button type="button" onClick={startSynchronizedRecitation} disabled={synchronizedLoading||!selectedChapterReciter}>{synchronizedLoading?"Loading…":"Play with word highlighting"}</button></div>{chapterRecitersError||chapterReciters?.error?<p className={styles.rangeError} role="alert">Synchronized reciters are unavailable right now.</p>:null}{rangeError?<p className={styles.rangeError} role="alert">{rangeError}</p>:null}</form><MutashabihatPanel chapterId={reader.chapter.id}/></div> : null}
      <section className={readerStyles.verses} aria-label={`${reader.chapter.nameSimple} verses`}>{reader.verses.slice(0, visibleVerseCount).map(verse => <VerseCard key={verse.id} verse={verse} chapterId={reader.chapter.id} chapterName={reader.chapter.nameSimple} isActive={playingVerseKey===verse.verseKey} isPlaying={playingVerseKey===verse.verseKey&&!audioPaused} isSaved={hasLocalBookmark(localBookmarks,`quran:${verse.verseKey}`)} isCopied={copiedVerseKey===verse.verseKey} bookmarkNotice={bookmarkNotice?.id===`quran:${verse.verseKey}`?(bookmarkNotice.saved?"saved":"removed"):null} activeWordPosition={synchronizedAudio&&playingVerseKey===verse.verseKey?activeWordPosition:null} wordMode={wordMode} tajweedEnabled={tajweedEnabled} tajweedWords={verse.verseKey?tajweedByVerse.get(verse.verseKey)??null:null} uthmaniScript={reader.script==="uthmani"||reader.script==="uthmani_simple"} tafsirAvailable={Boolean(tafsirs?.items.length)} tafsirEverywhere={tafsirOpen} tafsirId={selectedTafsir} contentPending={!liveReader} translationResourceName={selectedTranslationResource?.name} translationAuthor={selectedTranslationResource?.authorName} tafsirResourceName={selectedTafsirResource?.name} actions={verseActions}/>)}</section>
      {playingVerseKey ? <div className={styles.audioPlayer}><span aria-live="polite">{synchronizedAudio?"Synchronized recitation":activeRange?`Memorizing ${rangeStart}–${rangeEnd}`:"Reciting"} · Ayah {playingVerseKey}{!synchronizedAudio&&repeatCount>1?` · ${playbackIteration}/${repeatCount}`:""}</span><audio ref={audioRef} controls autoPlay src={synchronizedAudio?.audioUrl??reader.verses.find(verse => verse.verseKey === playingVerseKey)?.audioUrl??undefined} onTimeUpdate={synchronizePlaybackPosition} onEnded={playNextVerse} onPause={()=>setAudioPaused(true)} onPlay={()=>setAudioPaused(false)} onError={stopAudio}>Your browser does not support audio playback.</audio>{!synchronizedAudio&&!activeRange?<span className={styles.audioSteps}><button aria-label="Previous Ayah" title="Previous Ayah" disabled={!neighbourAudioKey(-1)} onClick={()=>playVerse(neighbourAudioKey(-1))}>‹</button><button aria-label="Next Ayah" title="Next Ayah" disabled={!neighbourAudioKey(1)} onClick={()=>playVerse(neighbourAudioKey(1))}>›</button></span>:null}<button className={styles.followPlayback} aria-pressed={followRecitation} onClick={changeFollowRecitation}>{followRecitation?"Following":"Follow"}</button><button aria-label="Close audio player" onClick={stopAudio}>×</button></div> : null}
      <nav className={readerStyles.chapterNav} aria-label="Surah navigation">{reader.chapter.id > 1 ? <Link href={`/quran/${reader.chapter.id-1}`} {...warmReaderProps(reader.chapter.id-1)}>← Previous Surah</Link> : <span/>}{reader.chapter.id < 114 ? <Link href={`/quran/${reader.chapter.id+1}`} {...warmReaderProps(reader.chapter.id+1)}>Next Surah →</Link> : null}</nav>
    </> : null}
    </main>
  </>;

  const renderSearch = () => <main className={styles.main}>
    <header className={styles.pageHeader}><p className={styles.kicker}>Quran search</p><h1>Find a verse</h1><p>Search the Quran and open results in reading context.</p></header>
    <form className={styles.searchForm} role="search" onSubmit={search}><label htmlFor="quran-search">Search the Quran</label><div><input id="quran-search" type="search" value={searchInput} onChange={event => setSearchInput(event.target.value)} placeholder="Try mercy, guidance, or an Arabic phrase"/><button disabled={!searchInput.trim()}>Search</button></div></form>
    {searchLoading ? <div className={styles.searchLoading} aria-live="polite">Searching…</div> : null}
    {searchError || searchResults?.error ? <ErrorState message={messageOf(searchError ?? { message: searchResults?.error })}/> : null}
    {searchResults && !searchResults.error ? <section className={styles.results} aria-live="polite"><p className={styles.label}>Results for “{searchResults.query}”</p>{searchResults.navigationItems.map((item,index) => <Link className={styles.result} href={item.readerUrl ?? "/quran"} key={`navigation-${index}`}><div><h2>{item.label}</h2><p>{item.subtitle}</p></div><b>→</b></Link>)}{searchResults.verseItems.map((item,index) => <Link className={styles.result} href={item.readerUrl ?? "/quran"} key={`${item.verseKey}-${index}`}><div><span>{item.verseKey}</span>{item.arabicText ? <p className={styles.resultArabic} lang="ar" dir="rtl" translate="no">{item.arabicText}</p> : null}<p translate="no">{item.text}</p></div><b>→</b></Link>)}{searchResults.navigationItems.length + searchResults.verseItems.length === 0 ? <p className={styles.empty}>No results were found. Try another word or phrase.</p> : null}</section> : null}
  </main>;

  return <div className={styles.app}>
    <header className={styles.topbar}><Link className={styles.brand} href="/"><span>ف</span><div><strong>Al-Furqan</strong><small>الفرقان</small></div></Link><nav><Link className={route === "quran" ? styles.active : ""} href="/quran">Quran</Link><Link className={route === "sunnah" ? styles.active : ""} href="/sunnah">Sunnah</Link>{publicFeatures.salahTimes ? <Link className={route === "salah" ? styles.active : ""} href="/salah-times">Salah Times</Link> : null}{publicFeatures.dua ? <Link className={route === "dua" ? styles.active : ""} href="/dua">Dua</Link> : null}{publicFeatures.qibla ? <Link className={route === "qibla" ? styles.active : ""} href="/qibla">Qibla</Link> : null}{publicFeatures.masjidFinder ? <Link className={route === "masjid" ? styles.active : ""} href="/masjid-finder">Masjid Finder</Link> : null}</nav><div className={styles.actions}><Link className={styles.iconAction} aria-label="Open saved library" title="Saved Library" href="/library"><Icon name="saved"/></Link><Link className={`${styles.searchAction} ${route === "search" ? styles.activeAction : ""}`} href="/search"><Icon name="search"/><span>Search</span></Link><button aria-label="Toggle reading theme" onClick={() => changeTheme(theme === "light" ? "dark" : theme === "dark" ? "sepia" : "light")}>◐</button><button ref={settingsTriggerRef} aria-label="Open reading settings" onClick={() => setSettingsOpen(true)}>Aa</button></div></header>
    {route === "home" ? renderHome() : quranToolRoute ? children : route === "quran" && !chapterId ? renderLibrary() : route === "quran" ? renderReader() : route === "search" ? renderSearch() : children}
    <nav className={styles.mobileNav}><Link className={route === "quran" ? styles.active : ""} href="/quran"><Icon name="quran"/><span>Quran</span></Link><Link className={route === "sunnah" ? styles.active : ""} href="/sunnah"><span className={styles.mobileGlyph}>◉</span><span>Sunnah</span></Link>{publicFeatures.salahTimes ? <Link className={route === "salah" ? styles.active : ""} href="/salah-times"><span className={styles.mobileGlyph}>◷</span><span>Salah</span></Link> : null}{publicFeatures.dua ? <Link className={route === "dua" ? styles.active : ""} href="/dua"><span className={styles.mobileGlyph}>✦</span><span>Dua</span></Link> : null}<button className={route === "search" || route === "qibla" || route === "masjid" ? styles.active : ""} onClick={()=>setMoreOpen(value=>!value)}><Icon name="more"/><span>More</span></button></nav>
    {moreOpen?<div className={styles.moreMenu} role="menu" aria-label="More navigation"><Link href="/library" onClick={()=>setMoreOpen(false)}>Saved Library <span>→</span></Link><Link href="/search" onClick={()=>setMoreOpen(false)}>Search <span>→</span></Link>{publicFeatures.qibla ? <Link href="/qibla" onClick={()=>setMoreOpen(false)}>Qibla <span>→</span></Link> : null}{publicFeatures.masjidFinder ? <Link href="/masjid-finder" onClick={()=>setMoreOpen(false)}>Masjid Finder <span>→</span></Link> : null}</div>:null}
    {settingsOpen ? <ReaderSettings dialogRef={settingsDialogRef} onClose={closeSettings} theme={theme} onTheme={changeTheme} readingMode={readingMode} onReadingMode={changeReadingMode} tajweedEnabled={tajweedEnabled} onTajweed={changeTajweed} followRecitation={followRecitation} onFollowRecitation={changeFollowRecitation} arabicSize={arabicSize} translationSize={translationSize} onSize={changeSize}
      quran={reader && route === "quran" && chapterId ? { reader, verseNumber: Number(verseNumber) || 1, translationGroups, selectedTranslation, onTranslation: changeTranslation, recitations: recitations?.items ?? [], selectedRecitation, onRecitation: changeRecitation, script: quranScript, onScript: (value) => { setQuranScript(value); localStorage.setItem("af-quran-script", value); }, tafsirs: tafsirs?.items ?? [], selectedTafsir, onTafsir: (value) => { setSelectedTafsir(value); localStorage.setItem("af-tafsir-id", String(value)); }, wordMode, onWordMode: setWordMode, tafsirEverywhere: tafsirOpen, onTafsirEverywhere: setTafsirOpen, memorizationOpen, onMemorization: toggleMemorization, introductionOpen: chapterInfoOpen, onIntroduction: toggleIntroduction, onJump: jump } : undefined}/> : null}
  </div>;
}

function ErrorState({message}:{message:string}) { return <section className={styles.error} role="alert"><span>!</span><h2>We could not load this content</h2><p>{message}</p><button onClick={()=>location.reload()}>Try again</button></section>; }
function ReaderSkeleton() { return <div className={readerStyles.skeleton} aria-label="Loading Quran"><i/><i/><i/></div>; }

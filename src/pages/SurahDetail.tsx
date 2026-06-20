// src/pages/SurahDetail.tsx

import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  fetchReaderSurah,
  fetchSurahAudio,
  fetchSurahList,
} from "../services/quranService";
import type {
  ReaderAyah,
  ReaderSurah,
  SurahMetadata,
} from "../core/quran/contracts";
import {
  clampArabicFontSize,
  loadReaderPreferences,
  saveReaderPreferences,
} from "../core/quran/readerPreferences";
import QuranReaderControls from "../components/quran/QuranReaderControls";
import { useAudio, type AudioAyah } from "../context/AudioContext";
import { useSettings } from "../context/SettingsContext";
import {
  FaPlay,
  FaPause,
  FaBackward,
  FaForward,
  FaCopy,
  FaShare,
  FaCheck,
  FaStar,
  FaRegStar,
  FaChevronDown,
  FaSearch,
  FaBookOpen,
} from "react-icons/fa";
import PageView from "../components/PageView";
import TafsirView from "../components/TafsirView";
import { FeatureGate } from "../components/FeatureGate";

// Mushaf page lookup (not relevant to audio logic)
const SURAH_TO_PAGE: Record<number, number> = {
  1: 1, 2: 2, 3: 50, 4: 77, 5: 106, 6: 128, 7: 151, 8: 177, 9: 187,
  10: 208, 11: 221, 12: 235, 13: 249, 14: 255, 15: 262, 16: 267, 17: 282,
  18: 293, 19: 305, 20: 312, 21: 322, 22: 332, 23: 342, 24: 350, 25: 359,
  26: 367, 27: 377, 28: 385, 29: 396, 30: 404, 31: 411, 32: 415, 33: 418,
  34: 428, 35: 434, 36: 440, 37: 446, 38: 453, 39: 458, 40: 467, 41: 477,
  42: 483, 43: 489, 44: 496, 45: 499, 46: 502, 47: 507, 48: 511, 49: 515,
  50: 518, 51: 520, 52: 523, 53: 526, 54: 528, 55: 531, 56: 534, 57: 537,
  58: 542, 59: 545, 60: 549, 61: 551, 62: 553, 63: 554, 64: 556, 65: 558,
  66: 560, 67: 562, 68: 564, 69: 566, 70: 568, 71: 570, 72: 572, 73: 574,
  74: 575, 75: 577, 76: 578, 77: 580, 78: 582, 79: 583, 80: 585, 81: 586,
  82: 587, 83: 587, 84: 589, 85: 590, 86: 591, 87: 591, 88: 592, 89: 593,
  90: 594, 91: 595, 92: 595, 93: 596, 94: 596, 95: 597, 96: 597, 97: 598,
  98: 598, 99: 599, 100: 599, 101: 600, 102: 600, 103: 601, 104: 601,
  105: 601, 106: 602, 107: 602, 108: 603, 109: 603, 110: 603, 111: 603,
  112: 604, 113: 604, 114: 604,
};

export default function SurahDetail() {
  const { surahId } = useParams();
  const navigate = useNavigate();
  const {
    isPlaying,
    currentAyah: globalCurrentAyah,
    playPlaylist,
    togglePlay,
  } = useAudio();

  // ─── STATE ──────────────────────────────────────────────────────────────────
  const [surah, setSurah] = useState<ReaderSurah | null>(null);
  const [surahList, setSurahList] = useState<SurahMetadata[]>([]);
  const [filteredSurahList, setFilteredSurahList] = useState<SurahMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  // Use Global Settings instead of local state
  const { translation, setTranslation, reciter, setReciter } = useSettings();

  const [viewMode, setViewMode] = useState<"translation" | "page">(
    "translation"
  );
  const [bookmarks, setBookmarks] = useState<{ surah: number; ayah: number }[]>(
    []
  );

  const [activeTafsirAyah, setActiveTafsirAyah] = useState<number | null>(null);

  const [isSurahDropdownOpen, setIsSurahDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentSurahNumber, setCurrentSurahNumber] = useState<number | null>(
    null
  );
  const [copiedAyah, setCopiedAyah] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [readerPreferences, setReaderPreferences] = useState(() =>
    loadReaderPreferences(localStorage),
  );

  useEffect(() => {
    saveReaderPreferences(localStorage, {
      ...readerPreferences,
      arabicFontSize: clampArabicFontSize(readerPreferences.arabicFontSize),
    });
  }, [readerPreferences]);

  // ─── Auto-scroll to active Ayah ──────────────────────────────────────────────
  // ─── Auto-scroll to active Ayah OR Deep Link ─────────────────────────────────
  const { hash } = useLocation(); // Need to import this hook
  const loadedSurahNumber = surah?.metadata.number;

  useEffect(() => {
    // Priority 1: Audio Playing
    if (
      isPlaying &&
      globalCurrentAyah &&
      globalCurrentAyah.surahNumber === loadedSurahNumber
    ) {
      const element = document.getElementById(`ayah-${globalCurrentAyah.number}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
    // Priority 2: Deep Link (Hash) on Load
    else if (hash && loadedSurahNumber && !loading) {
      // hash is like "#ayah-255"
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        // slight delay to ensure render
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          // Highlight it briefly
          element.classList.add("ring-2", "ring-emerald-500");
          setTimeout(() => element.classList.remove("ring-2", "ring-emerald-500"), 3000);
        }, 500);
      }
    }
  }, [globalCurrentAyah, isPlaying, loadedSurahNumber, hash, loading]);

  // ─── 1) Fetch list of all Surahs for dropdown search ───────────────────────────
  useEffect(() => {
    const loadSurahList = async () => {
      try {
        const list = await fetchSurahList();
        setSurahList(list);
        setFilteredSurahList(list);
      } catch (e) {
        console.error("Failed to load surah list:", e);
      }
    };
    loadSurahList();
  }, []);

  // ─── 2) On mount, load bookmarks from localStorage ─────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem("quranBookmarks");
    if (saved) {
      try {
        setBookmarks(JSON.parse(saved));
      } catch {
        setBookmarks([]);
      }
    }
  }, []);

  // ─── 3) Whenever bookmarks change, write back to localStorage ─────────────────
  useEffect(() => {
    localStorage.setItem("quranBookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  // ─── 4) Track route param "surahId" → set currentSurahNumber ──────────────────────
  useEffect(() => {
    if (!surahId) return;
    const parsed = Number.parseInt(surahId, 10);
    setCurrentSurahNumber(
      Number.isInteger(parsed) && parsed >= 1 && parsed <= 114 ? parsed : null,
    );
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > 114) {
      setLoading(false);
      setError("That Surah could not be found.");
    }
    setActiveTafsirAyah(null); // Close tafsir on surah change
  }, [surahId]);

  // ─── 5) Whenever currentSurahNumber, translation, or reciter changes, fetch Surah ─
  // ─── 5) Whenever currentSurahNumber, translation, or reciter changes, fetch Surah ─
  useEffect(() => {
    if (!currentSurahNumber) return;
    const load = async () => {
      setLoading(true);
      setError(null);

      const sId = currentSurahNumber.toString();

      try {
        const readerSurah = await fetchReaderSurah(
          currentSurahNumber,
          translation,
        );

        setSurah(readerSurah);
        setLoading(false);

        // Preserve the existing audio behavior without coupling it to Quran text.
        fetchSurahAudio(sId, reciter)
          .then(audioData => {
            setSurah(prev => {
              // Prevent race condition if user switched surah already
              if (!prev || prev.metadata.number !== currentSurahNumber) return prev;

              const ayahsWithAudio = prev.ayahs.map((a, i) => ({
                ...a,
                audioUrl: audioData[i]?.audio || "",
              }));

              return { ...prev, ayahs: ayahsWithAudio };
            });
          })
          .catch(err => console.warn("Background audio fetch failed", err));

      } catch (e) {
        console.error(e);
        // Only error if TEXT fails
        setSurah(null);
        setError("We couldn’t load this Surah. Check your connection and try again.");
        setLoading(false);
      }
    };
    void load();
  }, [currentSurahNumber, translation, reciter, retryKey]);

  // ─── Bookmark toggle: add/remove { surah, ayah } ─────────────────────────────────
  const handleBookmarkToggle = (surahNumber: number, ayahNumber: number) => {
    const exists = bookmarks.findIndex(
      (b) => b.surah === surahNumber && b.ayah === ayahNumber
    );
    if (exists > -1) {
      setBookmarks((prev) =>
        prev.filter((b) => !(b.surah === surahNumber && b.ayah === ayahNumber))
      );
    } else {
      setBookmarks((prev) => [
        ...prev,
        { surah: surahNumber, ayah: ayahNumber },
      ]);
    }
  };
  const isAyahBookmarked = (surahNum: number, ayahNum: number) =>
    bookmarks.some((b) => b.surah === surahNum && b.ayah === ayahNum);

  // ─── Audio Helper Functions ────────────────────────────────────────────────────
  const convertToAudioAyah = (ayah: ReaderAyah): AudioAyah => ({
    number: ayah.ref.ayahNumber,
    text: ayah.arabicText,
    audio: ayah.audioUrl || "",
    surahNumber: surah?.metadata.number || 0,
    surahName: surah?.metadata.transliteratedName || "",
  });

  const handlePlayAyah = (ayah: ReaderAyah) => {
    // Check if this verse is already playing
    if (
      globalCurrentAyah?.surahNumber === surah?.metadata.number &&
      globalCurrentAyah?.number === ayah.ref.ayahNumber &&
      isPlaying
    ) {
      togglePlay(); // Pause
    } else {
      // Play just this ayah (or start playlist from here?)
      // "Play" on a verse usually initiates reading from there.
      // Let's create a playlist from this verse to the end of the surah
      if (!surah) return;
      const startIndex = surah.ayahs.findIndex(
        (item) => item.ref.ayahNumber === ayah.ref.ayahNumber,
      );
      const relevantAyahs = surah.ayahs.slice(startIndex);
      const playlist = relevantAyahs.map(convertToAudioAyah);
      playPlaylist(playlist, 0);
    }
  };

  const handlePlayAll = () => {
    if (!surah) return;

    // If currently playing from this Surah, just toggle
    if (
      globalCurrentAyah?.surahNumber === surah.metadata.number &&
      isPlaying
    ) {
      togglePlay();
      return;
    }

    const playlist = surah.ayahs.map(convertToAudioAyah);
    playPlaylist(playlist, 0);
  };


  // ─── Navigate between Surahs ─────────────────────────────────────────────────
  const navigateToSurah = (surahNumber: number) => {
    setCurrentSurahNumber(surahNumber);
    navigate(`/quran/${surahNumber}`);
    setViewMode("translation");
  };
  const nextSurah = () => {
    if (!surahList.length || !currentSurahNumber) return;
    const nxt = currentSurahNumber < 114 ? currentSurahNumber + 1 : 1;
    navigateToSurah(nxt);
  };
  const prevSurah = () => {
    if (!surahList.length || !currentSurahNumber) return;
    const prev = currentSurahNumber > 1 ? currentSurahNumber - 1 : 114;
    navigateToSurah(prev);
  };

  // ─── Surah search input handler ──────────────────────────────────────────────
  const handleSurahSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value.toLowerCase();
    setSearchQuery(q);
    setFilteredSurahList(
      q
        ? surahList.filter(
          (s) =>
            s.transliteratedName.toLowerCase().includes(q) ||
            s.arabicName.toLowerCase().includes(q) ||
            s.translatedName.toLowerCase().includes(q) ||
            s.number.toString().includes(q)
        )
        : surahList
    );
  };

  // ─── Copy an Ayah's text (with translation) ──────────────────────────────────
  const copyAyah = async (ayah: ReaderAyah) => {
    const text =
      viewMode === "translation"
        ? `${ayah.arabicText}\n\n${ayah.translationText || ""}\n\n${surah?.metadata.transliteratedName} ${ayah.ref.ayahNumber
        }`
        : `${ayah.arabicText}\n\n${surah?.metadata.transliteratedName} ${ayah.ref.ayahNumber}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAyah(ayah.ref.ayahNumber);
      setTimeout(() => setCopiedAyah(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // ─── Share an Ayah's text ────────────────────────────────────────────────────
  const shareAyah = async (ayah: ReaderAyah) => {
    const shareText =
      viewMode === "translation"
        ? `${ayah.arabicText}\n\n${ayah.translationText || ""}\n\n${surah?.metadata.transliteratedName} ${ayah.ref.ayahNumber
        }`
        : `${ayah.arabicText}\n\n${surah?.metadata.transliteratedName} ${ayah.ref.ayahNumber}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${surah?.metadata.transliteratedName} ${ayah.ref.ayahNumber}`,
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopiedAyah(ayah.ref.ayahNumber);
        setTimeout(() => setCopiedAyah(null), 2000);
        alert("Ayah copied to clipboard!");
      }
    } catch (err) {
      console.error("Failed to share:", err);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-[70vh] bg-gray-50 px-4 py-12 dark:bg-gray-900"
        aria-live="polite"
      >
        <div className="mx-auto max-w-4xl animate-pulse space-y-6">
          <div className="mx-auto h-8 w-48 rounded bg-gray-200 dark:bg-gray-700" />
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-52 rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
            />
          ))}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Loading Surah…
          </p>
        </div>
      </div>
    );
  }

  if (error || !surah) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center bg-gray-50 px-4 text-center dark:bg-gray-900">
        <p className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Quran reader unavailable
        </p>
        <p className="mb-6 max-w-md text-gray-600 dark:text-gray-400">
          {error || "That Surah could not be found."}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {currentSurahNumber && (
            <button
              onClick={() => setRetryKey((value) => value + 1)}
              className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
            >
              Try again
            </button>
          )}
          <button
            onClick={() => navigate("/al-quran")}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:border-emerald-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
          >
            Browse Surahs
          </button>
        </div>
      </div>
    );
  }

  const startingMushafPage =
    currentSurahNumber && SURAH_TO_PAGE[currentSurahNumber]
      ? SURAH_TO_PAGE[currentSurahNumber]
      : 1;
  const isCurrentSurahPlaying =
    isPlaying &&
    globalCurrentAyah?.surahNumber === surah.metadata.number;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
      <div className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 shadow-sm backdrop-blur dark:border-gray-700 dark:bg-gray-800/95">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {viewMode === "translation" && (
              <div className="relative">
                <button
                  onClick={() =>
                    setIsSurahDropdownOpen(!isSurahDropdownOpen)
                  }
                  className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 sm:w-auto"
                >
                  {surah.metadata.transliteratedName}
                  <FaChevronDown
                    className={isSurahDropdownOpen ? "rotate-180" : ""}
                    size={12}
                  />
                </button>
                {isSurahDropdownOpen && (
                  <div className="absolute z-50 mt-1 max-h-96 w-full min-w-72 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 sm:w-80">
                    <div className="sticky top-0 border-b border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                      <div className="relative">
                        <FaSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={handleSurahSearch}
                          placeholder="Search Surahs..."
                          className="w-full rounded border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm text-gray-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="py-1">
                      {filteredSurahList.length > 0 ? (
                        filteredSurahList.map((item) => (
                          <button
                            key={item.number}
                            onClick={() => {
                              navigateToSurah(item.number);
                              setIsSurahDropdownOpen(false);
                            }}
                            className={`block w-full px-4 py-3 text-left text-sm ${
                              item.number === surah.metadata.number
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
                                : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                            }`}
                          >
                            {item.number}. {item.transliteratedName} (
                            {item.arabicName})
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                          No Surahs found
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex rounded-lg shadow-sm">
                <button
                  onClick={() => setViewMode("translation")}
                  className={`min-h-11 rounded-l-lg px-3 text-sm font-medium ${
                    viewMode === "translation"
                      ? "bg-emerald-600 text-white"
                      : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                  }`}
                >
                  Reader
                </button>
                <FeatureGate feature="enableMushafView">
                  <button
                    onClick={() => setViewMode("page")}
                    className={`min-h-11 rounded-r-lg px-3 text-sm font-medium ${
                      viewMode === "page"
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    }`}
                  >
                    Mushaf
                  </button>
                </FeatureGate>
              </div>

              {viewMode === "translation" && (
                <>
                  <label className="sr-only" htmlFor="reader-translation">
                    Translation edition
                  </label>
                  <select
                    id="reader-translation"
                    value={translation}
                    onChange={(event) => setTranslation(event.target.value)}
                    className="min-h-11 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  >
                    <option value="en.sahih">English</option>
                    <option value="bn.bengali">Bengali</option>
                    <option value="ur.jalandhry">Urdu</option>
                    <option value="fr.hamidullah">French</option>
                    <option value="de.aburida">German</option>
                    <option value="tr.diyanet">Turkish</option>
                    <option value="id.muntakhab">Indonesian</option>
                  </select>
                  <label className="sr-only" htmlFor="reader-reciter">
                    Reciter
                  </label>
                  <select
                    id="reader-reciter"
                    value={reciter}
                    onChange={(event) => setReciter(event.target.value)}
                    className="min-h-11 max-w-48 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  >
                    <option value="ar.alafasy">Mishary Alafasy</option>
                    <option value="ar.minshawi">Minshawi</option>
                    <option value="ar.sudais">Abdur-Rahman as-Sudais</option>
                    <option value="ar.husary">Al-Husary</option>
                    <option value="ar.abdulbasitmurattal">Abdul Basit</option>
                  </select>
                  <button
                    onClick={handlePlayAll}
                    className={`flex min-h-11 items-center gap-2 rounded-lg px-4 font-medium text-white ${
                      isCurrentSurahPlaying
                        ? "bg-red-500 hover:bg-red-600"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    {isCurrentSurahPlaying ? (
                      <>
                        <FaPause size={14} /> Stop
                      </>
                    ) : (
                      <>
                        <FaPlay size={14} /> Play all
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          {viewMode === "translation" && (
            <div className="mt-3">
              <QuranReaderControls
                preferences={readerPreferences}
                onChange={(preferences) =>
                  setReaderPreferences({
                    ...preferences,
                    arabicFontSize: clampArabicFontSize(
                      preferences.arabicFontSize,
                    ),
                  })
                }
              />
            </div>
          )}

          <div className="mt-5 grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4">
            <button
              onClick={prevSurah}
              aria-label="Previous Surah"
              className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-emerald-600 dark:text-gray-400 dark:hover:bg-gray-700 sm:px-3"
            >
              <FaBackward /> <span className="hidden sm:inline">Previous</span>
            </button>
            <div className="min-w-0 text-center">
              <p
                className="mb-1 truncate font-noto text-2xl text-emerald-700 dark:text-emerald-300 sm:text-3xl"
                lang="ar"
                dir="rtl"
              >
                {surah.metadata.arabicName}
              </p>
              <h1 className="truncate text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                {surah.metadata.transliteratedName}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Surah {surah.metadata.number} • {surah.metadata.translatedName} •{" "}
                {surah.metadata.revelationType} • {surah.metadata.ayahCount} ayahs
              </p>
            </div>
            <button
              onClick={nextSurah}
              aria-label="Next Surah"
              className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-emerald-600 dark:text-gray-400 dark:hover:bg-gray-700 sm:px-3"
            >
              <span className="hidden sm:inline">Next</span> <FaForward />
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-3 py-6 pb-32 sm:px-4 sm:py-8">
        {viewMode === "page" ? (
          <PageView initialPage={startingMushafPage} />
        ) : (
          <div
            className={
              readerPreferences.density === "compact"
                ? "space-y-3"
                : "space-y-6"
            }
          >
            {!surah.translationAvailable &&
              readerPreferences.showTranslation && (
                <div
                  role="status"
                  className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200"
                >
                  The selected translation could not be loaded. Arabic text is
                  still available.
                </div>
              )}

            {![1, 9].includes(surah.metadata.number) && (
              <div className="mb-8 text-center">
                <p
                  className="font-noto text-4xl leading-[2.2] text-gray-800 dark:text-gray-200"
                  lang="ar"
                  dir="rtl"
                >
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                </p>
              </div>
            )}

            {surah.ayahs.map((ayah) => {
              const ayahNumber = ayah.ref.ayahNumber;
              const isPlayingThis =
                globalCurrentAyah?.surahNumber === surah.metadata.number &&
                globalCurrentAyah?.number === ayahNumber &&
                isPlaying;
              const isTafsirOpen = activeTafsirAyah === ayahNumber;
              const bookmarked = isAyahBookmarked(
                surah.metadata.number,
                ayahNumber,
              );

              return (
                <article
                  key={ayahNumber}
                  id={`ayah-${ayahNumber}`}
                  aria-labelledby={`ayah-label-${ayahNumber}`}
                  className={`rounded-2xl border bg-white shadow-sm transition-colors dark:bg-gray-800 ${
                    readerPreferences.density === "compact"
                      ? "p-4 sm:p-5"
                      : "p-5 sm:p-7"
                  } ${
                    isPlayingThis
                      ? "border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 dark:bg-emerald-900/10"
                      : "border-gray-100 hover:border-gray-200 dark:border-gray-700 dark:hover:border-gray-600"
                  }`}
                >
                  <div
                    className={
                      readerPreferences.density === "compact"
                        ? "flex flex-col gap-4"
                        : "flex flex-col gap-6"
                    }
                  >
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                      <div className="flex items-center gap-2">
                        <span
                          id={`ayah-label-${ayahNumber}`}
                          className="flex h-9 min-w-9 items-center justify-center rounded-full bg-emerald-100 px-2 text-sm font-semibold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                        >
                          {surah.metadata.number}:{ayahNumber}
                        </span>
                        <button
                          onClick={() =>
                            handleBookmarkToggle(
                              surah.metadata.number,
                              ayahNumber,
                            )
                          }
                          aria-label={`${
                            bookmarked ? "Remove bookmark from" : "Bookmark"
                          } ayah ${ayahNumber}`}
                          className={`min-h-10 min-w-10 rounded-full p-2 transition-colors ${
                            bookmarked
                              ? "text-yellow-500"
                              : "text-gray-400 hover:text-yellow-500"
                          }`}
                        >
                          {bookmarked ? <FaStar /> : <FaRegStar />}
                        </button>
                      </div>

                      <div className="flex items-center gap-1 sm:gap-2">
                        <button
                          onClick={() => handlePlayAyah(ayah)}
                          className={`min-h-10 min-w-10 rounded-full p-2 transition-colors ${
                            isPlayingThis
                              ? "bg-emerald-100 text-emerald-600"
                              : "text-gray-400 hover:bg-gray-50 hover:text-emerald-600 dark:hover:bg-gray-700"
                          }`}
                          title={isPlayingThis ? "Pause" : "Play"}
                        >
                          {isPlayingThis ? (
                            <FaPause size={14} />
                          ) : (
                            <FaPlay size={14} />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            setActiveTafsirAyah(
                              isTafsirOpen ? null : ayahNumber,
                            )
                          }
                          className={`min-h-10 min-w-10 rounded-full p-2 transition-colors ${
                            isTafsirOpen
                              ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50"
                              : "text-gray-400 hover:bg-gray-50 hover:text-emerald-600 dark:hover:bg-gray-700"
                          }`}
                          title="Read Tafsir"
                        >
                          <FaBookOpen size={14} />
                        </button>
                        <button
                          onClick={() => copyAyah(ayah)}
                          className="min-h-10 min-w-10 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                          title="Copy"
                        >
                          {copiedAyah === ayahNumber ? (
                            <FaCheck className="text-emerald-500" />
                          ) : (
                            <FaCopy size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => shareAyah(ayah)}
                          className="min-h-10 min-w-10 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                          title="Share"
                        >
                          <FaShare size={14} />
                        </button>
                      </div>
                    </div>

                    <p
                      className="quran-arabic-text py-2 text-right text-gray-900 dark:text-gray-100"
                      lang="ar"
                      dir="rtl"
                      style={{
                        fontSize: `${readerPreferences.arabicFontSize}px`,
                      }}
                    >
                      {ayah.arabicText}
                    </p>

                    {readerPreferences.showTranslation &&
                      ayah.translationText && (
                        <div className="border-t border-gray-100 pt-4 dark:border-gray-700">
                          <p className="text-base leading-8 text-gray-700 dark:text-gray-300 sm:text-lg">
                            {ayah.translationText}
                          </p>
                        </div>
                      )}

                    {isTafsirOpen && (
                      <div className="border-t border-gray-100 pt-4 dark:border-gray-700">
                        <TafsirView
                          surahNumber={surah.metadata.number}
                          ayahNumber={ayahNumber}
                        />
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

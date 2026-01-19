// src/pages/SurahDetail.tsx

import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  fetchSurahByIdWithTranslation,
  fetchSurahAudio,
  fetchSurahList,
} from "../services/quranService";
import { useAudio, type AudioAyah } from "../context/AudioContext";
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

interface Ayah {
  number: number;
  text: string;
  englishText?: string;
  audio?: string;
  page: number;
}

interface Surah {
  name: string;
  englishName: string;
  englishNameTranslation: string;
  number: number;
  ayahs: Ayah[];
}

interface SurahInfo {
  number: number;
  name: string;
  englishName: string;
}

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
  const [surah, setSurah] = useState<Surah | null>(null);
  const [surahList, setSurahList] = useState<SurahInfo[]>([]);
  const [filteredSurahList, setFilteredSurahList] = useState<SurahInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [translation, setTranslation] = useState("en.sahih");
  const [reciter, setReciter] = useState("ar.alafasy");
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
    setCurrentSurahNumber(parseInt(surahId, 10));
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
        // 1. Fetch Texts First (Fast)
        const [trans, arabic] = await Promise.all([
          fetchSurahByIdWithTranslation(sId, translation),
          fetchSurahByIdWithTranslation(sId, "ar"),
        ]);

        // Merge text immediately
        const initialAyahs = (arabic.ayahs as any[]).map((ayah: any, i: number) => ({
          number: i + 1,
          text: ayah.text,
          englishText: trans.ayahs[i]?.text || "",
          audio: "", // Placeholder
          page: ayah.page || 0,
        }));

        const newSurah: Surah = {
          name: arabic.name,
          englishName: arabic.englishName,
          englishNameTranslation: arabic.englishNameTranslation,
          number: arabic.number,
          ayahs: initialAyahs,
        };

        setSurah(newSurah);
        setLoading(false); // <--- UNBLOCK UI IMMEDIATELY

        // 2. Fetch Audio in background (Slower)
        fetchSurahAudio(sId, reciter)
          .then(audioData => {
            setSurah(prev => {
              // Prevent race condition if user switched surah already
              if (!prev || prev.number !== currentSurahNumber) return prev;

              const ayahsWithAudio = prev.ayahs.map((a, i) => ({
                ...a,
                audio: audioData[i]?.audio || ""
              }));

              return { ...prev, ayahs: ayahsWithAudio };
            });
          })
          .catch(err => console.warn("Background audio fetch failed", err));

      } catch (e) {
        console.error(e);
        // Only error if TEXT fails
        setSurah(null);
        setError("Failed to load surah text. Please try again.");
        setLoading(false);
      }
    };
    load();
  }, [currentSurahNumber, translation, reciter]);

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
  const convertToAudioAyah = (ayah: Ayah): AudioAyah => ({
    number: ayah.number,
    text: ayah.text,
    audio: ayah.audio || "", // ensure string
    surahNumber: surah?.number || 0,
    surahName: surah?.englishName || ""
  });

  const handlePlayAyah = (ayah: Ayah) => {
    // Check if this verse is already playing
    if (
      globalCurrentAyah?.surahNumber === surah?.number &&
      globalCurrentAyah?.number === ayah.number &&
      isPlaying
    ) {
      togglePlay(); // Pause
    } else {
      // Play just this ayah (or start playlist from here?)
      // "Play" on a verse usually initiates reading from there.
      // Let's create a playlist from this verse to the end of the surah
      if (!surah) return;
      const startIndex = surah.ayahs.findIndex(a => a.number === ayah.number);
      const relevantAyahs = surah.ayahs.slice(startIndex);
      const playlist = relevantAyahs.map(convertToAudioAyah);
      playPlaylist(playlist, 0);
    }
  };

  const handlePlayAll = () => {
    if (!surah) return;

    // If currently playing from this Surah, just toggle
    if (globalCurrentAyah?.surahNumber === surah.number && isPlaying) {
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
            s.englishName.toLowerCase().includes(q) ||
            s.name.toLowerCase().includes(q) ||
            s.number.toString().includes(q)
        )
        : surahList
    );
  };

  // ─── Copy an Ayah's text (with translation) ──────────────────────────────────
  const copyAyah = async (ayah: Ayah) => {
    const text =
      viewMode === "translation"
        ? `${ayah.text}\n\n${ayah.englishText}\n\n${surah?.englishName} ${ayah.number
        }`
        : `${ayah.text}\n\n${surah?.englishName} ${ayah.number}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAyah(ayah.number);
      setTimeout(() => setCopiedAyah(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // ─── Share an Ayah's text ────────────────────────────────────────────────────
  const shareAyah = async (ayah: Ayah) => {
    const shareText =
      viewMode === "translation"
        ? `${ayah.text}\n\n${ayah.englishText}\n\n${surah?.englishName} ${ayah.number
        }`
        : `${ayah.text}\n\n${surah?.englishName} ${ayah.number}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${surah?.englishName} ${ayah.number}`,
          text: shareText,
        });
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopiedAyah(ayah.number);
        setTimeout(() => setCopiedAyah(null), 2000);
        alert("Ayah copied to clipboard!");
      }
    } catch (err) {
      console.error("Failed to share:", err);
    }
  };

  // ─── RENDER: loading / error / "no surah" ────────────────────────────────────
  if (loading)
    return (
      <div className="flex justify-center items-center h-screen dark:bg-gray-900">
        <p className="text-center dark:text-gray-200">Loading Surah…</p>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col justify-center items-center h-screen dark:bg-gray-900">
        <p className="text-center text-red-600 dark:text-red-400 mb-4">
          {error}
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Return to Home
        </button>
      </div>
    );

  if (!surah)
    return (
      <div className="flex flex-col justify-center items-center h-screen dark:bg-gray-900">
        <p className="text-center text-red-600 dark:text-red-400 mb-4">
          Surah not found.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Return to Home
        </button>
      </div>
    );

  // ─── Compute Mushaf page if needed (Reading view) ─────────────────────────────
  const startingMushafPage =
    currentSurahNumber && SURAH_TO_PAGE[currentSurahNumber]
      ? SURAH_TO_PAGE[currentSurahNumber]
      : 1;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* ─── HEADER ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Surah selector (only in Translation view) */}
            {viewMode === "translation" && (
              <div className="flex items-center gap-4">
                <div className="relative">
                  <button
                    onClick={() =>
                      setIsSurahDropdownOpen(!isSurahDropdownOpen)
                    }
                    className="flex items-center gap-2 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm font-medium"
                  >
                    {surah.englishName} ({surah.name})
                    <FaChevronDown
                      className={`transition-transform ${isSurahDropdownOpen ? "transform rotate-180" : ""
                        }`}
                      size={12}
                    />
                  </button>
                  {isSurahDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-56 max-h-96 overflow-y-auto bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
                      <div className="sticky top-0 p-2 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <FaSearch className="text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSurahSearch}
                            placeholder="Search surahs..."
                            className="w-full pl-10 pr-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="py-1">
                        {filteredSurahList.length > 0 ? (
                          filteredSurahList.map((s) => (
                            <button
                              key={s.number}
                              onClick={() => {
                                navigateToSurah(s.number);
                                setIsSurahDropdownOpen(false);
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm ${s.number === surah.number
                                ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                }`}
                            >
                              {s.number}. {s.englishName} ({s.name})
                            </button>
                          ))
                        ) : (
                          <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                            No surahs found
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* View Mode / Translation / Reciter / Play Audio */}
            <div className="flex flex-wrap items-center gap-3">
              {/* View Mode Buttons */}
              <div className="flex rounded-md shadow-sm">
                <button
                  onClick={() => setViewMode("translation")}
                  className={`px-3 py-2 text-sm font-medium flex items-center gap-2 ${viewMode === "translation"
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    } rounded-l-md`}
                >
                  Translation
                </button>
                <button
                  onClick={() => setViewMode("page")}
                  className={`px-3 py-2 text-sm font-medium rounded-r-md flex items-center gap-2 ${viewMode === "page"
                    ? "bg-emerald-500 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                >
                  Reading
                </button>
              </div>

              {/* Translation Selector */}
              {viewMode === "translation" && (
                <select
                  value={translation}
                  onChange={(e) => setTranslation(e.target.value)}
                  className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="en.sahih">English</option>
                  <option value="bn.bengali">Bengali</option>
                  <option value="ur.jalandhry">Urdu</option>
                  <option value="fr.hamidullah">French (Hamidullah)</option>
                  <option value="de.aburida">German (Abu Rida)</option>
                  <option value="tr.diyanet">Turkish (Diyanet)</option>
                  <option value="id.muntakhab">Indonesian</option>
                </select>
              )}

              {/* Reciter Selector */}
              {viewMode === "translation" && (
                <select
                  value={reciter}
                  onChange={(e) => setReciter(e.target.value)}
                  className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="ar.alafasy">Mishary Alafasy</option>
                  <option value="ar.minshawi">Minshawi</option>
                  <option value="ar.sudais">Abdur-Rahman as-Sudais</option>
                  <option value="ar.husary">Al-Husary</option>
                  <option value="ar.abdulbasitmurattal">Abdul Basit</option>
                  <option value="ar.saoodshuraym">Saood Shuraym</option>
                  <option value="ar.abdullahbasfar">Abdullah Basfar</option>
                  <option value="ar.abdulsamad">Abdul Samad</option>
                  <option value="ar.shaatree">Abu Bakr Ash-Shatri</option>
                  <option value="ar.ahmedajamy">Ahmed Al-Ajamy</option>
                  <option value="ar.hanirifai">Hani Ar-Rifai</option>
                  <option value="ar.ibrahimakhbar">Ibrahim Al-Akhdar</option>
                  <option value="ar.mahermuaiqly">Maher Al-Muaiqly</option>
                  <option value="ar.muhammadayyoub">Muhammad Ayyub</option>
                  <option value="ar.muhammadjibreel">Muhammad Jibreel</option>
                </select>
              )}

              {/* Play All Button */}
              {viewMode === "translation" && (
                <button
                  onClick={handlePlayAll}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${(isPlaying && globalCurrentAyah?.surahNumber === surah.number)
                    ? "bg-red-500 text-white hover:bg-red-600"
                    : "bg-emerald-500 text-white hover:bg-emerald-600"
                    }`}
                >
                  {(isPlaying && globalCurrentAyah?.surahNumber === surah.number) ? (
                    <>
                      <FaPause size={14} /> Stop
                    </>
                  ) : (
                    <>
                      <FaPlay size={14} /> Play All
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Navigation Between Surahs */}
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={prevSurah}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-emerald-500 transition-colors"
            >
              <FaBackward /> Previous Surah
            </button>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {surah.englishName}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {surah.englishNameTranslation} • {surah.ayahs.length} Verses
              </p>
            </div>
            <button
              onClick={nextSurah}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-emerald-500 transition-colors"
            >
              Next Surah <FaForward />
            </button>
          </div>
        </div>
      </div>

      {/* ─── CONTENT ─────────────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-8 pb-32">
        {viewMode === "page" ? (
          <PageView initialPage={startingMushafPage} />
        ) : (
          <div className="space-y-6">
            {/* Bismillah (skip for Surah 1 & 9) */}
            {![1, 9].includes(surah.number) && (
              <div className="text-center mb-10">
                <p className="font-arabic text-4xl text-gray-800 dark:text-gray-200 leading-looose">
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                </p>
              </div>
            )}

            {surah.ayahs.map((ayah) => {
              const isPlayingThis =
                globalCurrentAyah?.surahNumber === surah.number &&
                globalCurrentAyah?.number === ayah.number &&
                isPlaying;

              const isTafsirOpen = activeTafsirAyah === ayah.number;

              return (
                <div
                  key={ayah.number}
                  id={`ayah-${ayah.number}`}
                  className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border transition-colors duration-200 ${isPlayingThis
                    ? "border-emerald-500 ring-1 ring-emerald-500 bg-emerald-50 dark:bg-gray-700"
                    : "border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600"
                    }`}
                >
                  <div className="flex flex-col gap-6">
                    {/* Top Bar: Number + Actions */}
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-4">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 font-medium text-sm">
                          {ayah.number}
                        </span>
                        {/* Bookmark Button */}
                        <button
                          onClick={() => handleBookmarkToggle(surah.number, ayah.number)}
                          className={`p-2 rounded-full transition-colors ${isAyahBookmarked(surah.number, ayah.number)
                            ? "text-yellow-400 hover:text-yellow-500"
                            : "text-gray-400 hover:text-gray-500"
                            }`}
                          title="Bookmark"
                        >
                          {isAyahBookmarked(surah.number, ayah.number) ? (
                            <FaStar />
                          ) : (
                            <FaRegStar />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Play Button */}
                        <button
                          onClick={() => handlePlayAyah(ayah)}
                          className={`p-2 rounded-full transition-colors ${isPlayingThis
                            ? "text-emerald-600 bg-emerald-100"
                            : "text-gray-400 hover:text-emerald-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                          title={isPlayingThis ? "Pause" : "Play"}
                        >
                          {isPlayingThis ? <FaPause size={14} /> : <FaPlay size={14} />}
                        </button>

                        {/* Tafsir Button */}
                        <button
                          onClick={() => setActiveTafsirAyah(isTafsirOpen ? null : ayah.number)}
                          className={`p-2 rounded-full transition-colors ${isTafsirOpen
                            ? "text-emerald-600 bg-emerald-100 dark:bg-emerald-900/50"
                            : "text-gray-400 hover:text-emerald-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                            }`}
                          title="Read Tafsir"
                        >
                          <FaBookOpen size={14} />
                        </button>

                        <button
                          onClick={() => copyAyah(ayah)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          title="Copy"
                        >
                          {copiedAyah === ayah.number ? (
                            <FaCheck className="text-emerald-500" />
                          ) : (
                            <FaCopy size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => shareAyah(ayah)}
                          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          title="Share"
                        >
                          <FaShare size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Arabic Text */}
                    <div className="w-full">
                      <p className="font-arabic text-right text-3xl md:text-4xl leading-[2.5] text-gray-900 dark:text-gray-100 py-2">
                        {ayah.text}
                      </p>
                    </div>

                    {/* Translation */}
                    <div className="w-full">
                      <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed font-light">
                        {ayah.englishText}
                      </p>
                    </div>

                    {/* Inline Tafsir View */}
                    {isTafsirOpen && (
                      <div className="w-full border-t border-gray-100 dark:border-gray-700 pt-4">
                        <TafsirView surahNumber={surah.number} ayahNumber={ayah.number} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

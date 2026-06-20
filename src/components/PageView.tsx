// src/components/PageView.tsx

import { useEffect, useState } from "react";
import { fetchPage } from "../services/quranService";
import type { PageAyah } from "../services/quranService";

interface PageViewProps {
  initialPage?: number;
  isHighQuality?: boolean;
}

export default function PageView({ initialPage = 1, isHighQuality = false }: PageViewProps) {
  // ─── State ──────────────────────────────────────────────────────────────────
  const [page, setPage] = useState<number>(initialPage);
  // We still fetch the page data to know WHICH ayahs are on this page
  const [ayahs, setAyahs] = useState<PageAyah[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // There are 604 pages in the Uthmānī Mushaf.
  const MAX_PAGE = 604;

  // ─── 1) Fetch Mushaf page metadata whenever `page` changes ────────────────────────
  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setError(null);

    fetchPage(page, "quran-uthmani")
      .then((data) => {
        if (!cancelled) {
          setAyahs(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  // ─── 2) Helper to construct Image URL ─────────────────────────────────────────────
  const getAyahImageUrl = (surahNum: number, ayahNum: number) => {
    const baseUrl = "https://cdn.islamic.network/quran/images";
    if (isHighQuality) {
      return `${baseUrl}/high-resolution/${surahNum}_${ayahNum}.png`;
    }
    return `${baseUrl}/${surahNum}_${ayahNum}.png`;
  };

  // ─── Navigation Handlers ──────────────────────────────────────────────────────────
  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < MAX_PAGE) {
      setPage(page + 1);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 py-8 px-4">
      {/* ─── Top Navigation ────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 sticky top-20 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm p-2 rounded-full shadow-sm border border-gray-200 dark:border-gray-700">
        <button
          onClick={handlePreviousPage}
          disabled={page <= 1}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${page <= 1
            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
            : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg"
            }`}
        >
          Previous Page
        </button>
        <span className="text-lg font-bold text-gray-800 dark:text-gray-200 min-w-[80px] text-center font-mono">
          Page {page}
        </span>
        <button
          onClick={handleNextPage}
          disabled={page >= MAX_PAGE}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${page >= MAX_PAGE
            ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
            : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md hover:shadow-lg"
            }`}
        >
          Next Page
        </button>
      </div>

      {/* ─── Loading / Error States ───────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading Page {page}...</p>
        </div>
      )}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
          <p>Error loading page: {error}</p>
          <button onClick={() => window.location.reload()} className="mt-2 text-sm underline">Retry</button>
        </div>
      )}

      {/* ─── Mushaf Content (Images) ───────────────────────────────────────────────────── */}
      {!loading && !error && (
        <div className="w-full max-w-4xl flex flex-col items-center gap-6 animate-fadeIn">

          {/* Paper Container - Enforce Light Theme Appearance */}
          <div className="bg-[#fdf6e3] rounded-sm shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] border border-[#e8dcb8] p-6 md:p-10 w-full min-h-[600px] transition-all">

            {/* Ayah Images Container */}
            <div className="flex flex-wrap justify-center items-center gap-1 md:gap-2 leading-[2.5] md:leading-[3]" dir="rtl">
              {ayahs.map((ayah) => (
                <div key={`${ayah.surah.number}-${ayah.numberInSurah}`} className="relative group inline-block">
                  <img
                    src={getAyahImageUrl(ayah.surah.number, ayah.numberInSurah)}
                    alt={`Surah ${ayah.surah.englishName} Verse ${ayah.numberInSurah}`}
                    className={`max-w-full h-auto object-contain select-none mix-blend-multiply ${
                      // Removed all height constraints to respect the original image size/aspect ratio.
                      // Styles will strictly follow h-auto w-auto (max-w-full from parent).
                      ""
                      } opacity-90 hover:opacity-100 transition-opacity`}
                    // Removed dark:invert to keep text black on the cream background
                    loading="lazy"
                  />

                  {/* Tooltip on hover */}
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 font-sans">
                    {ayah.surah.number}:{ayah.numberInSurah}
                  </span>
                </div>
              ))}
            </div>

            {/* Page Footer inside the paper */}
            <div className="mt-12 pt-6 border-t border-[#e8dcb8]/50 flex justify-between items-center text-[#8b8066] text-xs font-mono select-none">
              <span>Page {page}</span>
              <span className="opacity-50">Hafs • Madani</span>
            </div>

          </div>

          {/* Source attribution outside paper */}
          <div className="text-xs text-gray-400 font-mono opacity-50">
            Source: Islamic Network CDN
          </div>
        </div>
      )}

      {/* ─── Bottom Navigation (duplicate) ────────────────────────────────────────────── */}
      {!loading && (
        <div className="flex items-center gap-4 mt-8 pb-12">
          <button
            onClick={handlePreviousPage}
            disabled={page <= 1}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${page <= 1
              ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
              : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
              }`}
          >
            Previous
          </button>
          <span className="text-gray-500 dark:text-gray-400 font-mono text-sm">
            {page} / {MAX_PAGE}
          </span>
          <button
            onClick={handleNextPage}
            disabled={page >= MAX_PAGE}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${page >= MAX_PAGE
              ? "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
              : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
              }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

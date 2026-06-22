import { useEffect, useRef, useState } from "react";
import { FaSearch, FaSpinner, FaTimes } from "react-icons/fa";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  QURAN_SEARCH_EDITIONS,
  addSearchHistory,
  clearSearchHistory,
  highlightLiteralText,
  isQuranSearchEdition,
  loadSearchHistory,
  type QuranSearchEdition,
} from "../core/quran/search";
import type { SurahMetadata } from "../core/quran/contracts";
import {
  fetchSurahList,
  searchAyahs,
  type SearchMatch,
} from "../services/quranService";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function parseFilterNumber(value: string | null, maximum: number): number | "" {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= maximum
    ? parsed
    : "";
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [edition, setEdition] = useState<QuranSearchEdition>(() => {
    const value = searchParams.get("edition");
    return isQuranSearchEdition(value) ? value : "en.sahih";
  });
  const [surahNumber, setSurahNumber] = useState<number | "">(() =>
    parseFilterNumber(searchParams.get("surah"), 114),
  );
  const [juzNumber, setJuzNumber] = useState<number | "">(() =>
    parseFilterNumber(searchParams.get("juz"), 30),
  );
  const [surahs, setSurahs] = useState<SurahMetadata[]>([]);
  const [results, setResults] = useState<SearchMatch[]>([]);
  const [history, setHistory] = useState(() =>
    loadSearchHistory(localStorage),
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);
  const closingRef = useRef(false);
  const navigate = useNavigate();
  const trimmedQuery = query.trim();

  useEffect(() => {
    void fetchSurahList().then(setSurahs);
  }, []);

  useEffect(() => {
    if (isOpen) closingRef.current = false;
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || closingRef.current) return;
    const nextParams = new URLSearchParams(searchParams);

    if (trimmedQuery) nextParams.set("q", trimmedQuery);
    else nextParams.delete("q");
    nextParams.set("edition", edition);
    if (surahNumber) nextParams.set("surah", String(surahNumber));
    else nextParams.delete("surah");
    if (juzNumber) nextParams.set("juz", String(juzNumber));
    else nextParams.delete("juz");

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    edition,
    isOpen,
    juzNumber,
    searchParams,
    setSearchParams,
    surahNumber,
    trimmedQuery,
  ]);

  useEffect(() => {
    if (!isOpen) return;

    if (trimmedQuery.length < 3) {
      requestId.current += 1;
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    const currentRequestId = requestId.current + 1;
    requestId.current = currentRequestId;
    const controller = new AbortController();

    const delay = setTimeout(() => {
      setLoading(true);
      setError(null);
      setResults([]);

      void searchAyahs(
        {
          query: trimmedQuery,
          edition,
          surahNumber: surahNumber || undefined,
          juzNumber: juzNumber || undefined,
        },
        controller.signal,
      )
        .then((data) => {
          if (requestId.current === currentRequestId) {
            setResults(data);
            setHistory(addSearchHistory(localStorage, trimmedQuery));
          }
        })
        .catch((searchError: unknown) => {
          if (
            requestId.current === currentRequestId &&
            !(searchError instanceof DOMException &&
              searchError.name === "AbortError")
          ) {
            setError("Search is temporarily unavailable. Please try again.");
          }
        })
        .finally(() => {
          if (requestId.current === currentRequestId) {
            setLoading(false);
          }
        });
    }, 450);

    return () => {
      clearTimeout(delay);
      controller.abort();
    };
  }, [edition, isOpen, juzNumber, surahNumber, trimmedQuery]);

  const handleResultClick = (match: SearchMatch) => {
    closingRef.current = true;
    navigate(`/quran/${match.surah.number}#ayah-${match.numberInSurah}`);
    onClose();
  };

  const handleClose = () => {
    closingRef.current = true;
    onClose();
  };

  const handleClearHistory = () => {
    clearSearchHistory(localStorage);
    setHistory([]);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-3 pt-12 backdrop-blur-sm animate-fadeIn sm:pt-20"
      onClick={handleClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quran-search-title"
        className="w-full max-w-3xl overflow-hidden rounded-xl border border-gray-100 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-gray-100 p-4 dark:border-gray-700">
          <FaSearch className="text-lg text-gray-400" aria-hidden="true" />
          <h2 id="quran-search-title" className="sr-only">
            Search Quran
          </h2>
          <input
            type="search"
            placeholder="Search Arabic or a translation..."
            aria-label="Search Quran"
            className="min-w-0 flex-1 bg-transparent text-lg text-gray-900 placeholder-gray-400 focus:outline-none dark:text-white"
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close Quran search"
            className="min-h-11 min-w-11 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            <FaTimes aria-hidden="true" />
          </button>
        </div>

        <div
          className="grid gap-3 border-b border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40 sm:grid-cols-3"
          aria-label="Search filters"
        >
          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            Language
            <select
              value={edition}
              onChange={(event) =>
                setEdition(event.target.value as QuranSearchEdition)
              }
              className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              {QURAN_SEARCH_EDITIONS.map((item) => (
                <option key={item.identifier} value={item.identifier}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            Surah
            <select
              value={surahNumber}
              onChange={(event) =>
                setSurahNumber(event.target.value ? Number(event.target.value) : "")
              }
              className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Surahs</option>
              {surahs.map((surah) => (
                <option key={surah.number} value={surah.number}>
                  {surah.number}. {surah.transliteratedName}
                </option>
              ))}
            </select>
          </label>

          <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            Juz
            <select
              value={juzNumber}
              onChange={(event) =>
                setJuzNumber(event.target.value ? Number(event.target.value) : "")
              }
              className="mt-1 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Juz</option>
              {Array.from({ length: 30 }, (_, index) => index + 1).map(
                (juz) => (
                  <option key={juz} value={juz}>
                    Juz {juz}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>

        <div className="max-h-[58vh] overflow-y-auto" aria-live="polite">
          {loading ? (
            <div
              className="flex flex-col items-center justify-center py-12 text-gray-400"
              role="status"
            >
              <FaSpinner
                className="mb-2 animate-spin text-2xl"
                aria-hidden="true"
              />
              <p>Searching…</p>
            </div>
          ) : error ? (
            <div
              className="px-4 py-12 text-center text-red-600 dark:text-red-400"
              role="alert"
            >
              {error}
            </div>
          ) : results.length > 0 ? (
            <>
              <p className="border-b border-gray-100 px-4 py-2 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                {results.length} {results.length === 1 ? "result" : "results"}
              </p>
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {results.map((match) => (
                  <li key={`${match.edition.identifier}-${match.number}`}>
                    <button
                      type="button"
                      onClick={() => handleResultClick(match)}
                      className="block w-full p-4 text-left transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 dark:hover:bg-gray-700/50"
                    >
                      <div className="mb-1 flex items-start justify-between gap-3">
                        <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          {match.surah.englishName} ({match.surah.name})
                        </h3>
                        <span className="shrink-0 rounded bg-gray-100 px-2 py-1 text-xs text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                          {match.surah.number}:{match.numberInSurah}
                        </span>
                      </div>
                      <p
                        className="text-sm leading-relaxed text-gray-700 dark:text-gray-300"
                        lang={edition === "quran-simple" ? "ar" : undefined}
                        dir={edition === "quran-simple" ? "rtl" : undefined}
                      >
                        {highlightLiteralText(match.text, trimmedQuery).map(
                          (segment, index) =>
                            segment.highlighted ? (
                              <mark
                                key={`${index}-${segment.text}`}
                                className="bg-yellow-200 text-inherit dark:bg-yellow-900/50"
                              >
                                {segment.text}
                              </mark>
                            ) : (
                              <span key={`${index}-${segment.text}`}>
                                {segment.text}
                              </span>
                            ),
                        )}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : trimmedQuery.length >= 3 ? (
            <div className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
              No results found for “{trimmedQuery}”
            </div>
          ) : history.length > 0 ? (
            <div className="p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Recent searches
                </p>
                <button
                  type="button"
                  onClick={handleClearHistory}
                  className="text-sm text-gray-500 underline hover:text-red-600 dark:text-gray-400"
                >
                  Clear
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setQuery(item)}
                    className="rounded-full border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:border-emerald-500 dark:border-gray-600 dark:text-gray-200"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="px-4 py-12 text-center text-sm text-gray-400 dark:text-gray-500">
              Type at least 3 characters to search
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

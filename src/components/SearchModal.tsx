import { useEffect, useRef, useState } from "react";
import { FaSearch, FaTimes, FaSpinner } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { highlightLiteralText } from "../core/quran/search";
import { searchAyahs, type SearchMatch } from "../services/quranService";

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchMatch[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const requestId = useRef(0);
    const navigate = useNavigate();
    const trimmedQuery = query.trim();

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

        const delayDebounceFn = setTimeout(() => {
            setLoading(true);
            setError(null);
            setResults([]);

            void searchAyahs(trimmedQuery, "en.sahih", controller.signal)
                .then((data) => {
                    if (requestId.current === currentRequestId) {
                        setResults(data);
                    }
                })
                .catch((searchError: unknown) => {
                    if (
                        requestId.current === currentRequestId &&
                        !(searchError instanceof DOMException && searchError.name === "AbortError")
                    ) {
                        setError("Search is temporarily unavailable. Please try again.");
                    }
                })
                .finally(() => {
                    if (requestId.current === currentRequestId) {
                        setLoading(false);
                    }
                });
        }, 600);

        return () => {
            clearTimeout(delayDebounceFn);
            controller.abort();
        };
    }, [isOpen, trimmedQuery]);

    const handleResultClick = (match: SearchMatch) => {
        onClose();
        navigate(`/quran/${match.surah.number}#ayah-${match.numberInSurah}`);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="quran-search-title"
                className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
                    <FaSearch className="text-gray-400 text-lg" aria-hidden="true" />
                    <h2 id="quran-search-title" className="sr-only">Search Quran</h2>
                    <input
                        type="text"
                        placeholder="Search Quran (e.g. 'Patience', 'Musa', 'Paradise')..."
                        aria-label="Search Quran"
                        className="flex-1 bg-transparent text-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close Quran search"
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <FaTimes aria-hidden="true" />
                    </button>
                </div>

                <div className="max-h-[60vh] overflow-y-auto" aria-live="polite">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400" role="status">
                            <FaSpinner className="animate-spin text-2xl mb-2" aria-hidden="true" />
                            <p>Searching...</p>
                        </div>
                    ) : error ? (
                        <div className="py-12 px-4 text-center text-red-600 dark:text-red-400" role="alert">
                            {error}
                        </div>
                    ) : results.length > 0 ? (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                            {results.map((match) => (
                                <li key={`${match.edition.identifier}-${match.number}`}>
                                    <button
                                        type="button"
                                        onClick={() => handleResultClick(match)}
                                        className="block w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500 transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                                                {match.surah.englishName} ({match.surah.name})
                                            </h4>
                                            <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                                Verse {match.numberInSurah}
                                            </span>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                            {highlightLiteralText(match.text, trimmedQuery).map((segment, index) =>
                                                segment.highlighted ? (
                                                    <mark
                                                        key={`${index}-${segment.text}`}
                                                        className="bg-yellow-200 dark:bg-yellow-900/50 text-inherit"
                                                    >
                                                        {segment.text}
                                                    </mark>
                                                ) : (
                                                    <span key={`${index}-${segment.text}`}>{segment.text}</span>
                                                ),
                                            )}
                                        </p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : trimmedQuery.length >= 3 ? (
                        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                            No results found for “{trimmedQuery}”
                        </div>
                    ) : (
                        <div className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
                            Type at least 3 characters to search
                        </div>
                    )}
                </div>

                {results.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-2 text-xs text-center text-gray-400 border-t border-gray-100 dark:border-gray-700">
                        Found {results.length} matches
                    </div>
                )}
            </div>
        </div>
    );
}

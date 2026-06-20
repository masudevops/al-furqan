import { useState, useEffect } from "react";
import { FaSearch, FaTimes, FaSpinner } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { searchAyahs, type SearchMatch } from "../services/quranService";

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchMatch[]>([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Debounce search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.trim().length > 2) {
                performSearch();
            } else {
                setResults([]);
            }
        }, 600);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const performSearch = async () => {
        setLoading(true);
        try {
            const data = await searchAyahs(query);
            setResults(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleResultClick = (match: SearchMatch) => {
        onClose();
        // Navigate to Surah and scroll to Ayah
        // We'll use a URL hash or query param. Hash is standard for anchors.
        navigate(`/quran/${match.surah.number}#ayah-${match.numberInSurah}`);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
            <div
                className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 mx-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Search Header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
                    <FaSearch className="text-gray-400 text-lg" />
                    <input
                        type="text"
                        placeholder="Search Quran (e.g. 'Patience', 'Musa', 'Paradise')..."
                        className="flex-1 bg-transparent text-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <FaTimes />
                    </button>
                </div>

                {/* Results List */}
                <div className="max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                            <FaSpinner className="animate-spin text-2xl mb-2" />
                            <p>Searching...</p>
                        </div>
                    ) : results.length > 0 ? (
                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                            {results.map((match, idx) => (
                                <div
                                    key={`${match.surah.number}-${match.numberInSurah}-${idx}`}
                                    onClick={() => handleResultClick(match)}
                                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                                            {match.surah.englishName} ({match.surah.name})
                                        </h4>
                                        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                            Verse {match.numberInSurah}
                                        </span>
                                    </div>
                                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed"
                                        dangerouslySetInnerHTML={{
                                            // Basic highlighting of query terms could happen here, simpler to just show text
                                            __html: match.text.replace(new RegExp(`(${query})`, 'gi'), '<mark class="bg-yellow-200 dark:bg-yellow-900/50 text-inherit">$1</mark>')
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    ) : query.length > 2 ? (
                        <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                            No results found for "{query}"
                        </div>
                    ) : (
                        <div className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
                            Type at least 3 characters to search
                        </div>
                    )}
                </div>

                {/* Footer */}
                {results.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-2 text-xs text-center text-gray-400 border-t border-gray-100 dark:border-gray-700">
                        Found {results.length} matches
                    </div>
                )}
            </div>
        </div>
    );
}

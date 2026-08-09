// src/components/TafsirView.tsx
import { useState, useEffect } from "react";
import { fetchTafsir, AVAILABLE_TAFSIRS, type TafsirAyah } from "../services/tafsirService";

interface TafsirViewProps {
    surahNumber: number;
    ayahNumber: number;
}

export default function TafsirView({ surahNumber, ayahNumber }: TafsirViewProps) {
    const [edition, setEdition] = useState("en.ibnkathir");
    const [data, setData] = useState<TafsirAyah | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            setLoading(true);
            setError(null);
            setData(null);

            const result = await fetchTafsir(surahNumber, ayahNumber, edition);

            if (!cancelled) {
                if (result) {
                    setData(result);
                } else {
                    setError("Tafsir not available for this verse/language.");
                }
                setLoading(false);
            }
        };

        load();

        return () => { cancelled = true; };
    }, [surahNumber, ayahNumber, edition]);

    return (
        <div className="mt-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 border border-gray-200 dark:border-gray-600 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Tafsir
                </h3>
                <select
                    value={edition}
                    onChange={(e) => setEdition(e.target.value)}
                    className="bg-white dark:bg-gray-700 text-sm border border-gray-300 dark:border-gray-500 rounded px-3 py-1 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                    {AVAILABLE_TAFSIRS.map((t) => (
                        <option key={t.identifier} value={t.identifier}>
                            {t.englishName}
                        </option>
                    ))}
                </select>
            </div>

            <div className="min-h-[100px]">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <span className="text-gray-500 dark:text-gray-400">Loading Tafsir...</span>
                    </div>
                ) : error ? (
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded">
                        {error}
                    </div>
                ) : (
                    <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed text-base">
                        {/* 
                  Caution: API might return HTML or plain text depending on edition. 
                  Al-Quran Cloud usually returns text but might contain newlines.
               */}
                        <p style={{ whiteSpace: "pre-wrap" }}>{data?.text}</p>
                    </div>
                )}
            </div>
        </div>
    );
}

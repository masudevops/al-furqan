// src/pages/HadithBook.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchHadithsByBook, type Hadith, HADITH_COLLECTIONS } from "../services/hadithService";
import { FaArrowLeft } from "react-icons/fa";

export default function HadithBookPage() {
    const { collectionId, bookNumber } = useParams<{ collectionId: string; bookNumber: string }>();
    const navigate = useNavigate();
    const [hadiths, setHadiths] = useState<Hadith[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const collectionInfo = HADITH_COLLECTIONS.find(c => c.id === collectionId);

    useEffect(() => {
        if (!collectionId || !bookNumber) return;

        const load = async () => {
            setLoading(true);
            try {
                const data = await fetchHadithsByBook(collectionId, bookNumber);
                setHadiths(data);
            } catch (err) {
                console.error(err);
                setError("Failed to load hadiths.");
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [collectionId, bookNumber]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <p className="text-gray-500">Loading Hadiths...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-10">
                <p className="text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => navigate(`/hadith/${collectionId}`)}
                    className="text-emerald-500 hover:underline"
                >
                    Back to Books
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <button
                onClick={() => navigate(`/hadith/${collectionId}`)}
                className="flex items-center gap-2 text-gray-500 hover:text-emerald-500 mb-6 transition-colors"
            >
                <FaArrowLeft /> Back to Book List
            </button>

            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {collectionInfo?.title}
                </h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Book {bookNumber}
                </p>
            </div>

            <div className="space-y-6">
                {hadiths.map((item, idx) => (
                    <div
                        key={idx}
                        className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-100 dark:border-gray-700"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono text-gray-500 dark:text-gray-400">
                                Hadith {item.hadithNumber}
                            </span>
                            {item.status && (
                                <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded text-xs font-semibold uppercase">
                                    {item.status}
                                </span>
                            )}
                        </div>

                        {/* Arabic */}
                        {item.hadithArabic && (
                            <div className="mb-6">
                                <p className="font-arabic text-right text-2xl leading-[2.2] text-gray-900 dark:text-gray-100">
                                    {item.hadithArabic}
                                </p>
                            </div>
                        )}

                        {/* Translation */}
                        <div>
                            {item.englishNarrator && (
                                <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    {item.englishNarrator}
                                </p>
                            )}
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                                {item.hadithEnglish}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {hadiths.length === 0 && (
                <p className="text-center text-gray-500 py-10">No hadiths found in this section.</p>
            )}
        </div>
    );
}

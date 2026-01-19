import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchChapters, type HadithChapter, HADITH_COLLECTIONS } from "../services/hadithService";
import { FaArrowLeft } from "react-icons/fa";
import SEO from "../components/SEO";

export default function HadithCollection() {
    const { collectionId } = useParams<{ collectionId: string }>();
    const navigate = useNavigate();
    const [chapters, setChapters] = useState<HadithChapter[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const collectionInfo = HADITH_COLLECTIONS.find(c => c.id === collectionId);

    useEffect(() => {
        if (!collectionId) return;

        const loadChapters = async () => {
            setLoading(true);
            try {
                const data = await fetchChapters(collectionId);
                setChapters(data);
            } catch (err) {
                console.error(err);
                setError("Failed to load chapters for this collection.");
            } finally {
                setLoading(false);
            }
        };
        loadChapters();
    }, [collectionId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
                <p className="ml-3 text-gray-500">Loading Chapters...</p>
            </div>
        );
    }

    if (error || !collectionInfo) {
        return (
            <div className="text-center py-10">
                <p className="text-red-500 mb-4">{error || "Collection not found"}</p>
                <button
                    onClick={() => navigate("/hadith")}
                    className="text-emerald-500 hover:underline"
                >
                    Back to Collections
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <SEO
                title={`${collectionInfo.title} - Hadith Chapters`}
                description={collectionInfo.description || "Browse Hadith chapters"}
            />

            <button
                onClick={() => navigate("/hadith")}
                className="flex items-center gap-2 text-gray-500 hover:text-emerald-500 mb-6 transition-colors"
            >
                <FaArrowLeft /> Back to Collections
            </button>

            <div className="mb-8 border-b border-gray-100 dark:border-gray-700 pb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                    {collectionInfo.title}
                </h1>
                {collectionInfo.arabicName && (
                    <p className="text-xl font-arabic text-gray-600 dark:text-gray-400 mt-2">
                        {collectionInfo.arabicName}
                    </p>
                )}
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Select a chapter to read hadiths.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {chapters.map((chapter) => (
                    <Link
                        key={chapter.id}
                        to={`/hadith/${collectionId}/${chapter.chapterNumber}`}
                        className="block p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-md transition-all"
                    >
                        <div className="flex items-start gap-3">
                            <span className="flex items-center justify-center min-w-[2rem] h-8 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
                                {chapter.chapterNumber}
                            </span>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200 line-clamp-2 mb-1">
                                    {chapter.chapterEnglish}
                                </h3>
                                {chapter.chapterArabic && (
                                    <p className="text-sm font-arabic text-gray-500 dark:text-gray-400 line-clamp-1">
                                        {chapter.chapterArabic}
                                    </p>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {chapters.length === 0 && (
                <p className="text-center text-gray-500 mt-10">No chapters found.</p>
            )}
        </div>
    );
}

import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { fetchBooks, type HadithBook, HADITH_COLLECTIONS } from "../services/hadithService";
import { FaArrowLeft } from "react-icons/fa";

export default function HadithCollection() {
    const { collectionId } = useParams<{ collectionId: string }>();
    const navigate = useNavigate();
    const [books, setBooks] = useState<HadithBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const collectionInfo = HADITH_COLLECTIONS.find(c => c.id === collectionId);

    useEffect(() => {
        if (!collectionId) return;

        const loadBooks = async () => {
            setLoading(true);
            try {
                const data = await fetchBooks(collectionId);
                setBooks(data);
            } catch (err) {
                console.error(err);
                setError("Failed to load books for this collection.");
            } finally {
                setLoading(false);
            }
        };
        loadBooks();
    }, [collectionId]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <p className="text-gray-500">Loading Books...</p>
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
        <div className="max-w-4xl mx-auto pb-10">
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
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                    Select a book (chapter) to read hadiths.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {books.map((book) => (
                    <Link
                        key={book.bookNumber}
                        to={`/hadith/${collectionId}/${book.bookNumber}`}
                        className="block p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm font-medium">
                                {book.bookNumber}
                            </span>
                            <div>
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200 line-clamp-2">
                                    {book.bookName}
                                </h3>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {books.length === 0 && (
                <p className="text-center text-gray-500 mt-10">No books found.</p>
            )}
        </div>
    );
}

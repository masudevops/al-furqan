import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HADITH_COLLECTIONS, type HadithCollection } from "../services/hadithService";
import { FaBook } from "react-icons/fa";
import SEO from "../components/SEO";

export default function HadithHome() {
    const [collections, setCollections] = useState<HadithCollection[]>([]);

    useEffect(() => {
        setCollections(HADITH_COLLECTIONS);
    }, []);

    return (
        <div className="container mx-auto px-4 py-10">
            <SEO title="Hadith Collections" description="Browse authentic Hadith collections" />

            <h1 className="text-3xl font-bold text-center mb-10 text-gray-800 dark:text-white">
                Hadith Collections
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {collections.map(c => (
                    <Link
                        to={`/hadith/${c.id}`}
                        key={c.id}
                        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-emerald-500 transition-all group"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                <FaBook size={20} />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 group-hover:text-emerald-500 transition-colors">
                                    {c.title}
                                </h3>
                                {c.arabicName && (
                                    <p className="text-sm font-arabic text-gray-600 dark:text-gray-400 mb-1">
                                        {c.arabicName}
                                    </p>
                                )}
                                <p className="text-sm text-gray-500">
                                    {c.total.toLocaleString()} Hadiths
                                </p>
                                {c.description && (
                                    <p className="text-xs text-gray-400 mt-1">
                                        {c.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

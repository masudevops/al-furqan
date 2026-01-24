import { useState } from "react";
import PageView from "../components/PageView";
import SEO from "../components/SEO";

export default function MushafPage() {
    const [isHighQuality, setIsHighQuality] = useState(false);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            <SEO title="Mushaf View" description="Read Quran" />

            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-3 px-4 shadow-sm z-10">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <h1 className="font-bold text-gray-800 dark:text-gray-100">Mushaf View</h1>

                    <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 dark:text-gray-300">HD Images</span>
                        <button
                            onClick={() => setIsHighQuality(!isHighQuality)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isHighQuality ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-600'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isHighQuality ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-grow py-6 overflow-auto">
                <PageView initialPage={1} isHighQuality={isHighQuality} />
            </div>
        </div>
    );
}

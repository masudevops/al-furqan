import { useState } from "react";
import PageView from "../components/PageView";
// import Home from "./Home";  
// Actually Home.tsx was redesigned to contain Surah List. 
// We should probably extract Surah List or reuse Home logic.
// For now, let's assume we copy the Surah List logic or just redirect to Home for list.
// But specs say: Al Qur'an page has tabs.

// Let's create a dedicated SurahList component later, but for now
// we will implement a simple list here or pull from Home.
// To keep it clean, I'll inline the list or make a component if needed.
// Reusing Home's logic for now but stripping the Landing/Hero part.

import { Link } from "react-router-dom";
import { useEffect } from "react";
import { fetchSurahList, type Surah } from "../services/quranService";
import { FaSearch } from "react-icons/fa";
import SEO from "../components/SEO";

function FileSurahList() {
    // Duplicate logic from Home for now to be safe and fast, 
    // ideally refactor Home to use this component.
    const [surahList, setSurahList] = useState<Surah[]>([]);
    const [filtered, setFiltered] = useState<Surah[]>([]);
    const [q, setQ] = useState("");

    useEffect(() => {
        fetchSurahList().then(data => {
            console.log(`Loaded ${data.length} Surahs`);
            setSurahList(data);
            setFiltered(data);
        });
    }, []);

    const handleSearch = (val: string) => {
        setQ(val);
        const term = val.toLowerCase();
        setFiltered(surahList.filter(s =>
            s.englishName.toLowerCase().includes(term) ||
            s.name.toLowerCase().includes(term) ||
            String(s.number).includes(term)
        ));
    };

    return (
        <div className="py-6">
            {/* Search */}
            <div className="relative mb-6">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search Surah..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    value={q}
                    onChange={e => handleSearch(e.target.value)}
                />
            </div>

            {/* Surah Count */}
            <div className="mb-4 text-sm text-gray-500 dark:text-gray-400">
                Showing {filtered.length} of {surahList.length} Surahs
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-none overflow-visible">
                {filtered.map(s => (
                    <Link to={`/quran/${s.number}`} key={s.number} className="p-4 border rounded-lg hover:shadow-sm dark:bg-gray-800 dark:border-gray-700 flex justify-between items-center group transition-colors hover:border-emerald-500">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 group-hover:bg-emerald-100 group-hover:text-emerald-600">
                                {s.number}
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200">{s.englishName}</h3>
                                <p className="text-xs text-gray-500">{s.englishNameTranslation}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-arabic text-lg text-gray-800 dark:text-gray-200">{s.name.replace("سُورَةُ ", "")}</p>
                            <p className="text-xs text-gray-400">{s.revelationType}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default function AlQuranPage() {
    const [activeTab, setActiveTab] = useState<"list" | "mushaf">("list");

    return (
        <>
            <SEO title="Al Qur'an" description="Read and Listen to the Holy Quran" />
            <div className="max-w-6xl mx-auto px-4 py-8 min-h-screen">
                <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-6">
                    <button
                        onClick={() => setActiveTab("list")}
                        className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === "list"
                            ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            }`}
                    >
                        Surah List
                    </button>
                    <button
                        onClick={() => setActiveTab("mushaf")}
                        className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === "mushaf"
                            ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
                            }`}
                    >
                        Mushaf View
                    </button>
                </div>

                {activeTab === "list" ? (
                    <FileSurahList />
                ) : (
                    <div className="py-4">
                        <div className="text-center mb-4 text-sm text-gray-500">
                            Page Read Mode
                        </div>
                        <PageView initialPage={1} />
                    </div>
                )}
            </div>
        </>
    );
}

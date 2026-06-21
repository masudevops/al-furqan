import { useState } from "react";
import PageView from "../components/PageView";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { fetchSurahList, type Surah } from "../services/quranService";
import { FaSearch } from "react-icons/fa";
import SEO from "../components/SEO";
import { useFeatureFlags } from "../hooks/useFeatureFlags";
import { FeatureGate } from "../components/FeatureGate";
import { getWebReadingContinuityRepository } from "../platform/web/readingContinuity";
import type { ReadingContinuityState } from "../core/quran/readingContinuity";

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
            s.transliteratedName.toLowerCase().includes(term) ||
            s.arabicName.toLowerCase().includes(term) ||
            s.translatedName.toLowerCase().includes(term) ||
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
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200">{s.transliteratedName}</h3>
                                <p className="text-xs text-gray-500">{s.translatedName}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-noto text-xl text-gray-800 dark:text-gray-200" lang="ar" dir="rtl">{s.arabicName.replace("سُورَةُ ", "")}</p>
                            <p className="text-xs text-gray-400">{s.revelationType} • {s.ayahCount} ayahs</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default function AlQuranPage() {
    const { mushafView } = useFeatureFlags();
    const [activeTab, setActiveTab] = useState<"list" | "mushaf">(mushafView ? "list" : "list");
    const [continuity] = useState<ReadingContinuityState>(() =>
        getWebReadingContinuityRepository().getState(),
    );

    return (
        <>
            <SEO title="Al Qur'an" description="Read and Listen to the Holy Quran" />
            <div className="max-w-6xl mx-auto px-4 py-8 min-h-screen">
                {(continuity.lastRead || continuity.recentSurahs.length > 0) && (
                    <section
                        aria-labelledby="continue-reading-title"
                        className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900/60 dark:bg-emerald-950/30"
                    >
                        <h1 id="continue-reading-title" className="text-xl font-bold text-gray-900 dark:text-white">
                            Continue reading
                        </h1>
                        {continuity.lastRead && (
                            <Link
                                to={`/quran/${continuity.lastRead.ref.surahNumber}#ayah-${continuity.lastRead.ref.ayahNumber}`}
                                className="mt-3 inline-flex rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white hover:bg-emerald-700"
                            >
                                Resume Surah {continuity.lastRead.ref.surahNumber}, Ayah {continuity.lastRead.ref.ayahNumber}
                            </Link>
                        )}
                        {continuity.recentSurahs.length > 0 && (
                            <div className="mt-4">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                    Recent Surahs
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {continuity.recentSurahs.map((recent) => (
                                        <Link
                                            key={recent.surahNumber}
                                            to={`/quran/${recent.surahNumber}#ayah-${recent.lastAyahNumber}`}
                                            className="rounded-full border border-emerald-300 bg-white px-3 py-1.5 text-sm font-medium text-emerald-800 hover:border-emerald-500 dark:border-emerald-800 dark:bg-gray-900 dark:text-emerald-200"
                                        >
                                            Surah {recent.surahNumber}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                )}
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
                    
                    {/* Mushaf View Tab - Only show if feature is enabled */}
                    <FeatureGate feature="enableMushafView">
                        <button
                            onClick={() => setActiveTab("mushaf")}
                            className={`pb-2 px-1 text-sm font-medium transition-colors border-b-2 ${activeTab === "mushaf"
                                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400"
                                }`}
                        >
                            Mushaf View
                        </button>
                    </FeatureGate>
                </div>

                {activeTab === "list" ? (
                    <FileSurahList />
                ) : (
                    <FeatureGate 
                        feature="enableMushafView"
                        fallback={
                            <div className="text-center py-12">
                                <p className="text-gray-500 dark:text-gray-400">
                                    Mushaf view is currently disabled.
                                </p>
                            </div>
                        }
                    >
                        <div className="py-4">
                            <div className="text-center mb-4 text-sm text-gray-500">
                                Page Read Mode
                            </div>
                            <PageView initialPage={1} />
                        </div>
                    </FeatureGate>
                )}
            </div>
        </>
    );
}

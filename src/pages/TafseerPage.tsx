import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SEO from "../components/SEO";
import {
  fetchTafseerForAyah,
  getTafseerSources,
  formatTafseerText,
  type TafseerResponse,
  type TafseerSource,
  getDefaultTafseerSource
} from "../services/quranTafseerService";
import { fetchSurahList, type Surah } from "../services/quranService";
import { FaChevronLeft, FaChevronRight, FaBookOpen } from "react-icons/fa";

export default function TafseerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [tafseerSources] = useState<TafseerSource[]>(getTafseerSources());
  const [tafseerData, setTafseerData] = useState<TafseerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  // Default source is now using the new identifiers
  const [selectedSurah, setSelectedSurah] = useState(searchParams.get("surah") || "1");
  const [selectedAyah, setSelectedAyah] = useState(searchParams.get("ayah") || "1");
  const [selectedSource, setSelectedSource] = useState(searchParams.get("source") || getDefaultTafseerSource());

  // Load Surahs list
  useEffect(() => {
    fetchSurahList()
      .then(data => setSurahs(data))
      .catch(err => console.error("Error loading surahs:", err));
  }, []);

  // Load tafseer when parameters change
  useEffect(() => {
    if (selectedSurah && selectedAyah && selectedSource) {
      loadTafseer();
    }
  }, [selectedSurah, selectedAyah, selectedSource]);

  const loadTafseer = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchTafseerForAyah(
        parseInt(selectedSurah),
        parseInt(selectedAyah),
        selectedSource
      );

      if (result) {
        setTafseerData(result);
        setSearchParams({
          surah: selectedSurah,
          ayah: selectedAyah,
          source: selectedSource
        });
      } else {
        setError("Tafseer not available for this combination.");
        setTafseerData(null);
      }
    } catch (err) {
      setError("Failed to load tafseer data.");
      setTafseerData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleNextAyah = () => {
    const currentSurah = surahs.find(s => s.number === parseInt(selectedSurah));
    if (!currentSurah) return;

    if (parseInt(selectedAyah) < (currentSurah.numberOfAyahs || 0)) {
      setSelectedAyah((parseInt(selectedAyah) + 1).toString());
    } else if (parseInt(selectedSurah) < 114) {
      setSelectedSurah((parseInt(selectedSurah) + 1).toString());
      setSelectedAyah("1");
    }
  };

  const handlePrevAyah = () => {
    if (parseInt(selectedAyah) > 1) {
      setSelectedAyah((parseInt(selectedAyah) - 1).toString());
    } else if (parseInt(selectedSurah) > 1) {
      const prevSurah = surahs.find(s => s.number === parseInt(selectedSurah) - 1);
      if (prevSurah) {
        setSelectedSurah((parseInt(selectedSurah) - 1).toString());
        setSelectedAyah((prevSurah.numberOfAyahs || 1).toString());
      }
    }
  };

  const selectedSurahData = surahs.find(s => s.number === parseInt(selectedSurah));

  return (
    <>
      <SEO
        title="Tafseer - Quranic Commentary"
        description="Read authentic Tafseer (commentary) of the Quran from renowned scholars"
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4 text-emerald-600 dark:text-emerald-400">
            <FaBookOpen size={48} />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Quranic Tafseer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Understand the deeper meanings of the Noble Quran.
          </p>
        </div>

        {/* Selection Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Surah</label>
              <select
                value={selectedSurah}
                onChange={(e) => {
                  setSelectedSurah(e.target.value);
                  setSelectedAyah("1");
                }}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              >
                {surahs.map(s => (
                  <option key={s.number} value={s.number}>{s.number}. {s.englishName}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Ayah</label>
              <select
                value={selectedAyah}
                onChange={(e) => setSelectedAyah(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              >
                {Array.from({ length: selectedSurahData?.numberOfAyahs || 286 }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Tafseer Source</label>
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              >
                {tafseerSources.map(s => (
                  <option key={s.identifier} value={s.identifier}>{s.name} ({s.language.toUpperCase()})</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handlePrevAyah}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <FaChevronLeft /> <span className="hidden sm:inline">Previous Ayah</span>
          </button>

          <div className="text-center">
            <span className="font-bold text-lg text-emerald-600 dark:text-emerald-400">
              {selectedSurahData?.englishName} {selectedSurah}:{selectedAyah}
            </span>
          </div>

          <button
            onClick={handleNextAyah}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
          >
            <span className="hidden sm:inline">Next Ayah</span> <FaChevronRight />
          </button>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="py-20 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            <p className="mt-4 text-gray-500">Retrieving commentary...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-6 rounded-2xl border border-red-100 dark:border-red-900/30 text-center">
            {error}
          </div>
        ) : tafseerData && (
          <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-700/50 px-8 py-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="font-bold text-gray-900 dark:text-gray-100">{tafseerData.source.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Author: {tafseerData.source.author}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-semibold text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
                  {tafseerData.source.language.toUpperCase()}
                </div>
              </div>
            </div>

            <div className="p-8">
              <div
                className={`prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 leading-[1.8] text-lg lg:text-xl ${tafseerData.source.language === 'ar' ? 'font-arabic text-right' : 'text-left'
                  }`}
                dir={tafseerData.source.language === 'ar' ? 'rtl' : 'ltr'}
              >
                {formatTafseerText(tafseerData.ayah.text).split('\n\n').map((para, i) => (
                  <p key={i} className="mb-6 last:mb-0">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </article>
        )}

        {/* Related Info */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Commentary provided for educational purposes.</p>
        </div>
      </div>
    </>
  );
}
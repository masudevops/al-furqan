import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SEO from "../components/SEO";
import { 
  fetchTafseerForAyah, 
  getTafseerSources, 
  formatTafseerText,
  type TafseerResponse, 
  type TafseerSource
} from "../services/quranTafseerService";
import { fetchSurahList, type Surah } from "../services/quranService";

export default function TafseerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [tafseerSources] = useState<TafseerSource[]>(getTafseerSources());
  const [tafseerData, setTafseerData] = useState<TafseerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [selectedSurah, setSelectedSurah] = useState(searchParams.get("surah") || "1");
  const [selectedAyah, setSelectedAyah] = useState(searchParams.get("ayah") || "1");
  const [selectedSource, setSelectedSource] = useState(searchParams.get("source") || "en.ibnkathir");

  // Load Surahs list
  useEffect(() => {
    let cancelled = false;
    
    fetchSurahList()
      .then(data => {
        if (!cancelled) setSurahs(data);
      })
      .catch(err => {
        if (!cancelled) console.error("Error loading surahs:", err);
      });
    
    return () => { cancelled = true; };
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
      console.log(`Loading tafseer for ${selectedSurah}:${selectedAyah} with source ${selectedSource}`);
      
      const result = await fetchTafseerForAyah(
        parseInt(selectedSurah), 
        parseInt(selectedAyah), 
        selectedSource
      );
      
      console.log('Tafseer result:', result);
      
      if (result) {
        setTafseerData(result);
        // Update URL parameters
        setSearchParams({
          surah: selectedSurah,
          ayah: selectedAyah,
          source: selectedSource
        });
      } else {
        setError("Tafseer not available for this ayah and source combination.");
        setTafseerData(null);
      }
    } catch (err) {
      console.error('Tafseer error:', err);
      setError(err instanceof Error ? err.message : "Failed to load tafseer");
      setTafseerData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadTafseer();
  };

  const selectedSurahData = surahs.find(s => s.number === parseInt(selectedSurah));

  return (
    <>
      <SEO 
        title="Tafseer - Quranic Commentary" 
        description="Read authentic Tafseer (commentary) of the Quran from renowned scholars like Ibn Kathir"
      />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Tafseer
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Explore the meanings and explanations of Quranic verses through authentic commentary from renowned Islamic scholars.
          </p>
        </div>

        {/* Tafseer Selection Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Surah Selection */}
              <div>
                <label htmlFor="surah" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Surah
                </label>
                <select
                  id="surah"
                  value={selectedSurah}
                  onChange={(e) => setSelectedSurah(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {surahs.map(surah => (
                    <option key={surah.number} value={surah.number}>
                      {surah.number}. {surah.englishName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ayah Selection */}
              <div>
                <label htmlFor="ayah" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ayah
                </label>
                <input
                  type="number"
                  id="ayah"
                  min="1"
                  max="286"
                  value={selectedAyah}
                  onChange={(e) => setSelectedAyah(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              {/* Tafseer Source Selection */}
              <div>
                <label htmlFor="source" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tafseer Source
                </label>
                <select
                  id="source"
                  value={selectedSource}
                  onChange={(e) => setSelectedSource(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  {tafseerSources.map(source => (
                    <option key={source.identifier} value={source.identifier}>
                      {source.englishName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Loading..." : "Get Tafseer"}
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading tafseer...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-8">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Tafseer Content */}
        {tafseerData && !loading && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            {/* Ayah Reference */}
            <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {selectedSurahData?.englishName} ({selectedSurahData?.number}:{selectedAyah})
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {selectedSurahData?.englishNameTranslation}
              </p>
            </div>

            {/* Tafseer Source Info */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {tafseerData.source.englishName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                by {tafseerData.source.author}
              </p>
              {tafseerData.source.description && (
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {tafseerData.source.description}
                </p>
              )}
            </div>

            {/* Tafseer Text */}
            <div className="mb-6">
              <div 
                className={`leading-relaxed text-gray-900 dark:text-gray-100 ${
                  tafseerData.source.language === 'ar' 
                    ? 'text-right font-arabic text-xl' 
                    : tafseerData.source.language === 'bn'
                    ? 'text-left text-lg'
                    : 'text-left text-base'
                }`}
                dir={tafseerData.source.language === 'ar' ? 'rtl' : 'ltr'}
                style={{ minHeight: '100px', padding: '16px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}
              >
                {formatTafseerText(tafseerData.ayah.text)}
              </div>
            </div>

            {/* Language Badge */}
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400">
                {tafseerData.source.language === 'ar' ? 'Arabic' : 
                 tafseerData.source.language === 'bn' ? 'Bengali' : 
                 tafseerData.source.language === 'ur' ? 'Urdu' : 'English'}
              </span>
            </div>
          </div>
        )}

        {/* Available Sources Info */}
        <div className="mt-8 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Available Tafseer Sources
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tafseerSources.map(source => (
              <div key={source.identifier} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  {source.englishName}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  by {source.author}
                </p>
                {source.description && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {source.description}
                  </p>
                )}
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300 mt-2">
                  {source.language === 'ar' ? 'Arabic' : 'English'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
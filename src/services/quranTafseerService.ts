// Al-Furqan - Quran Tafseer Service (API-based)
// Provides comprehensive Tafseer from spa5k/tafsir_api via jsDeliver

const TAFSEER_API_BASE = "https://cdn.jsdelivr.net/gh/spa5k/tafsir_api@main/tafsir";

// Tafseer Data Types
export interface TafseerSource {
  identifier: string; // The slug in the new API
  name: string;
  language: string;
  author: string;
  englishName: string;
  description?: string;
}

export interface TafseerAyah {
  surah: number;
  ayah: number;
  text: string;
  source: string;
  language: string;
}

export interface TafseerResponse {
  ayah: TafseerAyah;
  source: TafseerSource;
  success: boolean;
}

// Available Tafseer Sources from spa5k/tafsir_api
export const AVAILABLE_TAFSEER_SOURCES: TafseerSource[] = [
  {
    identifier: "en-tafisr-ibn-kathir",
    name: "Ibn Kathir (English)",
    language: "en",
    author: "Hafiz Ibn Kathir",
    englishName: "Tafsir Ibn Kathir",
    description: "Classical Sunni tafsir - Abridged version"
  },
  {
    identifier: "ar-tafsir-ibn-kathir",
    name: "تفسير ابن كثير",
    language: "ar",
    author: "الحافظ ابن كثير",
    englishName: "Tafsir Ibn Kathir (Arabic)",
    description: "Original Arabic tafsir by Ibn Kathir"
  },
  {
    identifier: "bn-tafseer-ibn-e-kaseer",
    name: "তাফসীর ইবনে কাসীর",
    language: "bn",
    author: "হাফিজ ইবনে কাসীর",
    englishName: "Tafseer ibn Kathir (Bengali)",
    description: "Classical Sunni tafsir in Bengali"
  },
  {
    identifier: "en-tafsir-maarif-ul-quran",
    name: "Ma'arif al-Qur'an",
    language: "en",
    author: "Mufti Muhammad Shafi",
    englishName: "Ma'arif al-Qur'an (English)",
    description: "Comprehensive English tafsir by Mufti Muhammad Shafi"
  },
  {
    identifier: "ur-tafseer-ibn-e-kaseer",
    name: "تفسیر ابن کثیر",
    language: "ur",
    author: "حافظ ابن کثیر",
    englishName: "Tafsir Ibn Kathir (Urdu)",
    description: "Ibn Kathir tafsir in Urdu"
  },
  {
    identifier: "en-al-jalalayn",
    name: "Tafsir al-Jalalayn",
    language: "en",
    author: "Al-Mahalli & Al-Suyuti",
    englishName: "Tafsir al-Jalalayn",
    description: "Classical succinct Sunni tafsir"
  }
];

// Get available tafseer sources
export function getTafseerSources(): TafseerSource[] {
  return AVAILABLE_TAFSEER_SOURCES;
}

// Get tafseer source by identifier
export function getTafseerSource(identifier: string): TafseerSource | null {
  // Handle legacy identifiers for backward compatibility during transition if needed
  const legacyMap: Record<string, string> = {
    "en.ibnkathir": "en-tafisr-ibn-kathir",
    "bn.ibnkathir": "bn-tafseer-ibn-e-kaseer",
    "ar.ibnkathir": "ar-tafsir-ibn-kathir",
    "ur.ibnkathir": "ur-tafseer-ibn-e-kaseer",
    "en.maarif": "en-tafsir-maarif-ul-quran"
  };

  const actualIdentifier = legacyMap[identifier] || identifier;
  return AVAILABLE_TAFSEER_SOURCES.find(source => source.identifier === actualIdentifier) || null;
}

// Fetch tafseer for a specific ayah from the new API
export async function fetchTafseerForAyah(
  surahNumber: number,
  ayahNumber: number,
  sourceIdentifier: string = "en-tafisr-ibn-kathir"
): Promise<TafseerResponse | null> {
  try {
    const source = getTafseerSource(sourceIdentifier);
    if (!source) {
      throw new Error(`Unknown tafseer source: ${sourceIdentifier}`);
    }

    const identifier = source.identifier;
    const url = `${TAFSEER_API_BASE}/${identifier}/${surahNumber}/${ayahNumber}.json`;

    console.log(`Fetching tafseer from new API: ${url}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch tafseer`);
    }

    const data = await response.json();

    if (!data.text) {
      throw new Error("Invalid API response - no text found");
    }

    const tafseerAyah: TafseerAyah = {
      surah: surahNumber,
      ayah: ayahNumber,
      text: data.text,
      source: identifier,
      language: source.language
    };

    return {
      ayah: tafseerAyah,
      source: source,
      success: true
    };

  } catch (error) {
    console.error("Error fetching tafseer:", error);
    return null;
  }
}

// Fetch multiple tafseer sources (for comparison)
export async function fetchMultipleTafseerForAyah(
  surahNumber: number,
  ayahNumber: number,
  sourceIdentifiers: string[] = ["en-tafisr-ibn-kathir", "bn-tafseer-ibn-e-kaseer"]
): Promise<TafseerResponse[]> {
  try {
    const promises = sourceIdentifiers.map(sourceId =>
      fetchTafseerForAyah(surahNumber, ayahNumber, sourceId)
    );

    const results = await Promise.allSettled(promises);

    return results
      .filter((result): result is PromiseFulfilledResult<TafseerResponse> =>
        result.status === 'fulfilled' && result.value !== null
      )
      .map(result => result.value);

  } catch (error) {
    console.error("Error fetching multiple tafseer:", error);
    return [];
  }
}

// Get tafseer sources by language
export function getTafseerSourcesByLanguage(language: string): TafseerSource[] {
  return AVAILABLE_TAFSEER_SOURCES.filter(source => source.language === language);
}

// Check if tafseer is available
export async function checkTafseerAvailability(
  surahNumber: number,
  ayahNumber: number,
  sourceIdentifier: string
): Promise<boolean> {
  try {
    const result = await fetchTafseerForAyah(surahNumber, ayahNumber, sourceIdentifier);
    return result !== null && result.success && result.ayah.text.trim().length > 0;
  } catch (error) {
    return false;
  }
}

// Utility: Format tafseer text for display - Improved for readability
export function formatTafseerText(text: string): string {
  if (!text) return "";

  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n') // Max two newlines
    .trim();
}

// Utility: Default source
export function getDefaultTafseerSource(languagePreference: string = "en"): string {
  const sources = getTafseerSourcesByLanguage(languagePreference);
  return sources.length > 0 ? sources[0].identifier : "en-tafisr-ibn-kathir";
}
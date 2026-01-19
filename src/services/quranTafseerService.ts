// Al-Furqan - Quran Tafseer Service (API-based)
// Provides comprehensive Tafseer from Quran.com API

const QURAN_API_BASE = "https://api.quran.com/api/v4";

// Tafseer Data Types
export interface TafseerSource {
  identifier: string;
  name: string;
  language: string;
  author: string;
  englishName: string;
  description?: string;
  apiId: number; // Quran.com API ID
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

// Available Tafseer Sources from Quran.com API
export const AVAILABLE_TAFSEER_SOURCES: TafseerSource[] = [
  {
    identifier: "en.ibnkathir",
    name: "Ibn Kathir (Abridged)",
    language: "en",
    author: "Hafiz Ibn Kathir",
    englishName: "Ibn Kathir (English)",
    description: "Classical Sunni tafsir by the renowned 14th-century scholar - Complete version",
    apiId: 169
  },
  {
    identifier: "bn.ibnkathir",
    name: "তাফসীর ইবনে কাসীর",
    language: "bn",
    author: "হাফিজ ইবনে কাসীর",
    englishName: "Tafseer ibn Kathir (Bengali)",
    description: "Classical Sunni tafsir by the renowned 14th-century scholar in Bengali",
    apiId: 164
  },
  {
    identifier: "ar.ibnkathir",
    name: "تفسير ابن كثير",
    language: "ar",
    author: "الحافظ ابن كثير",
    englishName: "Tafsir Ibn Kathir (Arabic)",
    description: "Original Arabic tafsir by Ibn Kathir",
    apiId: 14
  },

  {
    identifier: "bn.ahsanulbayaan",
    name: "তাফসীর আহসানুল বায়ান",
    language: "bn",
    author: "বায়ান ফাউন্ডেশন",
    englishName: "Tafsir Ahsanul Bayaan (Bengali)",
    description: "Modern Bengali tafsir by Bayaan Foundation",
    apiId: 165
  },
  {
    identifier: "en.maarif",
    name: "Ma'arif al-Qur'an",
    language: "en",
    author: "Mufti Muhammad Shafi",
    englishName: "Ma'arif al-Qur'an (English)",
    description: "Comprehensive English tafsir by Mufti Muhammad Shafi",
    apiId: 168
  },
  {
    identifier: "ur.ibnkathir",
    name: "تفسیر ابن کثیر",
    language: "ur",
    author: "حافظ ابن کثیر",
    englishName: "Tafsir Ibn Kathir (Urdu)",
    description: "Ibn Kathir tafsir in Urdu",
    apiId: 160
  }
];

// Get available tafseer sources
export function getTafseerSources(): TafseerSource[] {
  return AVAILABLE_TAFSEER_SOURCES;
}

// Get tafseer source by identifier
export function getTafseerSource(identifier: string): TafseerSource | null {
  return AVAILABLE_TAFSEER_SOURCES.find(source => source.identifier === identifier) || null;
}

// Fetch tafseer for a specific ayah from Quran.com API
export async function fetchTafseerForAyah(
  surahNumber: number, 
  ayahNumber: number, 
  sourceIdentifier: string = "en.ibnkathir"
): Promise<TafseerResponse | null> {
  try {
    const source = getTafseerSource(sourceIdentifier);
    if (!source) {
      throw new Error(`Unknown tafseer source: ${sourceIdentifier}`);
    }

    console.log(`Fetching tafseer from API: ${surahNumber}:${ayahNumber} with source ${sourceIdentifier} (API ID: ${source.apiId})`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout for comprehensive tafseer
    
    const url = `${QURAN_API_BASE}/tafsirs/${source.apiId}/by_ayah/${surahNumber}:${ayahNumber}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: Failed to fetch tafseer from API`);
    }
    
    const data = await response.json();
    
    if (!data.tafsir || !data.tafsir.text) {
      throw new Error("Invalid API response - no tafseer text found");
    }
    
    const tafseerAyah: TafseerAyah = {
      surah: surahNumber,
      ayah: ayahNumber,
      text: data.tafsir.text,
      source: sourceIdentifier,
      language: source.language
    };
    
    console.log(`Successfully fetched tafseer: ${data.tafsir.text.length} characters`);
    
    return {
      ayah: tafseerAyah,
      source: source,
      success: true
    };
    
  } catch (error) {
    console.error("Error fetching tafseer from API:", error);
    return null;
  }
}

// Fetch multiple tafseer sources for the same ayah (for comparison)
export async function fetchMultipleTafseerForAyah(
  surahNumber: number,
  ayahNumber: number,
  sourceIdentifiers: string[] = ["en.ibnkathir", "bn.ibnkathir"]
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

// Check if tafseer is available for a specific source
export async function checkTafseerAvailability(
  surahNumber: number,
  ayahNumber: number,
  sourceIdentifier: string
): Promise<boolean> {
  try {
    const result = await fetchTafseerForAyah(surahNumber, ayahNumber, sourceIdentifier);
    return result !== null && result.success && result.ayah.text.trim().length > 0;
  } catch (error) {
    console.error("Error checking tafseer availability:", error);
    return false;
  }
}

// Utility: Format tafseer text for display (remove HTML tags, clean up)
export function formatTafseerText(text: string): string {
  return text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&amp;/g, '&') // Replace HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n\s*\n/g, '\n\n') // Clean up multiple newlines
    .trim();
}

// Utility: Get default tafseer source based on language preference
export function getDefaultTafseerSource(languagePreference: string = "en"): string {
  const sources = getTafseerSourcesByLanguage(languagePreference);
  if (sources.length > 0) {
    return sources[0].identifier;
  }
  return "en.ibnkathir"; // Fallback to Ibn Kathir English
}
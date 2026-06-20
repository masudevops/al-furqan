// src/services/tafsirService.ts

const API_BASE = "https://api.alquran.cloud/v1";

export interface TafsirEdition {
    identifier: string;
    name: string;
    language: string;
    author: string;
    englishName: string;
}

export interface TafsirAyah {
    surah: number;
    ayah: number;
    text: string;
}

// Pre-defined list of reliable Tafsir editions available on API
// We focus on Ibn Kathir as requested, plus some others for "scalability"
export const AVAILABLE_TAFSIRS: TafsirEdition[] = [
    {
        identifier: "en.ibnkathir",
        name: "Tafsir Ibn Kathir",
        language: "en",
        author: "Hafiz Ibn Kathir",
        englishName: "Tafsir Ibn Kathir (English)",
    },
    {
        identifier: "ar.muyassar",
        name: "Tafseer Al-Muyassar",
        language: "ar",
        author: "King Fahad Quran Complex",
        englishName: "Tafseer Al-Muyassar",
    },
    // Note: API support for Urdu/Hindi Ibn Kathir specifically might be limited on alquran.cloud.
    // We will check availability or add placeholders/warnings if they aren't fully supported via this specific API key.
    // For now, we include a generic Urdu tafsir if available, or fall back to explaining limitation in UI.
];

export async function fetchTafsir(
    surahNumber: number,
    ayahNumber: number,
    edition: string = "en.ibnkathir"
): Promise<TafsirAyah | null> {
    try {
        // API endpoint: /ayah/{surah}:{ayah}/{edition}
        const res = await fetch(
            `${API_BASE}/ayah/${surahNumber}:${ayahNumber}/${edition}`
        );
        if (!res.ok) {
            // If specific edition fails, return null
            return null;
        }
        const json = await res.json();
        const data = json.data;

        return {
            surah: data.surah.number,
            ayah: data.numberInSurah,
            text: data.text,
        };
    } catch (error) {
        console.error("Failed to fetch tafsir:", error);
        return null;
    }
}

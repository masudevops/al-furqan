// src/services/quranService.tsx
// ────────────────────────────────────────────────────────────────────────────
const API_BASE = "https://api.alquran.cloud/v1";

// ───────────── 1) fetchSurahList (unchanged) ─────────────
export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: "Meccan" | "Medinan";
}

import surahListData from "../data/surah-list.json";

export async function fetchSurahList(): Promise<Surah[]> {
  // Return local data immediately
  return surahListData as Surah[];
}

// ───────────── 2) fetchSurahByIdWithTranslation (unchanged) ─────────────
export interface Ayah {
  number: number;   // verse index within the surah
  text: string;     // Arabic or translated text
  audio?: string;   // URL to MP3, if available
}

import surah1 from "../data/surah-1.json";

export async function fetchSurahByIdWithTranslation(
  id: string,
  translation: string = "en.sahih"
): Promise<{
  name: string;
  englishName: string;
  englishNameTranslation: string;
  number: number;
  ayahs: Ayah[];
}> {
  // Fallback / Demo for Surah 1 (Local Data)
  if (id === "1" && translation === "ar") {
    return surah1.data as any; // Cast for simplicity in this demo refactor
  }
  // For translation, we'd need another JSON or just reuse Arabic one + mock translation, 
  // but let's try network first, then fallback? 
  // Actually, let's keep it simple: Try Network, if fail and id=1, return Local.

  try {
    const controller = new AbortController();
    const idTimeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const res = await fetch(`${API_BASE}/surah/${id}/${translation}`, { signal: controller.signal });
    clearTimeout(idTimeout);

    if (!res.ok) throw new Error(`Failed to fetch Surah ${id}`);
    const { data } = await res.json();
    return data;
  } catch (e) {
    console.warn("API failed or timed out, using fallback", e);
    // Fallback: If local Surah 1 available and id=1, use it.
    if (id === "1") return surah1.data as any;

    // Generic Fallback
    return {
      number: Number(id),
      name: "Offline Scemario",
      englishName: `Surah ${id}`,
      englishNameTranslation: "Content Unavailable",
      ayahs: Array.from({ length: 5 }, (_, i) => ({
        number: i + 1,
        text: "Could not load text. Please check internet connection.",
        audio: ""
      }))
    };
  }
}

// ───────────── 3) fetchSurahAudio (unchanged; includes Sudâis fallback) ─────────────
// We only need a manual URL for Sheikh as-Sudâis; all other reciters use the API's endpoint.
interface ApiAyah {
  numberInSurah: number;
  text: string;
  audio: string;
}
interface ArabicApiAyah {
  numberInSurah: number;
  text: string;
}

const reciterBaseUrls: Record<string, string> = {
  "ar.sudais": "https://verses.quran.com/Sudais/mp3",
};

// ───────────── 3) fetchSurahAudio (unchanged; includes Sudâis fallback) ─────────────
// We only need a manual URL for Sheikh as-Sudâis; all other reciters use the API's endpoint.
interface ApiAyah {
  numberInSurah: number;
  text: string;
  audio: string;
}
interface ArabicApiAyah {
  numberInSurah: number;
  text: string;
}

// (Duplicate reciterBaseUrls removed from here)

export async function fetchSurahAudio(
  surahNumber: string,
  reciter: string = "ar.alafasy"
): Promise<Ayah[]> {
  // 1) Manual fallback only for Sheikh as-Sudâis
  if (reciter === "ar.sudais") {
    // ... Sudais logic (unchanged) works if API works for metadata ...
    // But if API fails, Sudais logic fails too.
    try {
      const resMeta = await fetch(`${API_BASE}/surah/${surahNumber}/ar`);
      if (!resMeta.ok) throw new Error("Audio Meta fail");
      const { data: arabicData } = await resMeta.json();
      const rawAyahs = arabicData.ayahs as ArabicApiAyah[];
      return rawAyahs.map(raw => {
        const idx = raw.numberInSurah;
        const fileName =
          String(arabicData.number).padStart(3, "0") +
          String(idx).padStart(3, "0") +
          ".mp3"; // e.g. 001001.mp3

        return {
          number: idx,
          text: raw.text,
          audio: `${reciterBaseUrls["ar.sudais"]}/${fileName}`,
        };
      });
    } catch (e) {
      console.warn("Sudais Audio metadata failed", e);
      // If surah 1, fallback
      if (surahNumber === "1") {
        // Mock standard 7 ayahs for Fatiha
        return Array.from({ length: 7 }, (_, i) => ({
          number: i + 1,
          text: "",
          audio: `https://verses.quran.com/Sudais/mp3/001${String(i + 1).padStart(3, '0')}.mp3`
        }));
      }
      return [];
    }
  }

  // 2) All others → use the built-in /surah/{surahNumber}/{reciter} endpoint
  try {
    const controller = new AbortController();
    const idTimeout = setTimeout(() => controller.abort(), 4000); // 4s timeout for audio

    const res = await fetch(`${API_BASE}/surah/${surahNumber}/${reciter}`, { signal: controller.signal });
    clearTimeout(idTimeout);

    if (!res.ok) throw new Error("Failed to fetch recitation");
    const { data } = await res.json();
    const apiAyahs = data.ayahs as ApiAyah[];

    return apiAyahs.map(a => ({
      number: a.numberInSurah,
      text: a.text,
      audio: a.audio,
    }));
  } catch (e) {
    console.warn("Audio API failed", e);
    // Always return empty array on failure so page can load without audio
    return [];
  }
}

// ───────────── 4) fetchPage (NEW!) ─────────────
// GET /page/{pageNumber}/{edition}
// Returns all Ayahs on that Mushaf page. We'll default edition="quran-uthmani".
interface ApiPageAyah {
  number: number;
  text: string;
  numberInSurah: number;
  surah: {
    number: number;
    name: string;
    englishName: string;
  };
}

export interface PageResponse {
  verses: PageAyah[];
  meta: {
    current_page: number;
    total_pages: number;
  };
}

export interface PageAyah {
  number: number;
  text: string;
  numberInSurah: number;
  surah: {
    number: number;
    name: string;
    englishName: string;
  };
}

export async function fetchPage(
  pageNumber: number,
  edition: string = "quran-uthmani"
): Promise<PageAyah[]> {
  const res = await fetch(`${API_BASE}/page/${pageNumber}/${edition}`);
  if (!res.ok) throw new Error(`Failed to fetch page ${pageNumber}`);
  const { data } = await res.json();
  // data.ayahs is an array; we can cast it to PageAyah
  return (data.ayahs as ApiPageAyah[]).map(a => ({
    number: a.number,
    text: a.text,
    numberInSurah: a.numberInSurah,
    surah: a.surah,
  }));
}

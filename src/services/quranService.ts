import surahListData from "../data/surah-list.json";
import surah1 from "../data/surah-1.json";
import type {
  QuranEditionSurah,
  ReaderSurah,
  SurahMetadata,
} from "../core/quran/contracts";
import { parseQuranEditionSurah } from "../core/quran/contracts";
import { parseSurahMetadataList } from "../core/quran/metadata";
import { isValidSurahNumber, mergeReaderSurah } from "../core/quran/reader";
import {
  encodeSearchPathSegment,
  normalizeSearchText,
  type QuranSearchRequest,
} from "../core/quran/search";
import { isNumber, isRecord, isString } from "../core/contracts/validation";

const API_BASE = "https://api.alquran.cloud/v1";

export type Surah = SurahMetadata;

export async function fetchSurahList(): Promise<Surah[]> {
  const metadata = parseSurahMetadataList(surahListData);
  if (!metadata) {
    throw new Error("Local Quran metadata is invalid");
  }
  return metadata;
}

export interface Ayah {
  number: number;
  text: string;
  audio?: string;
}

async function fetchQuranEditionSurah(
  surahNumber: number,
  edition: string,
): Promise<QuranEditionSurah> {
  if (!isValidSurahNumber(surahNumber)) {
    throw new Error("Invalid Surah number");
  }

  if (surahNumber === 1 && edition === "ar") {
    const localSurah = parseQuranEditionSurah(surah1.data);
    if (!localSurah) throw new Error("Local Quran fallback is invalid");
    return localSurah;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(
      `${API_BASE}/surah/${surahNumber}/${edition}`,
      { signal: controller.signal },
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch Surah ${surahNumber}`);
    }
    const payload = (await response.json()) as { data?: unknown };
    const parsed = parseQuranEditionSurah(payload.data);
    if (!parsed) throw new Error("Invalid Quran provider response");
    return parsed;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchReaderSurah(
  surahNumber: number,
  translationEdition = "en.sahih",
): Promise<ReaderSurah> {
  const metadata = (await fetchSurahList()).find(
    (surah) => surah.number === surahNumber,
  );
  if (!metadata) throw new Error("Surah not found");

  const [arabicResult, translationResult] = await Promise.allSettled([
    fetchQuranEditionSurah(surahNumber, "ar"),
    fetchQuranEditionSurah(surahNumber, translationEdition),
  ]);

  if (arabicResult.status === "rejected") {
    throw arabicResult.reason;
  }

  const translation =
    translationResult.status === "fulfilled" ? translationResult.value : null;

  return mergeReaderSurah(
    metadata,
    arabicResult.value,
    translation,
    translationEdition,
  );
}

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

export interface SearchMatch {
  number: number;
  text: string;
  edition: {
    identifier: string;
    name: string;
  };
  surah: {
    number: number;
    name: string;
    englishName: string;
  };
  numberInSurah: number;
  juzNumber?: number;
}

export interface SearchResponse {
  count: number;
  matches: SearchMatch[];
}

interface SearchEditionSummary {
  identifier: string;
  name: string;
}

function parseSearchEdition(value: unknown): SearchEditionSummary | null {
  return isRecord(value) &&
    isString(value.identifier) &&
    isString(value.name)
    ? { identifier: value.identifier, name: value.name }
    : null;
}

function parseSearchMatch(
  value: unknown,
  fallbackEdition?: SearchEditionSummary,
): SearchMatch | null {
  const edition = isRecord(value) ? parseSearchEdition(value.edition) : null;
  if (
    !isRecord(value) ||
    !isNumber(value.number) ||
    !isString(value.text) ||
    !isNumber(value.numberInSurah) ||
    !isRecord(value.surah) ||
    !isNumber(value.surah.number) ||
    !isString(value.surah.name) ||
    !isString(value.surah.englishName) ||
    (!edition && !fallbackEdition)
  ) {
    return null;
  }

  const resolvedEdition = edition ?? fallbackEdition!;
  return {
    number: value.number,
    text: value.text,
    edition: {
      identifier: resolvedEdition.identifier,
      name: resolvedEdition.name,
    },
    surah: {
      number: value.surah.number,
      name: value.surah.name,
      englishName: value.surah.englishName,
    },
    numberInSurah: value.numberInSurah,
    juzNumber: isNumber(value.juz) ? value.juz : undefined,
  };
}

function parseSearchMatches(
  value: unknown,
  fallbackEdition?: SearchEditionSummary,
): SearchMatch[] {
  if (!Array.isArray(value)) throw new Error("Invalid search response");
  const matches = value.map((match) =>
    parseSearchMatch(match, fallbackEdition),
  );
  if (matches.some((match) => match === null)) {
    throw new Error("Invalid search response");
  }
  return matches as SearchMatch[];
}

export async function searchAyahs(
  request: QuranSearchRequest,
  signal?: AbortSignal,
): Promise<SearchMatch[]> {
  const query = normalizeSearchText(request.query);
  if (!query) return [];

  if (request.juzNumber) {
    const response = await fetch(
      `${API_BASE}/juz/${request.juzNumber}/${encodeSearchPathSegment(request.edition)}`,
      { signal },
    );
    if (!response.ok) throw new Error("Search failed");
    const json: unknown = await response.json();
    if (!isRecord(json) || !isRecord(json.data)) {
      throw new Error("Invalid search response");
    }
    const edition = parseSearchEdition(json.data.edition);
    if (!edition) throw new Error("Invalid search response");
    return parseSearchMatches(json.data.ayahs, edition).filter(
      (match) =>
        (!request.surahNumber ||
          match.surah.number === request.surahNumber) &&
        normalizeSearchText(match.text).includes(query),
    );
  }

  const scope = request.surahNumber ?? "all";
  const response = await fetch(
    `${API_BASE}/search/${encodeSearchPathSegment(query)}/${scope}/${encodeSearchPathSegment(request.edition)}`,
    { signal },
  );
  if (!response.ok) throw new Error("Search failed");

  const json: unknown = await response.json();
  if (!isRecord(json) || !isRecord(json.data)) {
    throw new Error("Invalid search response");
  }
  return parseSearchMatches(json.data.matches);
}

export interface Edition {
  identifier: string;
  language: string;
  name: string;
  englishName: string;
  format: string;
  type: string;
}

export async function fetchEditions(
  format?: "audio" | "text",
  type?: "translation" | "quran" | "tafsir" | "versebyverse"
): Promise<Edition[]> {
  const params = new URLSearchParams();
  if (format) params.append("format", format);
  if (type) params.append("type", type);

  const res = await fetch(`${API_BASE}/edition?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch editions");
  const json = await res.json();
  return json.data as Edition[];
}

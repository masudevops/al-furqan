import "server-only";

const DEFAULT_BASE_URL = "https://api.sunnah.now";

type Json = Record<string, unknown>;

export interface HadithCollection {
  id: string;
  name: string;
  sections: Array<{ id: string; name: string }>;
}

export interface HadithRecord {
  arabic: string;
  authenticityContext: string;
  bookNumber: number;
  collectionId: string;
  collectionName: string;
  grades: Array<{ grade: string; scholar: string }>;
  hadithNumber: number;
  narrator: string;
  referenceNumber: number;
  sectionName: string;
  text: string;
}

export interface HadithSourceAdapter {
  collections(): Promise<HadithCollection[]>;
  list(collection: string, section?: string, query?: string): Promise<HadithRecord[]>;
  one(collection: string, number: number): Promise<HadithRecord | null>;
}

const asObject = (value: unknown): Json => value && typeof value === "object" ? value as Json : {};
const asArray = (value: unknown): Json[] => Array.isArray(value) ? value.map(asObject) : [];
const text = (value: unknown): string => typeof value === "string" ? value.trim() : "";
const number = (value: unknown): number => Number.isFinite(Number(value)) ? Number(value) : 0;
const validSlug = (value: string) => /^[a-z0-9-]+$/.test(value);

const getApiKey = () => {
  const key = process.env.SUNNAH_NOW_API_KEY?.trim();
  if (!key) throw new Error("Sunnah.now API key is not configured.");
  return key;
};

const fetchJson = async (path: string): Promise<unknown> => {
  const baseUrl = process.env.SUNNAH_NOW_API_URL?.trim() || DEFAULT_BASE_URL;
  const response = await fetch(new URL(path, baseUrl), {
    headers: { "X-API-Key": getApiKey() },
    next: { revalidate: 3_600 },
  });
  if (!response.ok) throw new Error(`Sunnah.now request failed: ${response.status}`);
  return response.json();
};

const normalizeRecord = (collection: string, collectionName: string, value: unknown): HadithRecord | null => {
  const item = asObject(value);
  const metadata = asObject(item.metadata);
  const volume = asObject(metadata.volume);
  const chapter = asObject(metadata.chapter);
  const chapterLanguages = asObject(chapter.language);
  const languages = asObject(item.language);
  const english = asObject(languages.en);
  const arabic = asObject(languages.ar);
  const hadithNumber = number(item.id);
  const arabicText = text(arabic.text);
  const englishText = text(english.text);
  if (!hadithNumber || !arabicText || !englishText) return null;
  return {
    arabic: arabicText,
    authenticityContext: collectionName,
    bookNumber: number(volume.id),
    collectionId: collection,
    collectionName,
    grades: [],
    hadithNumber,
    narrator: text(english.narrator),
    referenceNumber: hadithNumber,
    sectionName: text(asObject(chapterLanguages.en).text) || `Chapter ${number(chapter.id)}`,
    text: englishText,
  };
};

const collectionNames = new Map<string, string>();

const getCollectionName = async (slug: string) => {
  const cached = collectionNames.get(slug);
  if (cached) return cached;
  const collections = await sunnahNowHadithAdapter.collections();
  const name = collections.find((item) => item.id === slug)?.name;
  if (!name) throw new Error("Hadith collection is unavailable.");
  return name;
};

export const sunnahNowHadithAdapter: HadithSourceAdapter = {
  async collections() {
    const payload = asArray(await fetchJson("/api/early-access/books"));
    return payload.map((item) => ({
      id: text(item.slug),
      name: text(item.collection),
      sections: [{ id: "all", name: "All available Hadith" }],
    })).filter((item) => validSlug(item.id) && item.name).map((item) => {
      collectionNames.set(item.id, item.name);
      return item;
    });
  },

  async list(collection, section, query) {
    if (!validSlug(collection)) throw new Error("Invalid Hadith collection.");
    const collectionName = await getCollectionName(collection);
    const useChapter = section && section !== "all" && /^\d+$/.test(section);
    const path = useChapter
      ? `/api/early-access/book/${collection}/chapter/${section}?page=1&pageSize=100`
      : `/api/early-access/book/${collection}/hadith?page=1&pageSize=100`;
    const records = asArray(await fetchJson(path))
      .map((item) => normalizeRecord(collection, collectionName, item))
      .filter((item): item is HadithRecord => Boolean(item));
    const needle = query?.trim().toLocaleLowerCase();
    return needle
      ? records.filter((item) => `${item.narrator} ${item.text} ${item.arabic}`.toLocaleLowerCase().includes(needle))
      : records;
  },

  async one(collection, hadithNumber) {
    if (!validSlug(collection) || !Number.isInteger(hadithNumber) || hadithNumber < 1) return null;
    const collectionName = await getCollectionName(collection);
    const payload = await fetchJson(`/api/early-access/book/${collection}/hadith/${hadithNumber}`);
    return normalizeRecord(collection, collectionName, payload);
  },
};

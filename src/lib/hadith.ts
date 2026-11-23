import "server-only";
import { dailyIndex } from "@/lib/daily";
import { hadithBook, type HadithBook } from "@/lib/hadith-books";

const DEFAULT_BASE_URL = "https://ummahapi.com";
type Json = Record<string, unknown>;

export interface HadithCollection { id: string; name: string; reliability?: string; sections: Array<{ id: string; name: string }>; total: number }
export interface HadithRecord { arabic: string; authenticityContext: string; bookNumber: number; collectionId: string; collectionName: string; grades: Array<{ grade: string; scholar: string }>; hadithNumber: number; narrator: string; referenceNumber: number; sectionName: string; text: string }
export interface HadithListPage { items: HadithRecord[]; page: number; pages: number; total: number }
export interface HadithBookPage extends HadithListPage { book: HadithBook }
export interface HadithSourceAdapter { collections(): Promise<HadithCollection[]>; daily(day: string): Promise<HadithRecord | null>; list(collection: string, page?: number, query?: string): Promise<HadithListPage>; one(collection: string, number: number): Promise<HadithRecord | null> }

const object = (value: unknown): Json => value && typeof value === "object" ? value as Json : {};
const array = (value: unknown): Json[] => Array.isArray(value) ? value.map(object) : [];
const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const number = (value: unknown) => Number.isFinite(Number(value)) ? Number(value) : 0;
const validSlug = (value: string) => /^[a-z0-9-]+$/.test(value);
const excludedCollections = new Set(["shahwaliullah", "shah-waliullah"]);
const isAllowedCollection = (id: string, name = "") => !excludedCollections.has(id.toLowerCase()) && !name.toLowerCase().includes("shah waliullah");

// The source dataset has numbering gaps (e.g. Sahih Muslim has no text for #8); a 404 means "no record", not an outage.
export class HadithNotFoundError extends Error {}

const fetchJson = async (path: string): Promise<Json> => {
  const baseUrl = process.env.UMMAH_API_URL?.trim() || DEFAULT_BASE_URL;
  const headers: HeadersInit = {};
  const key = process.env.UMMAH_API_KEY?.trim();
  if (key) headers["X-API-Key"] = key;
  const response = await fetch(new URL(path, baseUrl), { headers, next: { revalidate: 3_600 } });
  const payload = object(await response.json());
  if (response.status === 404) throw new HadithNotFoundError("UmmahAPI has no record for this request.");
  if (!response.ok || payload.success !== true) throw new Error(`UmmahAPI request failed: ${response.status}`);
  return payload;
};

const normalizeRecord = (value: unknown): HadithRecord | null => {
  const item = object(value);
  const hadithNumber = number(item.hadithnumber);
  const collectionId = text(item.collection);
  const collectionName = text(item.collection_name);
  const arabic = text(item.arabic);
  const english = text(item.english);
  if (!hadithNumber || !validSlug(collectionId) || !isAllowedCollection(collectionId, collectionName) || !collectionName || !arabic || !english) return null;
  const grade = text(item.grade);
  return { arabic, authenticityContext: grade || "No grade supplied", bookNumber: 0, collectionId, collectionName, grades: grade ? [{ grade, scholar: "Authority not identified by provider" }] : [], hadithNumber, narrator: "", referenceNumber: hadithNumber, sectionName: `${collectionName} · Hadith ${hadithNumber}`, text: english };
};

export const ummahHadithAdapter: HadithSourceAdapter = {
  async collections() {
    const data = object((await fetchJson("/api/hadith/collections")).data);
    return array(data.collections).map((item) => ({ id: text(item.key), name: text(item.name), reliability: text(item.reliability) || undefined, sections: [{ id: "all", name: "All available Hadith" }], total: number(item.total_hadiths) })).filter((item) => validSlug(item.id) && isAllowedCollection(item.id, item.name) && item.name && item.total > 0);
  },
  async daily(day) {
    const collections = await this.collections();
    if (!collections.length) return null;
    const collection = collections[dailyIndex(day, collections.length, "hadith-collection")];
    const page = 1 + dailyIndex(day, Math.max(1, Math.ceil(collection.total / 25)), `hadith-page:${collection.id}`);
    const result = await this.list(collection.id, page);
    if (!result.items.length) return null;
    return result.items[dailyIndex(day, result.items.length, `hadith-item:${collection.id}`)] ?? null;
  },
  async list(collection, requestedPage = 1, query) {
    if (!validSlug(collection) || !isAllowedCollection(collection)) throw new Error("Invalid Hadith collection.");
    const page = Math.max(1, Math.floor(requestedPage));
    const needle = query?.trim();
    const payload = await fetchJson(needle ? `/api/hadith/search?q=${encodeURIComponent(needle)}&collection=${encodeURIComponent(collection)}&limit=50` : `/api/hadith/${collection}?page=${page}&limit=25`);
    const data = object(payload.data);
    const items = array(data.hadiths).map(normalizeRecord).filter((item): item is HadithRecord => Boolean(item));
    return needle ? { items, page: 1, pages: 1, total: number(data.total_found) || items.length } : { items, page: number(data.page) || page, pages: number(data.total_pages) || 1, total: number(data.total) || items.length };
  },
  async one(collection, hadithNumber) {
    if (!validSlug(collection) || !isAllowedCollection(collection) || !Number.isInteger(hadithNumber) || hadithNumber < 1) return null;
    try {
      return normalizeRecord(object((await fetchJson(`/api/hadith/${collection}/${hadithNumber}`)).data));
    } catch (error) {
      if (error instanceof HadithNotFoundError) return null;
      throw error;
    }
  },
};

// Book pages read the dataset UmmahAPI wraps directly (same numbering, Arabic and English), one book file per language.
const BOOK_PAGE_SIZE = 25;
export const COLLECTION_AUTHORITY = "Collection grade reported by UmmahAPI";
const HADITH_DATASET_URL = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1";

const fetchBookFile = async (edition: string, book: number) => {
  const baseUrl = process.env.HADITH_DATASET_URL?.trim() || HADITH_DATASET_URL;
  const response = await fetch(`${baseUrl}/editions/${edition}/sections/${book}.min.json`, { next: { revalidate: 86_400 } });
  if (response.status === 404) throw new HadithNotFoundError("The Hadith dataset has no file for this book.");
  if (!response.ok) throw new Error(`Hadith dataset request failed: ${response.status}`);
  return array(object(await response.json()).hadiths);
};

export async function loadHadithBook(collection: string, bookNumber: number, requestedPage = 1): Promise<HadithBookPage | null> {
  if (!validSlug(collection) || !isAllowedCollection(collection) || !Number.isInteger(bookNumber)) return null;
  const book = hadithBook(collection, bookNumber);
  if (!book) return null;
  const [english, arabic] = await Promise.all([fetchBookFile(`eng-${collection}`, bookNumber), fetchBookFile(`ara-${collection}`, bookNumber)]);
  const arabicByNumber = new Map(arabic.map((item) => [number(item.hadithnumber), text(item.text)]));
  const catalogEntry = (await ummahHadithAdapter.collections().catch(() => [])).find((item) => item.id === collection);
  if (!catalogEntry) throw new Error("Hadith collection name unavailable.");
  const collectionName = catalogEntry.name;
  // Matches UmmahAPI's single-Hadith responses: an ungraded record in a collection UmmahAPI rates "Sahih" carries that collection grade, labelled as such.
  const collectionGrade = catalogEntry.reliability === "Sahih" ? [{ grade: "Sahih", scholar: COLLECTION_AUTHORITY }] : [];
  const records = english.flatMap((item): HadithRecord[] => {
    const hadithNumber = number(item.hadithnumber);
    const englishText = text(item.text);
    const arabicText = arabicByNumber.get(hadithNumber) ?? "";
    // Like the list view, only complete Arabic + English records are shown.
    if (!hadithNumber || !englishText || !arabicText) return [];
    const named = array(item.grades).map((grade) => ({ grade: text(grade.grade), scholar: text(grade.name) })).filter((grade) => grade.grade && grade.scholar);
    const grades = named.length ? named : collectionGrade;
    return [{ arabic: arabicText, authenticityContext: named.map((grade) => `${grade.grade} (${grade.scholar})`).join(" · ") || (grades.length ? "Sahih (collection grade reported by UmmahAPI)" : "No grade supplied"), bookNumber, collectionId: collection, collectionName, grades, hadithNumber, narrator: "", referenceNumber: hadithNumber, sectionName: book.name, text: englishText }];
  }).sort((a, b) => a.hadithNumber - b.hadithNumber);
  const pages = Math.max(1, Math.ceil(records.length / BOOK_PAGE_SIZE));
  const page = Math.min(pages, Math.max(1, Math.floor(requestedPage)));
  return { book, items: records.slice((page - 1) * BOOK_PAGE_SIZE, page * BOOK_PAGE_SIZE), page, pages, total: records.length };
}

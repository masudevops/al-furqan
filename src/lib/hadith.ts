import "server-only";
import { unstable_cache } from "next/cache";

const CDN = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1";

type Json = Record<string, unknown>;

export interface HadithCollection {
  id: string;
  name: string;
  sections: Array<{ id: string; name: string }>;
}

export interface HadithRecord {
  arabic: string;
  bookNumber: number;
  collectionId: string;
  collectionName: string;
  grades: Array<{ grade: string; scholar: string }>;
  hadithNumber: number;
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
const text = (value: unknown): string => typeof value === "string" ? value : "";
const number = (value: unknown): number => Number.isFinite(Number(value)) ? Number(value) : 0;

const fetchJson = async (path: string, cache = true): Promise<Json> => {
  for (const suffix of [".min.json", ".json"]) {
    const response = await fetch(`${CDN}/${path}${suffix}`, cache ? { next: { revalidate: 86_400 } } : { cache: "no-store" });
    if (response.ok) return asObject(await response.json());
  }
  throw new Error("Hadith source is unavailable.");
};

const loadCatalog = unstable_cache(async (): Promise<HadithCollection[]> => {
  // The provider's info file is currently larger than Next.js's 2 MB fetch-cache
  // limit. Reduce it first and cache only the small catalog result.
  const payload = await fetchJson("info", false);
  return Object.entries(payload).map(([id, raw]) => {
    const metadata = asObject(asObject(raw).metadata);
    return {
      id,
      name: text(metadata.name),
      sections: Object.entries(asObject(metadata.sections)).filter(([, name]) => text(name)).map(([sectionId, name]) => ({ id: sectionId, name: text(name) })),
    };
  }).filter(item => item.id && item.name && item.sections.length > 0);
}, ["hadith-provider-catalog-v1"], { revalidate: 86_400 });

const normalize = (collection: string, english: Json, arabic: Json): HadithRecord[] => {
  const metadata = asObject(english.metadata);
  const section = asObject(metadata.section);
  const arabicByNumber = new Map(asArray(arabic.hadiths).map(item => [number(item.hadithnumber), text(item.text)]));
  return asArray(english.hadiths).map(item => {
    const reference = asObject(item.reference);
    const bookNumber = number(reference.book);
    return {
      hasBookReference: reference.book !== undefined,
      record: {
        arabic: arabicByNumber.get(number(item.hadithnumber)) ?? "",
        bookNumber,
        collectionId: collection,
        collectionName: text(metadata.name),
        grades: asArray(item.grades).map(grade => ({ grade: text(grade.grade), scholar: text(grade.name) })).filter(grade => grade.grade && grade.scholar),
        hadithNumber: number(item.hadithnumber),
        referenceNumber: number(reference.hadith),
        sectionName: text(section[String(bookNumber)]),
        text: text(item.text),
      },
    };
  }).filter(({ hasBookReference, record }) => hasBookReference && record.hadithNumber > 0 && record.referenceNumber > 0 && record.bookNumber >= 0 && record.text && record.arabic && record.collectionName && record.sectionName && record.grades.length > 0).map(({ record }) => record);
};

export const jsDelivrHadithAdapter: HadithSourceAdapter = {
  async collections() {
    return loadCatalog();
  },
  async list(collection, section, query) {
    const path = section ? `editions/eng-${collection}/sections/${section}` : `editions/eng-${collection}`;
    const arabicPath = section ? `editions/ara-${collection}/sections/${section}` : `editions/ara-${collection}`;
    // Whole-collection search payloads can exceed Next.js's per-item cache
    // limit; section and detail payloads remain safely revalidated.
    const [english, arabic] = await Promise.all([fetchJson(path, Boolean(section)), fetchJson(arabicPath, Boolean(section))]);
    const normalized = normalize(collection, english, arabic);
    const needle = query?.trim().toLocaleLowerCase();
    return (needle ? normalized.filter(item => `${item.text} ${item.arabic}`.toLocaleLowerCase().includes(needle)) : normalized).slice(0, 100);
  },
  async one(collection, hadithNumber) {
    const [english, arabic] = await Promise.all([
      fetchJson(`editions/eng-${collection}/${hadithNumber}`),
      fetchJson(`editions/ara-${collection}/${hadithNumber}`),
    ]);
    return normalize(collection, english, arabic)[0] ?? null;
  },
};

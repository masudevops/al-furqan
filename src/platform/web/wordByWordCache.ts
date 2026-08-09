import type { VerseWords } from "../../core/quran/wordByWord";

const DB_NAME = "al-furqan-quran-foundation";
const STORE = "verse-words";
export const WORD_CACHE_MAX_AGE_MS = 6 * 24 * 60 * 60 * 1000;

interface CachedVerseWords {
  key: string;
  value: VerseWords;
  storedAt: number;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedVerseWords(key: string): Promise<VerseWords | null> {
  if (!("indexedDB" in globalThis)) return null;
  const db = await openDatabase();
  const result = await new Promise<CachedVerseWords | undefined>((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  if (result && Date.now() - result.storedAt > WORD_CACHE_MAX_AGE_MS) {
    db.transaction(STORE, "readwrite").objectStore(STORE).delete(key);
    db.close();
    return null;
  }
  db.close();
  return result?.value ?? null;
}

export async function cacheVerseWords(value: VerseWords): Promise<void> {
  if (!("indexedDB" in globalThis)) return;
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, "readwrite").objectStore(STORE).put({
      key: value.verseKey,
      value,
      storedAt: Date.now(),
    } satisfies CachedVerseWords);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  db.close();
}

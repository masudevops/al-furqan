import type { AudioTrack } from "../../core/audio/contracts";

const DB_NAME = "al-furqan-offline-audio";
const STORE = "tracks";

export interface DownloadedAudio {
  key: string;
  track: AudioTrack;
  blob: Blob;
  downloadedAt: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "key" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const audioDownloadKey = (track: AudioTrack) => `${track.surahNumber}:${track.number}:${new URL(track.audio).hostname}${new URL(track.audio).pathname}`;

export async function downloadAudioTrack(track: AudioTrack): Promise<void> {
  const response = await fetch(track.audio);
  if (!response.ok) throw new Error("Audio download failed");
  const record: DownloadedAudio = { key: audioDownloadKey(track), track, blob: await response.blob(), downloadedAt: new Date().toISOString() };
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => { const request = db.transaction(STORE, "readwrite").objectStore(STORE).put(record); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); });
  db.close();
}

export async function getDownloadedAudio(track: AudioTrack): Promise<Blob | null> {
  if (!("indexedDB" in globalThis)) return null;
  const db = await openDatabase();
  const result = await new Promise<DownloadedAudio | undefined>((resolve, reject) => { const request = db.transaction(STORE).objectStore(STORE).get(audioDownloadKey(track)); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  db.close();
  return result?.blob ?? null;
}

export async function listDownloadedAudio(): Promise<DownloadedAudio[]> {
  const db = await openDatabase();
  const results = await new Promise<DownloadedAudio[]>((resolve, reject) => { const request = db.transaction(STORE).objectStore(STORE).getAll(); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  db.close();
  return results;
}

export async function removeDownloadedAudio(key: string): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => { const request = db.transaction(STORE, "readwrite").objectStore(STORE).delete(key); request.onsuccess = () => resolve(); request.onerror = () => reject(request.error); });
  db.close();
}

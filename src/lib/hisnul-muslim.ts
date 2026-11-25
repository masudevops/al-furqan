import "server-only";

// Hisnul Muslim (Fortress of the Muslim) by Sa'id bin Wahf al-Qahtani, read from the JSON files hisnmuslim.com publishes.
// Interim source: the site states no terms of use and names no English translator; see docs/DATA-SOURCES.md.
// Text is shown as given. The files use their fields inconsistently, so nothing here relabels or rewrites them.
const BASE_URL = "https://www.hisnmuslim.com/api";

export interface HisnChapterSummary { id: number; title: string; titleArabic: string }
export interface HisnEntry { id: number; arabic: string; note: string; translation: string; repeat: number; audioUrl: string | null }
export interface HisnChapter extends HisnChapterSummary { entries: HisnEntry[] }

type Json = Record<string, unknown>;
const text = (value: unknown) => typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
const number = (value: unknown) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : 0; };

// The files carry a byte-order mark and raw line breaks inside strings, and one chapter title is missing its closing quote.
// These are structural repairs only: whitespace becomes spaces and the quote is closed; no wording changes.
export function parseHisnJson(raw: string): Json {
  const cleaned = raw.replace(/^﻿/, "").replace(/[\u0000-\u001F]+/g, " ");
  try {
    return JSON.parse(cleaned) as Json;
  } catch {
    return JSON.parse(cleaned.replace(/^\s*\{\s*"([^"]*?):\s*\[/, (_match, title: string) => `{"${title}": [`)) as Json;
  }
}

async function fetchFile(path: string): Promise<Json> {
  const response = await fetch(`${process.env.HISNUL_MUSLIM_URL?.trim() || BASE_URL}${path}`, { next: { revalidate: 86_400 } });
  if (!response.ok) throw new Error(`Hisnul Muslim request failed: ${response.status}`);
  return parseHisnJson(await response.text());
}

const firstList = (value: Json) => { const list = Object.values(value)[0]; return Array.isArray(list) ? list as Json[] : []; };
const httpsAudio = (value: unknown) => { const url = text(value); return /^https?:\/\/(www\.)?hisnmuslim\.com\/audio\//.test(url) ? url.replace(/^http:/, "https:") : null; };

export async function loadHisnChapters(): Promise<HisnChapterSummary[]> {
  const [english, arabic] = await Promise.all([fetchFile("/en/husn_en.json"), fetchFile("/ar/husn_ar.json").catch(() => ({}))]);
  const arabicTitles = new Map(firstList(arabic).map((item) => [number(item.ID), text(item.TITLE)]));
  return firstList(english)
    .map((item) => ({ id: number(item.ID), title: text(item.TITLE), titleArabic: arabicTitles.get(number(item.ID)) ?? "" }))
    .filter((item) => Number.isInteger(item.id) && item.id > 0 && item.title)
    .sort((a, b) => a.id - b.id);
}

export async function loadHisnChapter(id: number): Promise<HisnChapter | null> {
  if (!Number.isInteger(id) || id < 1) return null;
  const chapters = await loadHisnChapters();
  const summary = chapters.find((chapter) => chapter.id === id);
  if (!summary) return null;
  const entries = firstList(await fetchFile(`/en/${id}.json`)).flatMap((item): HisnEntry[] => {
    // One entry stores its Arabic under "Text" instead of "ARABIC_TEXT".
    const arabic = text(item.ARABIC_TEXT) || text(item.Text);
    const translation = text(item.TRANSLATED_TEXT);
    const note = text(item.LANGUAGE_ARABIC_TRANSLATED_TEXT);
    if (!arabic || (!translation && !note)) return [];
    return [{ id: number(item.ID), arabic, note, translation, repeat: Math.max(1, number(item.REPEAT)), audioUrl: httpsAudio(item.AUDIO) }];
  });
  return { ...summary, entries };
}

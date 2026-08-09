import type { AyahReference } from "./contracts";
import type { KeyValueStorage } from "./readerPreferences";

export const PERSONAL_STUDY_KEY = "alFurqan.quran.personalStudy.v1";

export interface VerseNote {
  ref: AyahReference;
  text: string;
  tags: string[];
  updatedAt: string;
}

export interface PersonalStudyState {
  notes: VerseNote[];
  memorized: string[];
}

const EMPTY_STATE: PersonalStudyState = { notes: [], memorized: [] };
const refKey = (ref: AyahReference) => `${ref.surahNumber}:${ref.ayahNumber}`;

function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map((tag) => tag.trim()).filter(Boolean))].slice(0, 8);
}

export function createPersonalStudyRepository(
  storage: KeyValueStorage,
  now: () => string = () => new Date().toISOString(),
) {
  const read = (): PersonalStudyState => {
    try {
      const parsed = JSON.parse(storage.getItem(PERSONAL_STUDY_KEY) || "null") as Partial<PersonalStudyState> | null;
      return {
        notes: Array.isArray(parsed?.notes)
          ? parsed.notes.filter((item): item is VerseNote => Boolean(item && item.ref && typeof item.text === "string" && Array.isArray(item.tags)))
          : [],
        memorized: Array.isArray(parsed?.memorized)
          ? parsed.memorized.filter((item): item is string => typeof item === "string")
          : [],
      };
    } catch {
      return EMPTY_STATE;
    }
  };
  const write = (state: PersonalStudyState) => {
    storage.setItem(PERSONAL_STUDY_KEY, JSON.stringify(state));
    return state;
  };

  return {
    getState: read,
    saveNote(ref: AyahReference, text: string, tags: string[] = []) {
      const state = read();
      const cleaned = text.trim();
      const notes = state.notes.filter((note) => refKey(note.ref) !== refKey(ref));
      if (cleaned) notes.push({ ref, text: cleaned.slice(0, 10_000), tags: normalizeTags(tags), updatedAt: now() });
      return write({ ...state, notes });
    },
    toggleMemorized(ref: AyahReference) {
      const state = read();
      const key = refKey(ref);
      return write({ ...state, memorized: state.memorized.includes(key) ? state.memorized.filter((item) => item !== key) : [...state.memorized, key] });
    },
  };
}

export interface DuaAudioSource {
  sourceName: "Hisnul Muslim";
  sourceUrl: "https://www.hisnmuslim.com/";
  url: string;
}

// These links were matched against the exact Arabic carried by the current
// fitrahive catalog. Ambiguous, combined, or variant morning/evening recordings
// are deliberately omitted rather than risking playback of the wrong wording.
const AUDIO_IDS: Record<string, Record<number, number>> = {
  "morning-dhikr": {
    1: 100, 5: 77, 6: 78, 7: 79, 8: 82, 9: 84, 10: 85, 11: 86,
    12: 87, 13: 88, 14: 90, 15: 93, 16: 94, 17: 95, 18: 91, 19: 96,
  },
  "evening-dhikr": {
    1: 100, 7: 79, 8: 82, 9: 84, 10: 85, 11: 86, 12: 87, 13: 88,
    15: 93, 16: 94, 17: 91, 18: 96, 19: 216,
  },
  "daily-dua": {
    1: 105, 2: 1, 3: 10, 4: 11, 5: 12, 7: 180, 10: 12, 12: 176,
    15: 16, 16: 17, 17: 207, 18: 212, 19: 213, 20: 6, 21: 5,
    22: 206, 23: 172, 24: 174, 25: 173, 26: 166, 27: 79, 28: 139,
    29: 154, 30: 136, 31: 121, 37: 25,
  },
  "selected-dua": { 1: 235, 7: 121 },
  "dhikr-after-salah": { 3: 67, 4: 68, 5: 240, 7: 241, 8: 93, 9: 100, 13: 95 },
};

export function getDuaAudio(slug: string, id: number): DuaAudioSource | null {
  const audioId = AUDIO_IDS[slug]?.[id];
  if (!audioId) return null;
  return {
    sourceName: "Hisnul Muslim",
    sourceUrl: "https://www.hisnmuslim.com/",
    url: `https://www.hisnmuslim.com/audio/ar/${audioId}.mp3`,
  };
}

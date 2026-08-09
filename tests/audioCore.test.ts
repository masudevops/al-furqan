import { describe, expect, it } from "vitest";
import {
  clampSeekTime,
  isValidAudioUrl,
  normalizeStartIndex,
  sanitizeAudioPlaylist,
  type AudioTrack,
} from "../src/core/audio/contracts";
import {
  AUDIO_PREFERENCES_KEY,
  DEFAULT_AUDIO_PREFERENCES,
  loadAudioPreferences,
  normalizeRepeatRange,
  saveAudioPreferences,
} from "../src/core/audio/preferences";
import type { KeyValueStorage } from "../src/core/quran/readerPreferences";

const validTrack: AudioTrack = {
  number: 1,
  text: "بِسْمِ اللَّهِ",
  audio: "https://audio.example/1.mp3",
  surahNumber: 1,
  surahName: "Al-Faatiha",
};

function createStorage(initial?: string): KeyValueStorage {
  let value = initial ?? null;
  return {
    getItem: () => value,
    setItem: (_key, nextValue) => {
      value = nextValue;
    },
  };
}

describe("audio contracts", () => {
  it("accepts only HTTPS media URLs", () => {
    expect(isValidAudioUrl("https://audio.example/1.mp3")).toBe(true);
    expect(isValidAudioUrl("http://audio.example/1.mp3")).toBe(false);
    expect(isValidAudioUrl("javascript:alert(1)")).toBe(false);
    expect(isValidAudioUrl("")).toBe(false);
  });

  it("filters invalid tracks without mutating valid ones", () => {
    expect(
      sanitizeAudioPlaylist([
        validTrack,
        { ...validTrack, number: 2, audio: "" },
        { ...validTrack, number: 3, surahNumber: 999 },
      ]),
    ).toEqual([validTrack]);
  });

  it("clamps seek time and playlist start indexes", () => {
    expect(clampSeekTime(-10, 120)).toBe(0);
    expect(clampSeekTime(200, 120)).toBe(120);
    expect(clampSeekTime(45, 120)).toBe(45);
    expect(clampSeekTime(45, Number.NaN)).toBe(0);
    expect(normalizeStartIndex(-3, 4)).toBe(0);
    expect(normalizeStartIndex(9, 4)).toBe(3);
    expect(normalizeStartIndex(0, 0)).toBe(-1);
  });
});

describe("audio preferences", () => {
  it("loads defaults from corrupt or unsupported preferences", () => {
    expect(loadAudioPreferences(createStorage("{broken"))).toEqual(
      DEFAULT_AUDIO_PREFERENCES,
    );
    expect(
      loadAudioPreferences(
        createStorage(JSON.stringify({ playbackSpeed: 9, repeatMode: "loop" })),
      ),
    ).toEqual(DEFAULT_AUDIO_PREFERENCES);
  });

  it("persists supported speed and repeat preferences", () => {
    const storage = createStorage();
    saveAudioPreferences(storage, {
      playbackSpeed: 1.5,
      repeatMode: "ayah",
    });
    expect(storage.getItem(AUDIO_PREFERENCES_KEY)).toContain(
      '"playbackSpeed":1.5',
    );
    expect(loadAudioPreferences(storage)).toEqual({
      playbackSpeed: 1.5,
      repeatMode: "ayah",
    });
  });

  it("normalizes repeat ranges in either selection order", () => {
    expect(normalizeRepeatRange(4, 1, 6)).toEqual({
      startIndex: 1,
      endIndex: 4,
    });
    expect(normalizeRepeatRange(-3, 99, 3)).toEqual({
      startIndex: 0,
      endIndex: 2,
    });
    expect(normalizeRepeatRange(0, 0, 0)).toBeNull();
  });
});

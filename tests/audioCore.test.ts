import { describe, expect, it } from "vitest";
import {
  clampSeekTime,
  isValidAudioUrl,
  normalizeStartIndex,
  sanitizeAudioPlaylist,
  type AudioTrack,
} from "../src/core/audio/contracts";

const validTrack: AudioTrack = {
  number: 1,
  text: "بِسْمِ اللَّهِ",
  audio: "https://audio.example/1.mp3",
  surahNumber: 1,
  surahName: "Al-Faatiha",
};

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

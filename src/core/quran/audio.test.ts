import { describe, expect, it } from "vitest";

import { normalizeAyahRange, resolveNextAudioStep } from "@/core/quran/audio";

const verses = [
  { audioUrl: "https://audio.test/1.mp3", verseKey: "1:1", verseNumber: 1 },
  { audioUrl: "https://audio.test/2.mp3", verseKey: "1:2", verseNumber: 2 },
  { audioUrl: null, verseKey: "1:3", verseNumber: 3 },
  { audioUrl: "https://audio.test/4.mp3", verseKey: "1:4", verseNumber: 4 },
];

describe("normalizeAyahRange", () => {
  it("clamps and orders an Ayah range", () => {
    expect(normalizeAyahRange(0, 99, 7)).toEqual({ start: 1, end: 7 });
    expect(normalizeAyahRange(5, 2, 7)).toEqual({ start: 5, end: 5 });
  });
});

describe("resolveNextAudioStep", () => {
  it("replays the current Ayah until its selected count is complete", () => {
    expect(resolveNextAudioStep({ activeRange: true, completedPlay: 1, currentVerseKey: "1:1", loopRange: false, rangeEnd: 2, rangeStart: 1, repeatCount: 3, verses }))
      .toEqual({ nextVerseKey: "1:1", replayCurrent: true });
  });

  it("advances and stops at the selected range boundary", () => {
    expect(resolveNextAudioStep({ activeRange: true, completedPlay: 3, currentVerseKey: "1:1", loopRange: false, rangeEnd: 2, rangeStart: 1, repeatCount: 3, verses }))
      .toEqual({ nextVerseKey: "1:2", replayCurrent: false });
    expect(resolveNextAudioStep({ activeRange: true, completedPlay: 3, currentVerseKey: "1:2", loopRange: false, rangeEnd: 2, rangeStart: 1, repeatCount: 3, verses }))
      .toEqual({ nextVerseKey: null, replayCurrent: false });
  });

  it("loops back to the first sourced Ayah in the selected range", () => {
    expect(resolveNextAudioStep({ activeRange: true, completedPlay: 1, currentVerseKey: "1:4", loopRange: true, rangeEnd: 4, rangeStart: 2, repeatCount: 1, verses }))
      .toEqual({ nextVerseKey: "1:2", replayCurrent: false });
  });

  it("skips unavailable audio during ordinary continuous playback", () => {
    expect(resolveNextAudioStep({ activeRange: false, completedPlay: 1, currentVerseKey: "1:2", loopRange: false, rangeEnd: 4, rangeStart: 1, repeatCount: 1, verses }))
      .toEqual({ nextVerseKey: "1:4", replayCurrent: false });
  });
});

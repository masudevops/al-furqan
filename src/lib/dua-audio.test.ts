import { describe, expect, it } from "vitest";

import { getDuaAudio } from "@/lib/dua-audio";

describe("Dua audio mappings", () => {
  it("returns a secure, identified source for a reviewed recording", () => {
    expect(getDuaAudio("morning-dhikr", 1)).toEqual({
      sourceName: "Hisnul Muslim",
      sourceUrl: "https://www.hisnmuslim.com/",
      url: "https://www.hisnmuslim.com/audio/ar/100.mp3",
    });
  });

  it("does not guess when a recording is ambiguous", () => {
    expect(getDuaAudio("morning-dhikr", 2)).toBeNull();
    expect(getDuaAudio("unknown", 1)).toBeNull();
  });
});

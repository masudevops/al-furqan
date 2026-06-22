import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSurahAudio } from "../src/services/quranService";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Quran audio provider adapter", () => {
  it("returns only validated HTTPS ayah audio records", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            ayahs: [
              {
                numberInSurah: 1,
                text: "one",
                audio: "https://audio.example/1.mp3",
              },
              {
                numberInSurah: 2,
                text: "two",
                audio: "http://audio.example/2.mp3",
              },
              {
                numberInSurah: 3,
                text: "missing audio",
              },
            ],
          },
        }),
      }),
    );

    await expect(fetchSurahAudio("1", "ar.alafasy")).resolves.toEqual([
      {
        number: 1,
        text: "one",
        audio: "https://audio.example/1.mp3",
      },
    ]);
  });

  it("returns an empty list for malformed provider data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { ayahs: "invalid" } }),
      }),
    );

    await expect(fetchSurahAudio("2", "ar.alafasy")).resolves.toEqual([]);
  });
});

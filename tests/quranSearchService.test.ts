import { afterEach, describe, expect, it, vi } from "vitest";
import { searchAyahs } from "../src/services/quranService";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Quran search provider adapter", () => {
  it("uses the scoped provider endpoint and validates matches", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          matches: [
            {
              number: 1,
              text: "Mercy",
              numberInSurah: 1,
              edition: { identifier: "en.sahih", name: "English" },
              surah: {
                number: 1,
                name: "الفاتحة",
                englishName: "Al-Faatiha",
              },
            },
          ],
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      searchAyahs({
        query: "Mercy",
        edition: "en.sahih",
        surahNumber: 1,
      }),
    ).resolves.toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.alquran.cloud/v1/search/mercy/1/en.sahih",
      { signal: undefined },
    );
  });

  it("filters a Juz response locally with normalized Arabic", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: {
            edition: { identifier: "quran-simple", name: "Simple" },
            ayahs: [
              {
                number: 1,
                text: "ٱلصَّبْرُ جميل",
                numberInSurah: 1,
                juz: 1,
                surah: {
                  number: 1,
                  name: "الفاتحة",
                  englishName: "Al-Faatiha",
                },
              },
              {
                number: 2,
                text: "الرحمة",
                numberInSurah: 2,
                juz: 1,
                surah: {
                  number: 1,
                  name: "الفاتحة",
                  englishName: "Al-Faatiha",
                },
              },
            ],
          },
        }),
      }),
    );

    const results = await searchAyahs({
      query: "الصبر",
      edition: "quran-simple",
      juzNumber: 1,
    });
    expect(results.map((result) => result.number)).toEqual([1]);
  });

  it("rejects malformed provider responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: { matches: [{ text: "missing fields" }] } }),
      }),
    );

    await expect(
      searchAyahs({ query: "mercy", edition: "en.sahih" }),
    ).rejects.toThrow("Invalid search response");
  });
});

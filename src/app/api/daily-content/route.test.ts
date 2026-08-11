import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/data", () => ({ loadDailyVerse: vi.fn() }));
vi.mock("@/lib/hadith", () => ({ ummahHadithAdapter: { daily: vi.fn() } }));
vi.mock("@/lib/feature-flags", () => ({ HADITH_ENABLED: true }));

import { GET } from "@/app/api/daily-content/route";
import { loadDailyVerse } from "@/lib/data";
import { ummahHadithAdapter } from "@/lib/hadith";

describe("daily content route", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns both independently sourced daily records", async () => {
    vi.mocked(loadDailyVerse).mockResolvedValue({ arabicText: "آية", chapterName: "Test", translationName: "Verified translation", translationText: "Verse", verseKey: "1:1" });
    vi.mocked(ummahHadithAdapter.daily).mockResolvedValue({ arabic: "حديث", authenticityContext: "Sahih", bookNumber: 0, collectionId: "bukhari", collectionName: "Sahih al-Bukhari", grades: [], hadithNumber: 1, narrator: "", referenceNumber: 1, sectionName: "Hadith 1", text: "Hadith" });
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ error: null, hadith: { hadithNumber: 1 }, verse: { verseKey: "1:1" } });
  });

  it("keeps the available source when the other provider fails", async () => {
    vi.mocked(loadDailyVerse).mockRejectedValue(new Error("Quran unavailable"));
    vi.mocked(ummahHadithAdapter.daily).mockResolvedValue({ arabic: "حديث", authenticityContext: "Sahih", bookNumber: 0, collectionId: "bukhari", collectionName: "Sahih al-Bukhari", grades: [], hadithNumber: 1, narrator: "", referenceNumber: 1, sectionName: "Hadith 1", text: "Hadith" });
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ error: null, hadith: { hadithNumber: 1 }, verse: null });
  });
});

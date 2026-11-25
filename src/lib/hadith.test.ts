import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { loadHadithBook, ummahHadithAdapter, withHadithTranslations, type HadithRecord } from "@/lib/hadith";
import { hadithLanguagesFor, resolveHadithLanguage } from "@/lib/hadith-languages";

const response = (data: unknown) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ success: true, data }) } as Response);
const record = (overrides: Record<string, unknown> = {}) => ({ arabic: "نص عربي", collection: "bukhari", collection_name: "Sahih al-Bukhari", english: "English source text", grade: "Sahih", hadithnumber: 7, id: "bukhari-7", ...overrides });

describe("ummahHadithAdapter", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.unstubAllGlobals());

  it("discovers collections dynamically", async () => {
    vi.mocked(fetch).mockImplementationOnce(() => response({ collections: [{ key: "bukhari", name: "Sahih al-Bukhari", total_hadiths: 7580 }, { key: "shahwaliullah", name: "Shah Waliullah's 40 Hadith", total_hadiths: 40 }] }));
    await expect(ummahHadithAdapter.collections()).resolves.toEqual([{ id: "bukhari", name: "Sahih al-Bukhari", sections: [{ id: "all", name: "All available Hadith" }], total: 7580 }]);
  });

  it("blocks the excluded Shah Waliullah collection from direct access", async () => {
    await expect(ummahHadithAdapter.list("shahwaliullah")).rejects.toThrow("Invalid Hadith collection");
    await expect(ummahHadithAdapter.one("shahwaliullah", 1)).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("selects a stable daily record from an allowed live collection", async () => {
    vi.mocked(fetch)
      .mockImplementationOnce(() => response({ collections: [{ key: "bukhari", name: "Sahih al-Bukhari", total_hadiths: 50 }] }))
      .mockImplementationOnce(() => response({ hadiths: [record()], page: 1, total: 50, total_pages: 2 }));
    await expect(ummahHadithAdapter.daily("2026-08-11")).resolves.toMatchObject({ collectionId: "bukhari", hadithNumber: 7 });
  });

  it("normalizes source text and labels a grade without inventing its authority", async () => {
    vi.mocked(fetch).mockImplementationOnce(() => response({ hadiths: [record()], page: 2, total: 100, total_pages: 4 }));
    await expect(ummahHadithAdapter.list("bukhari", 2)).resolves.toEqual({ items: [expect.objectContaining({ arabic: "نص عربي", authenticityContext: "Sahih", grades: [{ grade: "Sahih", scholar: "Authority not identified by provider" }], hadithNumber: 7, text: "English source text" })], page: 2, pages: 4, total: 100 });
  });

  it("treats a numbering gap in the source dataset as no record, not an outage", async () => {
    vi.mocked(fetch).mockImplementationOnce(() => Promise.resolve({ ok: false, status: 404, json: () => Promise.resolve({ success: false, error: "Hadith not found" }) } as Response));
    await expect(ummahHadithAdapter.one("muslim", 8)).resolves.toBeNull();
    vi.mocked(fetch).mockImplementationOnce(() => Promise.resolve({ ok: false, status: 503, json: () => Promise.resolve({ success: false }) } as Response));
    await expect(ummahHadithAdapter.one("muslim", 3)).rejects.toThrow("UmmahAPI request failed: 503");
  });

  it("uses provider full-text search", async () => {
    vi.mocked(fetch).mockImplementationOnce(() => response({ hadiths: [record()], total_found: 1 }));
    await expect(ummahHadithAdapter.list("bukhari", 1, "prayer")).resolves.toMatchObject({ page: 1, pages: 1, total: 1 });
    expect(String(vi.mocked(fetch).mock.calls[0][0])).toContain("/api/hadith/search?q=prayer&collection=bukhari");
  });

  it("omits incomplete religious records", async () => {
    vi.mocked(fetch).mockImplementationOnce(() => response({ hadiths: [record({ arabic: "" })] }));
    await expect(ummahHadithAdapter.list("bukhari")).resolves.toMatchObject({ items: [] });
  });
});

const dataset = (hadiths: unknown[], status = 200) => Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve({ hadiths }) } as Response);
const normalized = (hadithNumber: number): HadithRecord => ({ arabic: "نص", authenticityContext: "", bookNumber: 0, collectionId: "bukhari", collectionName: "Sahih al-Bukhari", grades: [], hadithNumber, narrator: "", referenceNumber: hadithNumber, sectionName: "", text: "English" });

describe("Hadith translations", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.unstubAllGlobals());

  it("offers only the editions each collection has, falling back to English", () => {
    expect(hadithLanguagesFor("qudsi").map((language) => language.code)).toEqual(["en", "fr"]);
    expect(hadithLanguagesFor("bukhari")).toHaveLength(8);
    expect(resolveHadithLanguage("tirmidhi", "fr").code).toBe("en");
    expect(resolveHadithLanguage("tirmidhi", "ur").code).toBe("ur");
    expect(resolveHadithLanguage("bukhari", "xx").code).toBe("en");
  });

  it("leaves English records untouched and makes no request", async () => {
    const records = [normalized(1)];
    await expect(withHadithTranslations(records, "bukhari", "en")).resolves.toBe(records);
    await expect(withHadithTranslations(records, "tirmidhi", "fr")).resolves.toBe(records);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("attaches each Hadith's text from the edition, telling a gap in the source apart from an outage", async () => {
    vi.mocked(fetch).mockImplementation((url) => {
      const value = String(url);
      if (value.endsWith("/urd-bukhari/1.min.json")) return dataset([{ hadithnumber: 1, text: " اردو متن " }]);
      if (value.endsWith("/urd-bukhari/2.min.json")) return dataset([], 404);
      return dataset([], 503);
    });
    const [one, two, three] = await withHadithTranslations([normalized(1), normalized(2), normalized(3)], "bukhari", "ur");
    expect(one.translation).toEqual({ language: "ur", text: "اردو متن" });
    expect(two.translation).toEqual({ language: "ur", text: null });
    expect(three.translation).toEqual({ language: "ur", text: null, unavailable: true });
    expect(one.text).toBe("English");
  });

  it("translates a book page from the edition's book file", async () => {
    vi.mocked(fetch).mockImplementation((url) => {
      const value = String(url);
      if (value.includes("ummahapi")) return response({ collections: [{ key: "bukhari", name: "Sahih al-Bukhari", total_hadiths: 7580, reliability: "Sahih" }] });
      if (value.includes("/eng-bukhari/sections/1")) return dataset([{ hadithnumber: 1, text: "Actions are by intentions", grades: [] }, { hadithnumber: 2, text: "Second", grades: [] }]);
      if (value.includes("/ara-bukhari/sections/1")) return dataset([{ hadithnumber: 1, text: "إنما الأعمال" }, { hadithnumber: 2, text: "ثاني" }]);
      if (value.includes("/ben-bukhari/sections/1")) return dataset([{ hadithnumber: 1, text: "বাংলা" }, { hadithnumber: 2, text: "" }]);
      return dataset([], 404);
    });
    const page = await loadHadithBook("bukhari", 1, 1, "bn");
    expect(page?.items.map((item) => item.translation)).toEqual([{ language: "bn", text: "বাংলা" }, { language: "bn", text: null }]);
    expect(vi.mocked(fetch).mock.calls.filter(([url]) => String(url).includes("ben-bukhari"))).toHaveLength(1);
  });
});

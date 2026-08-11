import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ummahHadithAdapter } from "@/lib/hadith";

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

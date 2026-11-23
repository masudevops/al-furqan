import { afterEach, describe, expect, it, vi } from "vitest";
import { loadHadithBook } from "@/lib/hadith";
import { bookOfHadith, hadithBook, hadithBooks } from "@/lib/hadith-books";

const json = (body: unknown) => ({ ok: true, status: 200, json: async () => body } as Response);

describe("Hadith books", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("lists each collection's own books in source order", () => {
    const bukhari = hadithBooks("bukhari");
    expect(bukhari?.books.slice(0, 2)).toEqual([{ number: 1, name: "Revelation", count: 7 }, { number: 2, name: "Belief", count: 51 }]);
    expect(bukhari?.books).toHaveLength(97);
    expect(hadithBooks("nawawi")).toBeNull();
  });

  it("finds a Hadith's book and never borrows a neighbour's for Hadith without one", () => {
    expect(bookOfHadith("bukhari", 8)?.name).toBe("Belief");
    expect(bookOfHadith("bukhari", 299)).toBeNull();
    expect(bookOfHadith("muslim", 1)).toBeNull();
    expect(hadithBook("bukhari", 0)).toBeNull();
  });

  it("joins Arabic and English book files, keeps named grades and skips incomplete records", async () => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/api/hadith/collections")) return json({ success: true, data: { collections: [{ key: "abudawud", name: "Sunan Abu Dawud", reliability: "Hasan/Sahih", total_hadiths: 5274 }, { key: "bukhari", name: "Sahih al-Bukhari", reliability: "Sahih", total_hadiths: 7580 }] } });
      if (url.includes("/eng-abudawud/sections/1")) return json({ hadiths: [{ hadithnumber: 2, text: "Second", grades: [{ name: "Al-Albani", grade: "Sahih" }] }, { hadithnumber: 1, text: "First", grades: [] }, { hadithnumber: 3, text: "", grades: [] }] });
      if (url.includes("/eng-bukhari/sections/1")) return json({ hadiths: [{ hadithnumber: 1, text: "Actions", grades: [] }] });
      if (url.includes("/ara-bukhari/sections/1")) return json({ hadiths: [{ hadithnumber: 1, text: "الأعمال" }] });
      if (url.includes("/ara-abudawud/sections/1")) return json({ hadiths: [{ hadithnumber: 1, text: "الأول" }, { hadithnumber: 2, text: "الثاني" }, { hadithnumber: 3, text: "الثالث" }] });
      throw new Error(`Unexpected ${url}`);
    }));
    const page = await loadHadithBook("abudawud", 1);
    expect(page?.book.name).toBe("Purification (Kitab Al-Taharah)");
    expect(page?.items.map((item) => [item.hadithNumber, item.arabic, item.text])).toEqual([[1, "الأول", "First"], [2, "الثاني", "Second"]]);
    expect(page?.items[1].grades).toEqual([{ grade: "Sahih", scholar: "Al-Albani" }]);
    expect(page?.items[0].authenticityContext).toBe("No grade supplied");
    const bukhari = await loadHadithBook("bukhari", 1);
    expect(bukhari?.items[0].grades).toEqual([{ grade: "Sahih", scholar: "Collection grade reported by UmmahAPI" }]);
  });

  it("rejects unknown books and excluded collections without fetching", async () => {
    vi.stubGlobal("fetch", vi.fn());
    await expect(loadHadithBook("bukhari", 999)).resolves.toBeNull();
    await expect(loadHadithBook("shahwaliullah", 1)).resolves.toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });
});

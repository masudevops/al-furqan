import { beforeEach, describe, expect, it, vi } from "vitest";

import { jsDelivrHadithAdapter } from "@/lib/hadith";

const response = (value: unknown) => Promise.resolve({
  json: async () => value,
  ok: true,
} as Response);

describe("jsDelivrHadithAdapter", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("maps provider reference and named grades without inference", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => response({ metadata: { name: "Jami At Tirmidhi", section: { "1": "Purification" } }, hadiths: [{ hadithnumber: 1, text: "Translation", grades: [{ name: "Named scholar", grade: "Sahih" }], reference: { book: 1, hadith: 1 } }] }))
      .mockImplementationOnce(() => response({ hadiths: [{ hadithnumber: 1, text: "نص عربي" }] }));

    await expect(jsDelivrHadithAdapter.one("tirmidhi", 1)).resolves.toMatchObject({
      arabic: "نص عربي",
      bookNumber: 1,
      collectionName: "Jami At Tirmidhi",
      grades: [{ grade: "Sahih", scholar: "Named scholar" }],
      referenceNumber: 1,
      text: "Translation",
    });
  });

  it("does not publish a record when the provider supplies no grade", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => response({ metadata: { name: "Collection", section: { "1": "Book" } }, hadiths: [{ hadithnumber: 1, text: "Translation", grades: [], reference: { book: 1, hadith: 1 } }] }))
      .mockImplementationOnce(() => response({ hadiths: [{ hadithnumber: 1, text: "نص عربي" }] }));

    await expect(jsDelivrHadithAdapter.one("collection", 1)).resolves.toBeNull();
  });

  it("keeps explicitly numbered book zero records", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockImplementationOnce(() => response({ metadata: { name: "Sunan Ibn Majah", section: { "0": "The Book of the Sunnah" } }, hadiths: [{ hadithnumber: 1, text: "Translation", grades: [{ name: "Named scholar", grade: "Sahih" }], reference: { book: 0, hadith: 1 } }] }))
      .mockImplementationOnce(() => response({ hadiths: [{ hadithnumber: 1, text: "نص عربي" }] }));

    await expect(jsDelivrHadithAdapter.one("ibnmajah", 1)).resolves.toMatchObject({ bookNumber: 0, sectionName: "The Book of the Sunnah" });
  });
});

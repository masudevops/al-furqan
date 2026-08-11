import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sunnahNowHadithAdapter } from "@/lib/hadith";

const response = (body: unknown) => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(body) } as Response);
const record = (overrides: Record<string, unknown> = {}) => ({
  id: 7,
  metadata: { volume: { id: 1 }, chapter: { id: 2, language: { en: { text: "Belief" } } } },
  language: { ar: { text: "نص عربي" }, en: { narrator: "Narrated by a named companion", text: "English source text" } },
  ...overrides,
});

describe("sunnahNowHadithAdapter", () => {
  beforeEach(() => { process.env.SUNNAH_NOW_API_KEY = "server-secret"; vi.stubGlobal("fetch", vi.fn()); });
  afterEach(() => { delete process.env.SUNNAH_NOW_API_KEY; vi.unstubAllGlobals(); });

  it("discovers the provider catalog with a server-only key header", async () => {
    vi.mocked(fetch).mockImplementationOnce(() => response([{ collection: "Sahih al-Bukhari", slug: "bukhari" }]));
    await expect(sunnahNowHadithAdapter.collections()).resolves.toEqual([{ id: "bukhari", name: "Sahih al-Bukhari", sections: [{ id: "all", name: "All available Hadith" }] }]);
    expect(vi.mocked(fetch).mock.calls[0][1]).toMatchObject({ headers: { "X-API-Key": "server-secret" } });
  });

  it("normalizes exact source fields without inventing a grade", async () => {
    vi.mocked(fetch).mockImplementationOnce(() => response([record()]));
    await expect(sunnahNowHadithAdapter.list("bukhari", "all")).resolves.toEqual([expect.objectContaining({ arabic: "نص عربي", authenticityContext: "Sahih al-Bukhari", bookNumber: 1, grades: [], hadithNumber: 7, narrator: "Narrated by a named companion", sectionName: "Belief", text: "English source text" })]);
  });

  it("omits incomplete religious records", async () => {
    vi.mocked(fetch).mockImplementationOnce(() => response([record({ language: { ar: { text: "" }, en: { text: "English only" } } })]));
    await expect(sunnahNowHadithAdapter.list("bukhari", "all")).resolves.toEqual([]);
  });

  it("fails before a request when the server key is missing", async () => {
    delete process.env.SUNNAH_NOW_API_KEY;
    vi.mocked(fetch).mockImplementationOnce(() => response(record()));
    await expect(sunnahNowHadithAdapter.one("bukhari", 7)).rejects.toThrow("API key is not configured");
  });
});

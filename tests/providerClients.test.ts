import { describe, expect, it, vi } from "vitest";
import { createHadithProvider } from "../src/core/providers/hadithProvider";
import { createIslamHouseProvider } from "../src/core/providers/islamHouseProvider";

function jsonFetch(body: unknown) {
  return vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => body,
  })) as unknown as typeof fetch;
}

describe("provider clients", () => {
  it("uses an injected Hadith gateway without provider credentials", async () => {
    const fetchImpl = jsonFetch({ chapters: [] });
    const provider = createHadithProvider({
      endpoint: "https://gateway.example/providers/hadith",
      fetchImpl,
    });

    await expect(provider.getChapters("sahih-bukhari")).resolves.toEqual([]);
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://gateway.example/providers/hadith?action=chapters&bookSlug=sahih-bukhari",
      expect.objectContaining({
        headers: { Accept: "application/json" },
      }),
    );
  });

  it("uses an injected IslamHouse gateway", async () => {
    const fetchImpl = jsonFetch({
      books: [],
      total: 0,
      hasMore: false,
    });
    const provider = createIslamHouseProvider({
      endpoint: "https://gateway.example/providers/islamhouse",
      fetchImpl,
    });

    await expect(provider.getBooks(1, 20, "en")).resolves.toEqual({
      books: [],
      total: 0,
      hasMore: false,
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://gateway.example/providers/islamhouse?action=books&page=1&limit=20&language=en",
      expect.any(Object),
    );
  });

  it("rejects invalid normalized responses", async () => {
    const provider = createHadithProvider({
      endpoint: "/api/providers/hadith",
      fetchImpl: jsonFetch({ chapters: [{ id: "invalid" }] }),
    });

    await expect(provider.getChapters("sahih-bukhari")).rejects.toThrow(
      "Invalid Hadith chapters response",
    );
  });
});

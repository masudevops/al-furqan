import { afterEach, describe, expect, it, vi } from "vitest";
import hadithHandler from "../api/providers/hadith";
import islamHouseHandler from "../api/providers/islamhouse";
import {
  normalizeHadithBooks,
  normalizeIslamHouseDetail,
} from "../api/_shared/providerValidation";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("server provider validation", () => {
  it("normalizes the Hadith provider payload", () => {
    expect(
      normalizeHadithBooks({
        status: 200,
        books: [
          {
            bookSlug: "sahih-bukhari",
            bookName: "Sahih al-Bukhari",
            hadithsCount: "7563",
          },
        ],
      }),
    ).toEqual([
      {
        bookSlug: "sahih-bukhari",
        bookName: "Sahih al-Bukhari",
        bookNameArabic: undefined,
        hadithCount: 7563,
      },
    ]);
  });

  it("normalizes both IslamHouse attachment field variants", () => {
    expect(
      normalizeIslamHouseDetail({
        data: {
          id: 10,
          title: "Book",
          description: "Description",
          source_lang: "en",
          attachments: [
            {
              url: "https://example.test/book.pdf",
              extension: "pdf",
              size: "1 MB",
            },
          ],
        },
      }),
    ).toEqual(
      expect.objectContaining({
        id: "10",
        downloads: [
          {
            url: "https://example.test/book.pdf",
            label: "PDF",
            size: "1 MB",
          },
        ],
      }),
    );
  });

  it("does not serve secret-backed providers without server credentials", async () => {
    vi.stubEnv("HADITH_API_KEY", "");
    vi.stubEnv("ISLAMHOUSE_API_KEY", "");

    const hadithResponse = await hadithHandler.fetch(
      new Request("https://example.test/api/providers/hadith?action=books"),
    );
    const islamHouseResponse = await islamHouseHandler.fetch(
      new Request("https://example.test/api/providers/islamhouse?action=books"),
    );

    expect(hadithResponse.status).toBe(503);
    expect(islamHouseResponse.status).toBe(503);
    await expect(hadithResponse.json()).resolves.toEqual({
      error: "Hadith provider is not configured",
    });
  });

  it("keeps the Hadith credential on the server side", async () => {
    vi.stubEnv("HADITH_API_KEY", "server-only-test-key");
    const upstreamFetch = vi.fn(async () =>
      new Response(
        JSON.stringify({
          status: 200,
          books: [
            {
              bookSlug: "sahih-bukhari",
              bookName: "Sahih al-Bukhari",
              hadithsCount: "7563",
            },
          ],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", upstreamFetch);

    const response = await hadithHandler.fetch(
      new Request("https://example.test/api/providers/hadith?action=books"),
    );

    expect(response.status).toBe(200);
    expect(upstreamFetch).toHaveBeenCalledWith(
      expect.stringContaining("apiKey=server-only-test-key"),
      expect.any(Object),
    );
    expect(JSON.stringify(await response.json())).not.toContain(
      "server-only-test-key",
    );
  });
});

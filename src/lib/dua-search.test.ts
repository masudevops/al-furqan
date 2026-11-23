import { afterEach, describe, expect, it, vi } from "vitest";
import { searchDuaTitles } from "@/lib/dua";

const reply = (data: unknown) => ({ ok: true, status: 200, json: async () => ({ statusCode: 200, data }) } as Response);

describe("searchDuaTitles", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("matches every word against titles and categories across all categories", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.endsWith("/categories")) return reply([{ name: "Morning Dhikr", slug: "morning-dhikr", total: 2 }, { name: "Daily Dua", slug: "daily-dua", total: 1 }]);
      if (url.endsWith("/morning-dhikr")) return reply([{ id: 1, title: "Ayatul Kursi", category: "morning-dhikr", categoryName: "Morning Dhikr" }, { id: 2, title: "Al-Ikhlas", category: "morning-dhikr", categoryName: "Morning Dhikr" }]);
      return reply([{ id: 9, title: "Before sleeping", category: "daily-dua", categoryName: "Daily Dua" }]);
    }));
    expect((await searchDuaTitles("kursi")).map((dua) => dua.id)).toEqual([1]);
    expect((await searchDuaTitles("morning ikhlas")).map((dua) => dua.id)).toEqual([2]);
    expect(await searchDuaTitles("  ")).toEqual([]);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchDuaPath, searchDuaTitles } from "@/lib/dua";

const reply = (data: unknown, status = 200) => ({ ok: status < 400, status, json: async () => data } as Response);
const entry = (title: string) => ({ title, arabic: "عربي", latin: "latin", translation: "translation", notes: "", fawaid: "", source: "Muslim 1" });

describe("Dua dataset", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    if (url.endsWith("/core/categories.json")) return reply({ id: [{ name: "Dzikir Pagi", slug: "morning-dhikr" }], en: [{ name: "Morning Dhikr", slug: "morning-dhikr" }, { name: "Daily Dua", slug: "daily-dua" }] });
    if (url.endsWith("/morning-dhikr/en.json")) return reply([entry("Ayatul Kursi"), entry("Al-Ikhlas")]);
    if (url.endsWith("/daily-dua/en.json")) return reply([entry("Before sleeping")]);
    return reply({}, 404);
  })));
  afterEach(() => vi.unstubAllGlobals());

  it("rebuilds the former API's English catalogue, lists and entries from the repository files", async () => {
    expect(await fetchDuaPath("/categories")).toEqual([{ name: "Morning Dhikr", slug: "morning-dhikr", total: 2 }, { name: "Daily Dua", slug: "daily-dua", total: 1 }]);
    expect(await fetchDuaPath("/categories/morning-dhikr")).toEqual([{ id: 1, title: "Ayatul Kursi", category: "morning-dhikr", categoryName: "Morning Dhikr" }, { id: 2, title: "Al-Ikhlas", category: "morning-dhikr", categoryName: "Morning Dhikr" }]);
    expect(await fetchDuaPath("/categories/morning-dhikr/2")).toEqual({ id: 2, category: "morning-dhikr", categoryName: "Morning Dhikr", ...entry("Al-Ikhlas") });
  });

  it("fails closed for unknown categories, entries and an unavailable source", async () => {
    await expect(fetchDuaPath("/categories/unknown")).rejects.toThrow();
    await expect(fetchDuaPath("/categories/morning-dhikr/3")).rejects.toThrow();
    await expect(fetchDuaPath("/categories/morning-dhikr/0")).rejects.toThrow();
    vi.mocked(fetch).mockImplementation(async () => reply({}, 503));
    await expect(fetchDuaPath("/categories")).rejects.toThrow("Dua source unavailable");
  });

  it("matches every search word against titles and categories across all categories", async () => {
    expect((await searchDuaTitles("kursi")).map((dua) => dua.id)).toEqual([1]);
    expect((await searchDuaTitles("morning ikhlas")).map((dua) => dua.id)).toEqual([2]);
    expect(await searchDuaTitles("  ")).toEqual([]);
  });
});

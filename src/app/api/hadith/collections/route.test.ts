import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/hadith/collections/route";

describe("Hadith collections route", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("returns the live normalized catalog", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ success: true, data: { collections: [{ key: "bukhari", name: "Sahih al-Bukhari", total_hadiths: 7580 }] } }) } as Response)));
    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ error: null, items: [{ id: "bukhari", name: "Sahih al-Bukhari", total: 7580 }] });
  });
});

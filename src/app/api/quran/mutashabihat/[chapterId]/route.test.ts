import { afterEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const reply = (status: number, body: unknown) => ({ ok: status < 400, status, json: async () => body } as Response);

describe("Similar Ayahs route", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("treats the source's 404 for a Surah with no similar Ayahs as an empty result", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(404, { success: false, error: "Not found", message: "No mutashabihat (similar verses) found in surah 112." })));
    const response = await GET(new Request("http://x"), { params: { chapterId: "112" } });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ error: null, items: [] });
  });

  it("still reports a real outage", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => reply(500, { success: false })));
    const response = await GET(new Request("http://x"), { params: { chapterId: "2" } });
    expect(response.status).toBe(502);
  });
});

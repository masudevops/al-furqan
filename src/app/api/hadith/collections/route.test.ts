import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/hadith/collections/route";

describe("disabled Hadith route", () => {
  it("returns 503 without publishing provider data", async () => {
    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Hadith is disabled pending verified Sunnah.com integration.",
      items: [],
    });
  });
});

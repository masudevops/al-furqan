import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/hadith/collections/route";

describe("disabled Hadith route", () => {
  it("returns 503 without publishing provider data", async () => {
    const response = await GET();

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: "Sunnah browsing is not enabled for this deployment.",
      items: [],
    });
  });
});

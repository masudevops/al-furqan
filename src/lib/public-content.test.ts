import { describe, expect, it } from "vitest";

import { createPublicContentSession, publicContentJson } from "@/lib/public-content";

describe("public Quran content responses", () => {
  it("uses an anonymous session for public source data", () => {
    expect(createPublicContentSession()).toEqual({
      authError: null,
      flashNotice: null,
      oauth: null,
      oidcLogoutIdTokenHint: null,
      userSession: null,
    });
  });

  it("allows short edge caching for successful public content", () => {
    const response = publicContentJson({ ok: true });
    expect(response.headers.get("cache-control")).toContain("s-maxage=3600");
    expect(response.headers.get("cache-control")).toContain("stale-while-revalidate=86400");
  });

  it("caches stable content longer but never past Quran.Foundation's one-week limit", () => {
    const header = publicContentJson({ ok: true }, 200, "stable").headers.get("cache-control") ?? "";
    const seconds = (name: string) => Number(header.match(new RegExp(`${name}=(\\d+)`))?.[1]);
    expect(seconds("s-maxage")).toBe(86400);
    expect(seconds("s-maxage") + seconds("stale-while-revalidate")).toBeLessThanOrEqual(7 * 24 * 60 * 60);
    expect(publicContentJson({ error: "Unavailable" }, 502, "stable").headers.get("cache-control")).toBe("no-store");
  });

  it("never caches source failures", () => {
    const response = publicContentJson({ error: "Unavailable" }, 502);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});

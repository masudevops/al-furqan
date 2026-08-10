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

  it("never caches source failures", () => {
    const response = publicContentJson({ error: "Unavailable" }, 502);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});

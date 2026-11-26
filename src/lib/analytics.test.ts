import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryAnalyticsStore, deviceOf, isBot, lastDays, lastMonths, normalizePath, referrerHost, sectionOf, visitorHash } from "@/lib/analytics";
import { createInsightsToken, passwordMatches, validInsightsToken } from "@/lib/insights-auth";

describe("page view analytics", () => {
  it("counts only the site's own pages, without query strings", () => {
    expect(normalizePath("/quran/2/255?tafsir=169#x")).toBe("/quran/2/255");
    expect(normalizePath("/dua/hisnul-muslim/28/")).toBe("/dua/hisnul-muslim/28");
    expect(normalizePath("/")).toBe("/");
    expect(normalizePath("/wp-admin/setup.php")).toBeNull();
    expect(normalizePath("/quran/<script>")).toBeNull();
    expect(normalizePath(42)).toBeNull();
    expect(sectionOf("/sunnah/bukhari/book/1")).toBe("Sunnah");
  });

  it("keeps only another site's host as the referrer, and a coarse device class", () => {
    expect(referrerHost("https://www.google.com/search?q=quran", "al-furqan.app")).toBe("google.com");
    expect(referrerHost("https://al-furqan.app/quran", "al-furqan.app")).toBeNull();
    expect(referrerHost("not a url", "al-furqan.app")).toBeNull();
    expect([deviceOf(375), deviceOf(820), deviceOf(1440), deviceOf("x")]).toEqual(["mobile", "tablet", "desktop", "desktop"]);
  });

  it("skips bots and empty user agents", () => {
    expect(isBot("Mozilla/5.0 (compatible; Googlebot/2.1)")).toBe(true);
    expect(isBot("")).toBe(true);
    expect(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1")).toBe(false);
  });

  it("stores daily totals only and estimates visitors per day", async () => {
    const store = new MemoryAnalyticsStore();
    const [yesterday, today] = lastDays(2, new Date("2026-11-26T10:00:00Z"));
    expect([yesterday, today]).toEqual(["2026-11-25", "2026-11-26"]);
    const hit = (day: string, path: string, visitor: string) => store.record({ day, path, section: sectionOf(path)!, referrer: path === "/" ? "google.com" : null, device: "mobile", country: "GB", visitor });
    const salt = await store.salt(today);
    expect(await store.salt(today)).toBe(salt);
    const reader = visitorHash(salt, "203.0.113.9", "Safari");
    expect(reader).toMatch(/^[a-f0-9]{32}$/);
    expect(reader).not.toContain("203.0.113.9");
    await hit(yesterday, "/", "a");
    await hit(today, "/", reader);
    await hit(today, "/quran/1", reader);
    await hit(today, "/sunnah", "b");
    const summary = await store.summary([yesterday, today]);
    expect(summary.views).toBe(4);
    expect(summary.days).toEqual([{ day: yesterday, views: 1, visitors: 1 }, { day: today, views: 3, visitors: 2 }]);
    expect(summary.visitors).toBe(3);
    expect(summary.sections).toEqual([{ key: "Home", count: 2 }, { key: "Quran", count: 1 }, { key: "Sunnah", count: 1 }]);
    expect(summary.referrers).toEqual([{ key: "google.com", count: 2 }]);
    expect(summary.countries).toEqual([{ key: "GB", count: 4 }]);
  });

  it("keeps monthly and all-time totals, counting each visitor once per day", async () => {
    const store = new MemoryAnalyticsStore();
    const hit = (day: string, visitor: string) => store.record({ day, path: "/", section: "Home", referrer: null, device: "desktop", country: null, visitor });
    await hit("2026-10-31", "a");
    await hit("2026-11-01", "a");
    await hit("2026-11-01", "a");
    await hit("2026-11-02", "b");
    const months = lastMonths(3, new Date("2026-11-26T00:00:00Z"));
    expect(months).toEqual(["2026-09", "2026-10", "2026-11"]);
    await expect(store.totals(months)).resolves.toEqual({
      since: "2026-10-31", views: 4, visitors: 3,
      months: [{ month: "2026-09", views: 0, visitors: 0 }, { month: "2026-10", views: 1, visitors: 1 }, { month: "2026-11", views: 3, visitors: 2 }],
    });
    expect(lastMonths(2, new Date("2027-01-10T00:00:00Z"))).toEqual(["2026-12", "2027-01"]);
  });
});

describe("insights dashboard access", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is closed without a password configured", () => {
    vi.stubEnv("SESSION_SECRET", "s".repeat(32));
    vi.stubEnv("INSIGHTS_PASSWORD", "");
    expect(passwordMatches("")).toBe(false);
    expect(validInsightsToken(createInsightsToken().value)).toBe(false);
  });

  it("checks the password and accepts only unexpired, signed tokens", () => {
    vi.stubEnv("SESSION_SECRET", "s".repeat(32));
    vi.stubEnv("INSIGHTS_PASSWORD", "correct horse");
    expect(passwordMatches("correct horse")).toBe(true);
    expect(passwordMatches("wrong")).toBe(false);
    const now = Date.parse("2026-11-26T00:00:00Z");
    const { value } = createInsightsToken(now);
    expect(validInsightsToken(value, now)).toBe(true);
    expect(validInsightsToken(value, now + 31 * 86_400_000)).toBe(false);
    const [expires] = value.split(".");
    expect(validInsightsToken(`${Number(expires) + 999}.${value.split(".")[1]}`, now)).toBe(false);
    expect(validInsightsToken("garbage", now)).toBe(false);
  });
});

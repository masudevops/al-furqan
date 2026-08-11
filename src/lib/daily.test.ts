import { describe, expect, it } from "vitest";
import { dailyIndex, utcDayKey } from "@/lib/daily";

describe("daily content selection", () => {
  it("is stable for the same day and salt", () => {
    expect(dailyIndex("2026-08-11", 100, "verse")).toBe(dailyIndex("2026-08-11", 100, "verse"));
  });

  it("stays within the available range", () => {
    expect(dailyIndex("2026-08-11", 7, "hadith")).toBeGreaterThanOrEqual(0);
    expect(dailyIndex("2026-08-11", 7, "hadith")).toBeLessThan(7);
  });

  it("uses a UTC calendar key", () => {
    expect(utcDayKey(new Date("2026-08-11T23:59:59Z"))).toBe("2026-08-11");
  });
});

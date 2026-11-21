import { describe, expect, it } from "vitest";

import { clockTime, prayerProgress } from "./salah-times-page";

const today = { timings: { Fajr: "05:00", Dhuhr: "12:00", Asr: "15:00", Maghrib: "18:00", Isha: "20:00" } };

describe("Salah Times display helpers", () => {
  it("drops the source's zone suffix from clock times", () => {
    expect(clockTime("05:20 (GMT)")).toBe("05:20");
    expect(clockTime("11:44")).toBe("11:44");
    expect(clockTime(undefined)).toBe("");
  });

  it("measures progress from the previous prayer to the next", () => {
    const now = new Date(2026, 10, 21, 13, 30);
    expect(prayerProgress(today, { name: "Asr", ms: 90 * 60_000 }, now)).toBeCloseTo(0.5);
  });

  it("counts from last night's Isha before Fajr", () => {
    const now = new Date(2026, 10, 21, 3, 0);
    expect(prayerProgress(today, { name: "Fajr", ms: 120 * 60_000 }, now)).toBeCloseTo(7 / 9);
  });

  it("is empty without data", () => {
    expect(prayerProgress(null, null, new Date())).toBe(0);
  });
});

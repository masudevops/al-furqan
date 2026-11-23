import { describe, expect, it } from "vitest";
import { buildPrayerCalendar, zonedTimeToUtc } from "./prayer-calendar";

const day = (gregorian: string, fajr = "05:20 (GMT)") => ({ gregorian, timings: { Fajr: fajr, Sunrise: "06:54 (GMT)", Dhuhr: "11:44 (GMT)", Asr: "14:08 (GMT)", Maghrib: "16:33 (GMT)", Isha: "18:08 (GMT)" } });

describe("prayer calendar", () => {
  it("converts a location's wall-clock time to UTC, including daylight saving", () => {
    expect(zonedTimeToUtc(2026, 11, 1, 5, 20, "Europe/London").toISOString()).toBe("2026-11-01T05:20:00.000Z");
    expect(zonedTimeToUtc(2026, 7, 1, 4, 0, "Europe/London").toISOString()).toBe("2026-07-01T03:00:00.000Z");
    expect(zonedTimeToUtc(2026, 11, 1, 5, 0, "Asia/Dhaka").toISOString()).toBe("2026-10-31T23:00:00.000Z");
  });

  it("writes the five prayers with an alert at each, only inside the window and after now", () => {
    const { ics, events } = buildPrayerCalendar({
      days: [day("31-10-2026"), day("01-11-2026"), day("02-11-2026"), day("03-11-2026")],
      timezone: "Europe/London", label: "London, UK", settings: "ISNA, Shafi Asr",
      from: new Date("2026-11-01T00:00:00Z"), count: 2, now: new Date("2026-11-01T12:00:00Z"),
    });
    // 1 Nov after noon: Asr, Maghrib, Isha; 2 Nov: all five; 31 Oct and 3 Nov are outside the window.
    expect(events).toBe(8);
    expect(ics).toContain("DTSTART:20261101T140800Z");
    expect(ics).not.toContain("20261101T052000Z");
    expect(ics).not.toContain("20261103");
    expect(ics.match(/BEGIN:VALARM/g)).toHaveLength(8);
    expect(ics).toContain("SUMMARY:Isha");
    expect(ics).toContain("London\\, UK");
    expect(ics.startsWith("BEGIN:VCALENDAR\r\n")).toBe(true);
    expect(ics.split("\r\n").every((line) => line.length <= 75)).toBe(true);
  });
});

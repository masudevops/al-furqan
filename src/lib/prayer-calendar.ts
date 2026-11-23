// Builds an iCalendar (.ics) file of prayer times so the device's own calendar gives reminders:
// no push server, no account and nothing sent anywhere. Times are the source's (AlAdhan) for the location,
// converted from the location's timezone to UTC so every calendar app places them correctly.

export const CALENDAR_PRAYERS = ["Fajr", "Dhuhr", "Asr", "Maghrib", "Isha"] as const;
export type CalendarDay = { gregorian: string; timings: Record<string, string> };
export type PrayerCalendarOptions = { days: CalendarDay[]; timezone: string; label: string; settings: string; from: Date; count: number; now?: Date };

// Offset of `timezone` from UTC at the given instant, in milliseconds.
const zoneOffset = (instant: number, timezone: string) => {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: timezone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }).formatToParts(new Date(instant));
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second")) - instant;
};

export const zonedTimeToUtc = (year: number, month: number, day: number, hour: number, minute: number, timezone: string) => {
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  // Two passes settle the offset around daylight-saving changes.
  let utc = wall - zoneOffset(wall, timezone);
  utc = wall - zoneOffset(utc, timezone);
  return new Date(utc);
};

const icsTime = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const escapeText = (value: string) => value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
// Lines longer than 75 characters are folded with a leading space, as RFC 5545 requires.
const fold = (line: string) => line.length <= 74 ? line : line.match(/.{1,73}/g)!.join("\r\n ");

export function buildPrayerCalendar({ days, timezone, label, settings, from, count, now = new Date() }: PrayerCalendarOptions) {
  const start = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const end = start + count * 86_400_000;
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Al-Furqan//Prayer Times//EN", "CALSCALE:GREGORIAN", "METHOD:PUBLISH", `X-WR-CALNAME:${escapeText(`Prayer times · ${label}`)}`];
  let events = 0;
  for (const day of days) {
    const [dd, mm, yyyy] = day.gregorian.split("-").map(Number);
    if (!dd || !mm || !yyyy) continue;
    const dayStart = Date.UTC(yyyy, mm - 1, dd);
    if (dayStart < start || dayStart >= end) continue;
    for (const prayer of CALENDAR_PRAYERS) {
      const match = day.timings[prayer]?.match(/^(\d{1,2}):(\d{2})/);
      if (!match) continue;
      const at = zonedTimeToUtc(yyyy, mm, dd, Number(match[1]), Number(match[2]), timezone);
      if (at.getTime() < now.getTime()) continue;
      lines.push(
        "BEGIN:VEVENT",
        `UID:${yyyy}${String(mm).padStart(2, "0")}${String(dd).padStart(2, "0")}-${prayer.toLowerCase()}-${escapeText(label).replace(/\W+/g, "-").toLowerCase()}@al-furqan.app`,
        `DTSTAMP:${icsTime(now)}`,
        `DTSTART:${icsTime(at)}`,
        `DTEND:${icsTime(new Date(at.getTime() + 15 * 60_000))}`,
        `SUMMARY:${prayer}`,
        `DESCRIPTION:${escapeText(`${prayer} prayer time for ${label}. ${settings}. Times from AlAdhan via Al-Furqan.`)}`,
        "TRANSP:TRANSPARENT",
        "BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${prayer}`, "TRIGGER:PT0M", "END:VALARM",
        "END:VEVENT",
      );
      events += 1;
    }
  }
  lines.push("END:VCALENDAR");
  return { ics: lines.map(fold).join("\r\n") + "\r\n", events };
}

import "server-only";
import crypto from "node:crypto";
import { createClient, type RedisClientType } from "redis";

// First-party, cookieless page counts. Only aggregates are stored (daily detail for 400 days; monthly and all-time
// view and visitor counters kept for good): no IP address, user agent, cookie or per-person history. Unique visitors are estimated from a hash of IP + user agent with a
// random salt that exists for one day and is then deleted, so the hashes can't be recomputed or linked across days.

export const RETENTION_DAYS = 400;
const PREFIX = "af:stats:";
const TTL_SECONDS = (RETENTION_DAYS + 1) * 86_400;
const TOP_LIMIT = 50;

export type Device = "mobile" | "tablet" | "desktop";
export interface PageHit { day: string; path: string; section: string; referrer: string | null; device: Device; country: string | null; visitor: string }
export interface DaySeries { day: string; views: number; visitors: number }
export interface Ranked { key: string; count: number }
// `visitors` adds up each day's unique visitors: with a salt that changes daily, the same person counts once per day they visit.
export interface MonthSeries { month: string; views: number; visitors: number }
// Monthly and all-time visitors add up daily visitors, like `InsightsSummary.visitors`. `since` is the first day anything was counted.
export interface InsightsTotals { since: string | null; views: number; visitors: number; months: MonthSeries[] }
export interface InsightsSummary { days: DaySeries[]; views: number; visitors: number; pages: Ranked[]; sections: Ranked[]; referrers: Ranked[]; countries: Ranked[]; devices: Ranked[] }

// Sections of the site; anything else (bots probing /wp-admin and the like) is not counted.
const SECTIONS: Array<[RegExp, string]> = [
  [/^\/$/, "Home"], [/^\/quran(\/|$)/, "Quran"], [/^\/read(\/|$)/, "Quran"], [/^\/sunnah(\/|$)/, "Sunnah"], [/^\/hadith(\/|$)/, "Sunnah"],
  [/^\/dua(\/|$)/, "Dua"], [/^\/salah-times(\/|$)/, "Salah Times"], [/^\/masjid-finder(\/|$)/, "Masjid Finder"], [/^\/qibla(\/|$)/, "Qibla"],
  [/^\/learn(\/|$)/, "Learn"], [/^\/plan(\/|$)/, "Reading plan"], [/^\/search(\/|$)/, "Search"], [/^\/library(\/|$)/, "Saved Library"],
  [/^\/settings(\/|$)/, "Settings"], [/^\/goals(\/|$)/, "Goals"], [/^\/reflect(\/|$)/, "Reflect"],
];

export function sectionOf(path: string): string | null {
  return SECTIONS.find(([pattern]) => pattern.test(path))?.[1] ?? null;
}

// A clean path without query or fragment, or null when it isn't one of the site's pages.
export function normalizePath(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const path = value.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  if (path.length > 120 || !/^\/[A-Za-z0-9\-/_.:]*$/.test(path)) return null;
  return sectionOf(path) ? path : null;
}

// Only the referring site's host, and only when it's another site.
export function referrerHost(value: unknown, ownHost: string | null): string | null {
  if (typeof value !== "string" || !value) return null;
  try {
    const host = new URL(value).hostname.replace(/^www\./, "").toLowerCase();
    if (!host || host === ownHost?.replace(/^www\./, "").toLowerCase()) return null;
    return host.slice(0, 80);
  } catch {
    return null;
  }
}

export function deviceOf(width: unknown): Device {
  const value = Number(width);
  return value > 0 && value < 768 ? "mobile" : value >= 768 && value < 1100 ? "tablet" : "desktop";
}

export const isBot = (userAgent: string) => !userAgent || /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|curl|wget|python|httpclient|facebookexternalhit|embedly/i.test(userAgent);

export const dayKey = (date = new Date()) => date.toISOString().slice(0, 10);

export interface AnalyticsStore { salt(day: string): Promise<string>; record(hit: PageHit): Promise<void>; summary(days: string[]): Promise<InsightsSummary>; totals(months: string[]): Promise<InsightsTotals> }

export const visitorHash = (salt: string, ip: string, userAgent: string) => crypto.createHash("sha256").update(`${salt}|${ip}|${userAgent}`).digest("hex").slice(0, 32);

const rank = (totals: Map<string, number>, limit = TOP_LIMIT): Ranked[] => Array.from(totals).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key)).slice(0, limit);
const add = (totals: Map<string, number>, entries: Record<string, string | number>) => { for (const [key, value] of Object.entries(entries)) totals.set(key, (totals.get(key) ?? 0) + Number(value)); };
const sumVisitors = (series: DaySeries[]) => series.reduce((sum, day) => sum + day.visitors, 0);
const FIELDS = ["pages", "sections", "referrers", "countries", "devices"] as const;
type Field = (typeof FIELDS)[number];
const fieldValues = (hit: PageHit): Record<Field, string | null> => ({ pages: hit.path, sections: hit.section, referrers: hit.referrer, countries: hit.country, devices: hit.device });

class RedisAnalyticsStore implements AnalyticsStore {
  private client: RedisClientType;
  private connecting: Promise<void> | null = null;
  constructor(url: string) {
    this.client = createClient({ url });
    this.client.on("error", (error) => console.error("Redis analytics store error", error));
  }
  private async ready() {
    if (this.client.isOpen) return;
    this.connecting ??= this.client.connect().then(() => undefined).finally(() => { this.connecting = null; });
    await this.connecting;
  }
  async salt(day: string) {
    await this.ready();
    const key = `${PREFIX}salt:${day}`;
    // Kept just past the end of its day, then gone for good.
    await this.client.set(key, crypto.randomBytes(16).toString("hex"), { NX: true, EX: 2 * 86_400 });
    return (await this.client.get(key)) ?? "";
  }
  async record(hit: PageHit) {
    await this.ready();
    const base = `${PREFIX}${hit.day}:`;
    const month = `${PREFIX}month:${hit.day.slice(0, 7)}:`;
    // A visitor's first view of the day also counts towards the month and all-time visitor totals.
    const newToday = Boolean(await this.client.pfAdd(`${base}visitors`, hit.visitor));
    const multi = this.client.multi().expire(`${base}visitors`, TTL_SECONDS).incr(`${base}views`).expire(`${base}views`, TTL_SECONDS)
      .incr(`${month}views`).incr(`${PREFIX}total:views`).set(`${PREFIX}since`, hit.day, { NX: true });
    if (newToday) multi.incr(`${month}visitors`).incr(`${PREFIX}total:visitors`);
    for (const [field, value] of Object.entries(fieldValues(hit))) if (value) multi.hIncrBy(`${base}${field}`, value, 1).expire(`${base}${field}`, TTL_SECONDS);
    await multi.exec();
  }
  async summary(days: string[]) {
    await this.ready();
    const series = await Promise.all(days.map(async (day) => ({ day, views: Number(await this.client.get(`${PREFIX}${day}:views`) ?? 0), visitors: await this.client.pfCount(`${PREFIX}${day}:visitors`) })));
    const totals = Object.fromEntries(FIELDS.map((field) => [field, new Map<string, number>()])) as Record<Field, Map<string, number>>;
    await Promise.all(days.flatMap((day) => FIELDS.map(async (field) => add(totals[field], await this.client.hGetAll(`${PREFIX}${day}:${field}`)))));
    return { days: series, views: series.reduce((sum, day) => sum + day.views, 0), visitors: sumVisitors(series), ...Object.fromEntries(FIELDS.map((field) => [field, rank(totals[field])])) } as InsightsSummary;
  }
  async totals(months: string[]) {
    await this.ready();
    const count = async (key: string) => Number(await this.client.get(`${PREFIX}${key}`) ?? 0);
    const [since, views, visitors, series] = await Promise.all([
      this.client.get(`${PREFIX}since`), count("total:views"), count("total:visitors"),
      Promise.all(months.map(async (month) => ({ month, views: await count(`month:${month}:views`), visitors: await count(`month:${month}:visitors`) }))),
    ]);
    return { since, views, visitors, months: series };
  }
}

// Local development only: the same aggregates in memory, lost on restart.
export class MemoryAnalyticsStore implements AnalyticsStore {
  private salts = new Map<string, string>();
  private views = new Map<string, number>();
  private visitors = new Map<string, Set<string>>();
  private fields = new Map<string, Map<string, number>>();
  async salt(day: string) { if (!this.salts.has(day)) this.salts.set(day, crypto.randomBytes(16).toString("hex")); return this.salts.get(day)!; }
  private monthViews = new Map<string, number>();
  private monthVisitors = new Map<string, number>();
  private since: string | null = null;
  async record(hit: PageHit) {
    this.views.set(hit.day, (this.views.get(hit.day) ?? 0) + 1);
    if (!this.visitors.has(hit.day)) this.visitors.set(hit.day, new Set());
    const month = hit.day.slice(0, 7);
    this.monthViews.set(month, (this.monthViews.get(month) ?? 0) + 1);
    if (!this.visitors.get(hit.day)!.has(hit.visitor)) this.monthVisitors.set(month, (this.monthVisitors.get(month) ?? 0) + 1);
    this.since ??= hit.day;
    this.visitors.get(hit.day)!.add(hit.visitor);
    for (const [field, value] of Object.entries(fieldValues(hit))) {
      if (!value) continue;
      const key = `${hit.day}:${field}`;
      if (!this.fields.has(key)) this.fields.set(key, new Map());
      add(this.fields.get(key)!, { [value]: 1 });
    }
  }
  async summary(days: string[]) {
    const series = days.map((day) => ({ day, views: this.views.get(day) ?? 0, visitors: this.visitors.get(day)?.size ?? 0 }));
    const ranked = Object.fromEntries(FIELDS.map((field) => { const totals = new Map<string, number>(); for (const day of days) add(totals, Object.fromEntries(this.fields.get(`${day}:${field}`) ?? [])); return [field, rank(totals)]; }));
    return { days: series, views: series.reduce((sum, day) => sum + day.views, 0), visitors: sumVisitors(series), ...ranked } as InsightsSummary;
  }
  async totals(months: string[]) {
    const sum = (values: Map<string, number>) => Array.from(values.values()).reduce((total, value) => total + value, 0);
    return { since: this.since, views: sum(this.monthViews), visitors: sum(this.monthVisitors), months: months.map((month) => ({ month, views: this.monthViews.get(month) ?? 0, visitors: this.monthVisitors.get(month) ?? 0 })) };
  }
}

let store: AnalyticsStore | null = null;
export const getAnalyticsStore = (): AnalyticsStore => (store ??= process.env.REDIS_URL?.trim() ? new RedisAnalyticsStore(process.env.REDIS_URL.trim()) : new MemoryAnalyticsStore());

// The last `count` UTC days, oldest first, ending today.
export function lastDays(count: number, today = new Date()): string[] {
  return Array.from({ length: count }, (_, index) => dayKey(new Date(today.getTime() - (count - 1 - index) * 86_400_000)));
}

// The last `count` calendar months (UTC) as YYYY-MM, oldest first, ending with this month.
export function lastMonths(count: number, today = new Date()): string[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - (count - 1 - index), 1));
    return date.toISOString().slice(0, 7);
  });
}

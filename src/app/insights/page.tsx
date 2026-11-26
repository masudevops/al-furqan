import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Page, PageHeader } from "@/components/ui";
import { RETENTION_DAYS, getAnalyticsStore, lastDays, lastMonths, type InsightsSummary, type InsightsTotals, type Ranked } from "@/lib/analytics";
import { INSIGHTS_COOKIE, insightsEnabled, validInsightsToken } from "@/lib/insights-auth";
import styles from "./insights.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Insights", robots: { index: false, follow: false } };

const RANGES = [7, 30, 90] as const;
const COUNTRY_NAMES = (() => { try { return new Intl.DisplayNames(["en"], { type: "region" }); } catch { return null; } })();
const countryName = (code: string) => COUNTRY_NAMES?.of(code) ?? code;
const number = (value: number) => value.toLocaleString("en");
const monthName = (month: string, style: "short" | "long" = "short") => new Date(`${month}-15T12:00:00Z`).toLocaleDateString("en", { month: style, year: style === "long" ? "numeric" : "2-digit", timeZone: "UTC" });
const longDate = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString("en", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const shortDate = (day: string) => new Date(`${day}T12:00:00Z`).toLocaleDateString("en", { day: "numeric", month: "short", timeZone: "UTC" });

function Login({ failed }: { failed: boolean }) {
  return <Page narrow>
    <PageHeader kicker="Owner only" kickerIcon="info" title="Insights" description="Page visit counts for Al-Furqan. Enter the dashboard password." />
    <form className={styles.login} method="post" action="/api/insights/login">
      <label htmlFor="insights-password">Password</label>
      <input id="insights-password" name="password" type="password" autoComplete="current-password" required autoFocus />
      {failed ? <p className={styles.error} role="alert">That password didn&apos;t match.</p> : null}
      <button type="submit">Open dashboard</button>
    </form>
  </Page>;
}

function Chart({ summary }: { summary: InsightsSummary }) {
  const max = Math.max(1, ...summary.days.map((day) => day.views));
  const width = 100 / summary.days.length;
  return <figure className={styles.chart} aria-label="Page views per day">
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" role="img" aria-label={`Daily page views, highest ${number(max)}`}>
      {summary.days.map((day, index) => {
        const height = (day.views / max) * 38;
        return <rect key={day.day} x={index * width + width * 0.15} y={40 - height} width={width * 0.7} height={Math.max(height, day.views ? 0.6 : 0)} rx={0.6}><title>{`${shortDate(day.day)}: ${number(day.views)} views, ${number(day.visitors)} visitors`}</title></rect>;
      })}
    </svg>
    <figcaption><span>{shortDate(summary.days[0].day)}</span><span>Busiest day: {number(max)} {max === 1 ? "view" : "views"}</span><span>{shortDate(summary.days.at(-1)!.day)}</span></figcaption>
  </figure>;
}

function Months({ totals }: { totals: InsightsTotals }) {
  const max = Math.max(1, ...totals.months.map((month) => month.views));
  return <section className={styles.card} aria-labelledby="months-title">
    <h2 id="months-title">By month</h2>
    <div className={styles.months} aria-hidden="true">{totals.months.map((month) => <span key={month.month} title={`${monthName(month.month, "long")}: ${number(month.views)} views`}>
      <i style={{ height: `${Math.max(month.views ? 3 : 0, (month.views / max) * 100)}%` }} />
      <small>{new Date(`${month.month}-15T12:00:00Z`).toLocaleDateString("en", { month: "short", timeZone: "UTC" })}<em> {month.month.slice(2, 4)}</em></small>
    </span>)}</div>
    <table className={styles.table}>
      <thead><tr><th scope="col">Month</th><th scope="col">Page views</th><th scope="col">Visitors</th></tr></thead>
      <tbody>{[...totals.months].reverse().map((month) => <tr key={month.month}><th scope="row">{monthName(month.month, "long")}</th><td>{number(month.views)}</td><td>{number(month.visitors)}</td></tr>)}</tbody>
      <tfoot><tr><th scope="row">All time</th><td>{number(totals.views)}</td><td>{number(totals.visitors)}</td></tr></tfoot>
    </table>
  </section>;
}

function List({ title, items, total, label = (key: string) => key, empty }: { title: string; items: Ranked[]; total: number; label?: (key: string) => string; empty: string }) {
  return <section className={styles.card} aria-labelledby={`list-${title}`}>
    <h2 id={`list-${title}`}>{title}</h2>
    {items.length ? <ol className={styles.list}>{items.slice(0, 12).map((item) => <li key={item.key}>
      <span className={styles.bar} style={{ width: `${Math.max(2, (item.count / Math.max(1, items[0].count)) * 100)}%` }} aria-hidden="true" />
      <span className={styles.key}>{label(item.key)}</span>
      <span className={styles.count}>{number(item.count)}<small>{total ? ` · ${Math.round((item.count / total) * 100)}%` : ""}</small></span>
    </li>)}</ol> : <p className={styles.muted}>{empty}</p>}
  </section>;
}

export default async function InsightsPage({ searchParams }: { searchParams: { days?: string; error?: string } }) {
  if (!insightsEnabled()) notFound();
  if (!validInsightsToken(cookies().get(INSIGHTS_COOKIE)?.value)) return <Login failed={searchParams.error === "1"} />;
  const range = RANGES.find((value) => String(value) === searchParams.days) ?? 30;
  let summary: InsightsSummary | null = null;
  let totals: InsightsTotals | null = null;
  try { [summary, totals] = await Promise.all([getAnalyticsStore().summary(lastDays(range)), getAnalyticsStore().totals(lastMonths(12))]); } catch (error) { console.error("Insights summary failed", { message: error instanceof Error ? error.message : "Unknown error" }); }
  const today = summary?.days.at(-1);
  return <Page>
    <PageHeader kicker="Owner only" kickerIcon="info" title="Insights" description={`Page visits for the last ${range} days, counted without cookies or third parties. Days are UTC.`}
      actions={<form method="post" action="/api/insights/login"><input type="hidden" name="action" value="logout" /><button className={styles.logout} type="submit">Sign out</button></form>} />
    <nav className={styles.ranges} aria-label="Date range">{RANGES.map((value) => <Link key={value} href={`/insights?days=${value}`} aria-current={value === range ? "page" : undefined}>{value} days</Link>)}</nav>
    {!summary || !totals ? <p className={styles.error} role="alert">The visit counts are unavailable right now.</p> : <>
      <div className={styles.stats}>
        <div><span>Page views</span><strong>{number(summary.views)}</strong></div>
        <div><span>Visitors</span><strong>{number(summary.visitors)}</strong><small>counted once per day</small></div>
        <div><span>Today</span><strong>{number(today?.views ?? 0)}</strong><small>{number(today?.visitors ?? 0)} {today?.visitors === 1 ? "visitor" : "visitors"}</small></div>
        <div><span>All time</span><strong>{number(totals.views)}</strong><small>{totals.since ? `views since ${longDate(totals.since)}` : "no views yet"}</small></div>
      </div>
      <Chart summary={summary} />
      <Months totals={totals} />
      <div className={`${styles.grid} ${styles.gridSpaced}`}>
        <List title="Sections" items={summary.sections} total={summary.views} empty="No visits yet." />
        <List title="Top pages" items={summary.pages} total={summary.views} empty="No visits yet." />
        <List title="Referring sites" items={summary.referrers} total={0} empty="No visits from other sites yet." />
        <List title="Countries" items={summary.countries} total={summary.views} label={countryName} empty="No country information yet." />
        <List title="Devices" items={summary.devices} total={summary.views} label={(key) => key[0].toUpperCase() + key.slice(1)} empty="No visits yet." />
      </div>
    </>}
    <p className={styles.note}>How this works: each page view is counted by our own server. No cookies, IP addresses or browsing histories are stored, only totals: daily detail for {RETENTION_DAYS} days, and monthly and all-time counts for good. A visitor is estimated per day from a hash with a salt that is deleted after a day, so the same person on two days counts twice. Visitors with Do Not Track or Global Privacy Control, and known bots, aren&apos;t counted.</p>
  </Page>;
}

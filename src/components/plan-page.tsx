"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";

import ContentState from "./content-state";
import { Button, ButtonLink, Icon, Page, PageHeader } from "@/components/ui";
import { MUSHAF_PAGES, PLAN_LENGTHS, emptyPlanState, isReviewDue, localDate, markReviewed, planStatus, portion, readPlanState, reviewDue, setHifzStatus, startPlan, toggleDay, writePlanState, type HifzEntry, type PlanState } from "@/lib/plan";
import type { ContentPreviewItem } from "@/lib/types";
import styles from "./plan-page.module.css";

const fetcher = async (url: string) => { const response = await fetch(url); const value = await response.json(); if (!response.ok) throw value; return value as { items: ContentPreviewItem[] }; };
const formatDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString(undefined, { day: "numeric", month: "short" });

function ReadingPlan({ state, save }: { state: PlanState; save: (next: PlanState) => void }) {
  const [length, setLength] = useState<number>(30);
  const [showDays, setShowDays] = useState(false);
  const today = localDate();
  if (!state.plan) return <section className={styles.card} aria-labelledby="plan-title">
    <h2 id="plan-title">Read the whole Quran</h2>
    <p className={styles.lead}>Choose how many days you&apos;d like to take. Each day is a set of whole Mushaf pages, and you can catch up whenever suits you.</p>
    <div className={styles.lengths} role="radiogroup" aria-label="Plan length">{PLAN_LENGTHS.map((days) => <button type="button" role="radio" aria-checked={length === days} key={days} onClick={() => setLength(days)}><strong>{days} days</strong><span>about {Math.round(MUSHAF_PAGES / days)} pages a day</span></button>)}</div>
    <Button variant="primary" icon="check" onClick={() => save(startPlan(state, length, today))}>Start a {length}-day plan</Button>
  </section>;

  const plan = state.plan;
  const status = planStatus(plan, today);
  const next = status.nextDay ? portion(status.nextDay, plan.days) : null;
  return <section className={styles.card} aria-labelledby="plan-title">
    <div className={styles.cardHead}><div><p className={styles.kicker}>{plan.days}-day plan · started {formatDate(plan.startDate)}</p><h2 id="plan-title">{status.finished ? "Plan complete" : `Day ${status.nextDay} of ${plan.days}`}</h2></div><span className={styles.pages}>{status.pagesRead} / {MUSHAF_PAGES} pages</span></div>
    <div className={styles.progress} aria-hidden="true"><i style={{ width: `${(status.pagesRead / MUSHAF_PAGES) * 100}%` }} /></div>
    {status.finished ? <p className={styles.lead}>You&apos;ve read all {MUSHAF_PAGES} pages. Start another plan whenever you like.</p> : next ? <>
      <p className={styles.lead}>{status.behind ? `Continue with day ${status.nextDay}, pages ${next.from}–${next.to}. The plan picks up wherever you left off.` : `Today's portion: pages ${next.from}–${next.to}.`}</p>
      <div className={styles.actions}>
        <ButtonLink variant="primary" href={`/quran/mushaf/${next.from}`} trailingIcon="arrowRight">Read pages {next.from}–{next.to}</ButtonLink>
        <Button icon="check" onClick={() => save(toggleDay(state, status.nextDay!))}>Mark day {status.nextDay} done</Button>
      </div>
    </> : null}
    <button type="button" className={styles.disclosure} aria-expanded={showDays} onClick={() => setShowDays((value) => !value)}>{showDays ? "Hide" : "Show"} all {plan.days} days<Icon name="chevron" /></button>
    {showDays ? <ol className={styles.days}>{Array.from({ length: plan.days }, (_, index) => index + 1).map((day) => {
      const { from, to } = portion(day, plan.days);
      const done = plan.completed.includes(day);
      return <li key={day}><label className={done ? styles.dayDone : ""}><input type="checkbox" checked={done} onChange={() => save(toggleDay(state, day))} /><span>Day {day}</span><small>p. {from}–{to}</small></label></li>;
    })}</ol> : null}
    <button type="button" className={styles.reset} onClick={() => { if (window.confirm("End this plan? Your ticked days will be cleared.")) save({ ...state, plan: null }); }}>End plan</button>
  </section>;
}

const STATUS_OPTIONS: Array<[HifzEntry["status"] | null, string]> = [[null, "Not started"], ["learning", "Learning"], ["memorised", "Memorised"]];

function Memorisation({ state, save }: { state: PlanState; save: (next: PlanState) => void }) {
  const { data, error } = useSWR("/api/chapters", fetcher, { revalidateOnFocus: false });
  const [filter, setFilter] = useState("");
  const today = localDate();
  const chapters = useMemo(() => data?.items ?? [], [data]);
  const byId = useMemo(() => new Map(chapters.map((chapter) => [chapter.id, chapter])), [chapters]);
  const entries = Object.entries(state.hifz).map(([id, entry]) => ({ id: Number(id), entry }));
  const due = entries.filter(({ entry }) => isReviewDue(entry, today)).sort((a, b) => a.id - b.id);
  const memorised = entries.filter(({ entry }) => entry.status === "memorised").length;
  const learning = entries.filter(({ entry }) => entry.status === "learning").length;
  const needle = filter.trim().toLowerCase();
  const shown = chapters.filter((chapter) => !needle || chapter.nameSimple.toLowerCase().includes(needle) || String(chapter.id) === needle || chapter.translatedName?.toLowerCase().includes(needle));

  return <section className={styles.card} aria-labelledby="hifz-title">
    <div className={styles.cardHead}><div><p className={styles.kicker}>Memorisation</p><h2 id="hifz-title">{memorised} memorised · {learning} learning</h2></div></div>
    <p className={styles.lead}>Mark the Surahs you&apos;re learning or have memorised. Memorised Surahs come back for review after 1, 3, 7, 14 and then every 30 days. In the reader, open Memorize and turn on Test yourself to hide the Arabic until you reveal it.</p>
    {due.length ? <div className={styles.due} aria-label="Due for review">
      <h3>Due for review</h3>
      {due.map(({ id }) => <div className={styles.dueRow} key={id}>
        <Link href={`/quran/${id}`}><strong>{byId.get(id)?.nameSimple ?? `Surah ${id}`}</strong><span>Surah {id}</span></Link>
        <Button small icon="check" onClick={() => save(markReviewed(state, id, today))}>Reviewed</Button>
      </div>)}
    </div> : entries.length ? <p className={styles.muted}>Nothing due for review today.</p> : null}
    <label className={styles.filter}><Icon name="search" /><input type="search" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Find a Surah" aria-label="Find a Surah" /></label>
    {error ? <ContentState kind="error" message="The Surah list is unavailable right now." /> : !data ? <div className={styles.loading} role="status" aria-label="Loading Surahs"><i /><i /><i /></div>
      : <ol className={styles.surahs}>{shown.map((chapter) => {
        const entry = state.hifz[chapter.id];
        const nextReview = entry ? reviewDue(entry) : null;
        return <li key={chapter.id}>
          <Link href={`/quran/${chapter.id}`} className={styles.surahName}><span className={styles.number}>{chapter.id}</span><span><strong>{chapter.nameSimple}</strong><small>{chapter.versesCount} Ayahs{nextReview ? ` · review ${nextReview <= today ? "due" : formatDate(nextReview)}` : ""}</small></span></Link>
          <div className={styles.segmented} role="radiogroup" aria-label={`${chapter.nameSimple} memorisation`}>{STATUS_OPTIONS.map(([value, label]) => <button type="button" role="radio" key={label} aria-checked={(entry?.status ?? null) === value} onClick={() => save(setHifzStatus(state, chapter.id, value, today))}>{label}</button>)}</div>
        </li>;
      })}</ol>}
  </section>;
}

export default function PlanPage() {
  const [state, setState] = useState<PlanState>(emptyPlanState);
  const [ready, setReady] = useState(false);
  useEffect(() => { setState(readPlanState()); setReady(true); }, []);
  const save = (next: PlanState) => setState(writePlanState(next));
  return <Page narrow>
    <PageHeader kicker="My Quran" kickerIcon="quran" title="Reading plan" description="Pace a full reading of the Quran and keep track of what you've memorised. Saved on this device only." />
    {ready ? <><ReadingPlan state={state} save={save} /><Memorisation state={state} save={save} /></> : <div className={styles.loading} role="status" aria-label="Loading"><i /><i /></div>}
  </Page>;
}

// A reading plan (khatm) and a memorisation tracker, kept on this device in versioned storage.
// Portions are whole Mushaf pages of the standard 604-page Madani Mushaf; nothing is approximated within a page.
// Encouraging by design: no streaks, and falling behind only changes where to continue.

export const MUSHAF_PAGES = 604;
export const PLAN_KEY = "af-plan-v1";
export const PLAN_LENGTHS = [7, 15, 30, 60, 90] as const;
// Days until a memorised Surah comes up for review again, widening after each review.
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30] as const;

export type ReadingPlan = { startDate: string; days: number; completed: number[] };
export type HifzEntry = { status: "learning" | "memorised"; stage: number; reviewedAt: string | null };
export type PlanState = { version: 1; plan: ReadingPlan | null; hifz: Record<string, HifzEntry> };

export const emptyPlanState = (): PlanState => ({ version: 1, plan: null, hifz: {} });

export function readPlanState(): PlanState {
  try {
    const value = JSON.parse(localStorage.getItem(PLAN_KEY) ?? "null") as PlanState | null;
    // An unknown version starts fresh rather than misreading old data.
    return value?.version === 1 ? { ...emptyPlanState(), ...value } : emptyPlanState();
  } catch {
    return emptyPlanState();
  }
}

export function writePlanState(state: PlanState) {
  try { localStorage.setItem(PLAN_KEY, JSON.stringify(state)); } catch {}
  return state;
}

// Local calendar date as YYYY-MM-DD, so "today" follows the reader's own day.
export const localDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const dayIndex = (value: string) => { const [y, m, d] = value.split("-").map(Number); return Date.UTC(y, m - 1, d) / 86_400_000; };
export const daysBetween = (from: string, to: string) => dayIndex(to) - dayIndex(from);
export const addDays = (value: string, days: number) => { const date = new Date((dayIndex(value) + days) * 86_400_000); return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`; };

// Pages for day `day` (1-based) of a plan of `days` days; every page is read exactly once.
export function portion(day: number, days: number, pages = MUSHAF_PAGES) {
  return { from: Math.floor(((day - 1) * pages) / days) + 1, to: Math.floor((day * pages) / days) };
}

export function startPlan(state: PlanState, days: number, today = localDate()): PlanState {
  return { ...state, plan: { startDate: today, days, completed: [] } };
}

export function toggleDay(state: PlanState, day: number): PlanState {
  if (!state.plan) return state;
  const done = state.plan.completed.includes(day);
  return { ...state, plan: { ...state.plan, completed: done ? state.plan.completed.filter((item) => item !== day) : [...state.plan.completed, day].sort((a, b) => a - b) } };
}

export function planStatus(plan: ReadingPlan, today = localDate()) {
  const calendarDay = Math.min(plan.days, Math.max(1, daysBetween(plan.startDate, today) + 1));
  const nextDay = Array.from({ length: plan.days }, (_, index) => index + 1).find((day) => !plan.completed.includes(day)) ?? null;
  const pagesRead = plan.completed.reduce((total, day) => { const { from, to } = portion(day, plan.days); return total + to - from + 1; }, 0);
  return { calendarDay, nextDay, pagesRead, finished: nextDay === null, behind: nextDay !== null && nextDay < calendarDay ? calendarDay - nextDay : 0 };
}

export function setHifzStatus(state: PlanState, chapterId: number, status: HifzEntry["status"] | null, today = localDate()): PlanState {
  const hifz = { ...state.hifz };
  if (!status) delete hifz[chapterId];
  else hifz[chapterId] = { status, stage: 0, reviewedAt: status === "memorised" ? today : null };
  return { ...state, hifz };
}

export function markReviewed(state: PlanState, chapterId: number, today = localDate()): PlanState {
  const entry = state.hifz[chapterId];
  if (!entry || entry.status !== "memorised") return state;
  return { ...state, hifz: { ...state.hifz, [chapterId]: { ...entry, stage: Math.min(entry.stage + 1, REVIEW_INTERVALS.length - 1), reviewedAt: today } } };
}

export function reviewDue(entry: HifzEntry) {
  return entry.status === "memorised" && entry.reviewedAt ? addDays(entry.reviewedAt, REVIEW_INTERVALS[Math.min(entry.stage, REVIEW_INTERVALS.length - 1)]) : null;
}

export const isReviewDue = (entry: HifzEntry, today = localDate()) => { const due = reviewDue(entry); return Boolean(due && due <= today); };

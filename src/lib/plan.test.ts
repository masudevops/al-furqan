import { describe, expect, it } from "vitest";
import { MUSHAF_PAGES, emptyPlanState, isReviewDue, markReviewed, planStatus, portion, reviewDue, setHifzStatus, startPlan, toggleDay } from "./plan";

describe("reading plan", () => {
  it("splits the 604 pages into whole-page portions with no gaps or overlaps", () => {
    for (const days of [7, 15, 30, 60, 90, 604]) {
      let next = 1;
      for (let day = 1; day <= days; day += 1) {
        const { from, to } = portion(day, days);
        expect(from).toBe(next);
        expect(to).toBeGreaterThanOrEqual(from);
        next = to + 1;
      }
      expect(next - 1).toBe(MUSHAF_PAGES);
    }
    expect(portion(1, 30)).toEqual({ from: 1, to: 20 });
  });

  it("tracks progress without a streak: falling behind only moves where to continue", () => {
    let state = startPlan(emptyPlanState(), 30, "2026-11-01");
    state = toggleDay(toggleDay(state, 1), 2);
    const status = planStatus(state.plan!, "2026-11-05");
    expect(status).toMatchObject({ calendarDay: 5, nextDay: 3, behind: 2, finished: false, pagesRead: 40 });
    expect(planStatus(toggleDay(state, 2).plan!, "2026-11-05").nextDay).toBe(2);
  });
});

describe("memorisation", () => {
  it("schedules reviews at widening intervals", () => {
    let state = setHifzStatus(emptyPlanState(), 112, "memorised", "2026-11-01");
    expect(reviewDue(state.hifz[112])).toBe("2026-11-02");
    expect(isReviewDue(state.hifz[112], "2026-11-01")).toBe(false);
    expect(isReviewDue(state.hifz[112], "2026-11-02")).toBe(true);
    state = markReviewed(state, 112, "2026-11-02");
    expect(reviewDue(state.hifz[112])).toBe("2026-11-05");
    for (let i = 0; i < 6; i += 1) state = markReviewed(state, 112, "2026-12-01");
    expect(reviewDue(state.hifz[112])).toBe("2026-12-31");
    expect(setHifzStatus(state, 112, null).hifz[112]).toBeUndefined();
    expect(reviewDue(setHifzStatus(state, 1, "learning").hifz[1])).toBeNull();
  });
});

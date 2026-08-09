# Al-Furqan Product Backlog

**Last reviewed:** June 21, 2026  
**Planning basis:** AF-001, AF-002, and AF-003 are complete. Priorities favor Quran reliability, content trust, accessibility, privacy, and reusable web/PWA/mobile boundaries.

## Planning conventions

### Priority

| Priority | Meaning |
|---|---|
| P0 | Address next; active reliability, security, or core-reader need |
| P1 | Important for the first production-grade Quran release |
| P2 | Valuable expansion after the Quran foundation is stable |
| P3 | Later exploration requiring stronger product, content, or platform maturity |

### Effort

Estimates are engineering time for one experienced contributor and include implementation, automated tests, documentation, and review fixes. They do not include external content licensing, scholarly review, app-store review, or unpredictable provider work.

| Size | Indicative effort |
|---|---|
| XS | 1–2 engineer-days |
| S | 3–5 engineer-days |
| M | 6–10 engineer-days |
| L | 11–20 engineer-days |
| XL | 21–40 engineer-days |
| Program | More than 40 engineer-days; must be split before implementation |

Estimates are ranges, not delivery commitments. Any L, XL, or Program item must be decomposed into independently releasable stories before development.

## Priority changes from the previous backlog

- Split the unsafe search rendering fix from the much larger Search 2.0 initiative. The safety fix is now the highest-priority story.
- Reduced AF-004 to bookmarks, last read, and recent Surahs. Reading statistics are deferred because they are not required for continuity and introduce product/privacy decisions.
- Moved Tafsir foundation and reader from P0 to P1. They remain important, but should not precede known search safety and reading continuity work.
- Moved the full audio and memorization programs below reader continuity and safe search.
- Moved Hadith expansion to P2 to preserve the Quran-centric release sequence.
- Moved native application delivery to P2 and made the architecture decision a prerequisite. Shared contracts should mature before committing to a native framework.
- Kept AI work at P3 pending source governance, evaluation standards, privacy policy, and scholar-reviewed safety requirements.

## Delivery sequence

### Now — production safety and continuity

| Order | Story | Status | Priority | Effort | Dependency | Outcome |
|---:|---|---|---|---:|---|---|
| 1 | AF-005A Quran Search Safety | Completed | P0 | XS, 1–2 days | AF-003 | Raw HTML/regex risk removed; malformed queries covered by automated tests |
| 2 | AF-004 Reading Continuity | Completed | P0 | M, 6–8 days | AF-003 | Versioned bookmarks, last-read resume, recent Surahs, corruption recovery |
| 3 | AF-005B Quran Search 2.0 | Completed | P1 | L, 12–18 days | AF-005A | Arabic/translation search, normalization, filters, accessible results, shareable query state |
| 4 | AF-006A Audio Reliability | Completed | P1 | M, 8–10 days | AF-003 | Stabilize existing playback lifecycle, invalid sources, errors, and accessibility |

### Next — Quran understanding and listening

| Story | Priority | Effort | Dependency | Outcome |
|---|---|---:|---|---|
| AF-006B Audio Experience (Completed) | P1 | L, 12–18 days | AF-006A | Repeat, speed, queue, sleep timer, and platform-neutral playback contracts |
| AF-008 Tafsir Foundation | P1 | L, 12–18 days | AF-002, AF-003 | Unified contracts, provenance, validation, source switching |
| AF-009 Tafsir Reader | P1 | L, 12–18 days | AF-008 | Responsive Tafsir drawer/reader, deep links, persistent position |
| AF-010 Tafsir Search | P2 | L, 12–18 days | AF-008, AF-005B | Search across approved Tafsir sources |
| AF-007 Memorization Mode | P2 | L, 15–20 days | AF-006B | Repeat workflows, reveal controls, self-testing, local progress |

### Later — companion features and platform maturity

| Story | Priority | Effort | Dependency / note |
|---|---|---:|---|
| AF-011 Hadith Foundation | P2 | L, 12–18 days | AF-002; requires collection provenance and licensing |
| AF-012 Hadith Reader | P2 | M, 7–10 days | AF-011 |
| AF-013 Hadith Search | P2 | L, 12–18 days | AF-011 |
| AF-014 Daily Hadith | P3 | S, 3–5 days | AF-011; notifications require platform policy |
| AF-015 Books Platform | P2 | L, 15–20 days | Provider/license inventory first |
| AF-016 Islamic Library | P2 | M, 6–10 days | AF-015 |
| AF-017 Book Reader | P2 | XL, 21–30 days | AF-015; split by format before implementation |
| AF-018 Prayer Times Foundation | P1 | M, 8–10 days | Accuracy, calculation transparency, and privacy review |
| AF-019 Athan | P2 | L, 12–18 days | AF-018; web background limitations must be documented |
| AF-020 Qibla | P2 | M, 6–10 days | Device capability and calibration handling |
| AF-021 Islamic Calendar | P2 | S, 4–5 days | Hijri adjustment and source policy required |
| AF-022 User Accounts | P3 | L, 15–20 days | Privacy, deletion, export, and threat model first |
| AF-023 Cloud Sync | P3 | XL, 25–40 days | AF-022 plus conflict resolution and encryption design |
| AF-024 Notes & Reflections | P2 | M, 8–10 days | Versioned local repository; sync optional later |
| AF-025 AI Quran Assistant | P3 | Program, 40+ days | Governance, evaluation, citations, privacy, scholar review |
| AF-026 AI Topic Explorer | P3 | XL, 25–40 days | AF-025 governance and approved source graph |
| AF-027 AI Study Plans | P3 | L, 15–20 days | Non-authoritative scope and safety review |
| AF-028 PWA | P1 | L, 12–18 days | Versioned cache/download policy; never cache stale prayer times |
| AF-029 Mobile Architecture Decision | P1 | S, 3–5 days | Complete before AF-030; evaluate Expo, React Native, and Capacitor |
| AF-030 Native Mobile App | P2 | Program, 60+ days | AF-029 plus mature shared contracts; split into platform milestones |

## Story definitions

### AF-001 — Quality Baseline

**Status:** Completed  
**Delivered:** Type checking, scoped lint gate, Vitest, React Testing Library, Playwright, accessibility smoke checks, CI, and deterministic verification scripts.

### AF-002 — Provider Security

**Status:** Completed  
**Delivered:** Secret-dependent provider access moved behind server-safe boundaries with reusable contracts, response validation, environment documentation, and gateway tests.

**Operational follow-up:** Rotate any credential that was historically exposed and establish production rate limiting/monitoring.

### AF-003 — Quran Reader Core

**Status:** Completed  
**Delivered:** Canonical Quran contracts, validated provider responses, improved typography and responsive reader layout, partial-success/error states, persisted reader preferences, and desktop/mobile reader tests.

### AF-005A — Quran Search Safety

**Status:** Completed June 21, 2026
**Priority:** P0  
**Effort:** XS, 1–2 engineer-days  
**Dependency:** AF-003

**Problem:** Search results currently use a user-controlled regular expression and `dangerouslySetInnerHTML`. Regex metacharacters can throw, and provider/user-derived text is inserted into an HTML sink.

**Scope:**

- Remove `dangerouslySetInnerHTML` from result highlighting.
- Highlight matches with React text nodes or a tested safe tokenizer.
- Treat the query as literal text, not an executable regular expression.
- Add explicit loading, empty, and error states.
- Make result rows keyboard-operable with appropriate semantics.
- Add unit tests for HTML-like text, regex metacharacters, Arabic text, and empty queries.
- Extend E2E coverage to prove malformed input does not crash the dialog.

**Acceptance criteria:**

- No raw HTML sink exists in Quran search results.
- Queries such as `(`, `[`, `.*`, and HTML-like strings cannot crash or inject markup.
- Existing search navigation remains unchanged.
- Typecheck, scoped lint, unit tests, E2E tests, build, and verify pass.

### AF-004 — Reading Continuity

**Status:** Completed June 21, 2026

**Priority:** P0  
**Effort:** M, 6–8 engineer-days  
**Dependency:** AF-003

**Objective:** Let a reader safely resume where they stopped across refreshes and application upgrades.

**In scope:**

- Versioned bookmark and reading-position contracts.
- Migration of existing `{surah, ayah}` bookmarks without data loss.
- Add/remove bookmark with creation timestamp and Quran reference.
- Last-read position updated by an explicit, documented reading event.
- Resume-reading entry point.
- Bounded recent-Surah history.
- Corrupt/unknown storage recovery.
- Platform-neutral repository interface with a web storage adapter.
- Import/export format reserved in the schema, but UI may be a follow-up.

**Out of scope:**

- Reading statistics, streaks, goals, accounts, cloud sync, notes, or bookmark tags.
- Broad bookmarks-page redesign.

**Acceptance criteria:**

- Existing bookmarks migrate and remain usable.
- Bookmark add/remove survives refresh.
- Last read resumes the correct Surah and ayah.
- Recent Surahs are bounded and ordered by recency.
- Invalid storage never crashes the app or silently creates false Quran references.
- Repository logic is reusable outside the browser.
- Unit, component, desktop E2E, and mobile E2E tests pass.

### AF-005B — Quran Search 2.0

**Status:** Completed June 21, 2026

**Priority:** P1  
**Effort:** L, 12–18 engineer-days  
**Dependencies:** AF-003, AF-005A

**Scope:**

- Arabic normalization with documented matching rules.
- Translation-language search, beginning only with verified available editions.
- Surah and Juz filters.
- Accessible result navigation and result counts.
- Shareable URL query state.
- Bounded local search history with a clear/reset control.
- Performance budget and cancellation for stale requests.

**Deferred:** Search analytics until a privacy-safe event policy exists. Full query text must not be logged by default.

### AF-006A — Audio Reliability

**Status:** Completed June 22, 2026

**Priority:** P1  
**Effort:** M, 8–10 engineer-days  
**Dependency:** AF-003

**Scope:** Stabilize the existing player before adding premium controls: validate media URLs, isolate playback state from the reader page, handle source/network failures, improve keyboard/screen-reader behavior, and test play/pause/advance lifecycle.

### AF-006B — Audio Experience

**Status:** Completed June 22, 2026

**Priority:** P1  
**Effort:** L, 12–18 engineer-days  
**Dependency:** AF-006A

**Scope:** Multiple reciters, Surah/ayah queues, repeat ayah/range, speed, sleep timer, persisted preferences, and a platform-neutral playback contract. Background audio and downloads require separate web/native capability slices.

### AF-008 — Tafsir Foundation

**Priority:** P1  
**Effort:** L, 12–18 engineer-days  
**Dependencies:** AF-002, AF-003

**Scope:** Canonical Tafsir edition/entry contracts, range-aware ayah mapping, source provenance, runtime validation, provider adapters, source preferences, and fixture tests. Each supported Tafsir source requires explicit license and attribution review.

### AF-009 — Tafsir Reader

**Priority:** P1  
**Effort:** L, 12–18 engineer-days  
**Dependency:** AF-008

**Scope:** Desktop side panel, mobile sheet/full-screen view, persistent source and position, deep linking, ayah navigation, loading/error/empty states, and accessible focus management.

## Recommended next story

### AF-008 — Tafsir Foundation

Quran reading, continuity, search, and audio now have stable foundations. AF-008 should establish canonical, provenance-aware Tafsir contracts before expanding the Tafsir reader UI.

## Backlog risks and decision points

- The Feature Roadmap’s original AF-003–AF-010 numbering no longer matches delivered ticket names. `PRODUCT_BACKLOG.md` is the canonical ticket sequence until the roadmap is reconciled.
- Full-repository ESLint debt remains outside the quality-gated scope and should receive a dedicated cleanup ticket before lint becomes globally blocking.
- Quran search, Tafsir, Hadith, books, and word-by-word data require documented source, license, version, and content-review status.
- PWA offline behavior needs explicit versioning and integrity checks; generic service-worker caching is not sufficient for Quran content.
- “Background audio,” notifications, downloads, and compass behavior differ substantially across web, PWA, iOS, and Android and should be estimated as platform-specific slices.
- Native development should not start until AF-029 records the decision and shared core contracts have proven stable.
- AI features require a separate governance program and must never present generated religious interpretation as authoritative Tafsir.

## Ticket sizing rule

A normal ticket changes one vertical behavior, includes tests and documentation, and is independently releasable or safely feature-flagged. Any ticket estimated above 10 engineer-days should be split before implementation.

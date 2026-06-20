# Al-Furqan Feature Roadmap

This roadmap is sequenced by dependency and risk, not by visual appeal. Each phase should ship through small tickets with build, lint, automated tests, accessibility checks, and manual mobile verification.

## Phase 0 — Production foundation

**Outcome:** The team can change the app safely and can trust its data boundaries.

- Quality scripts and CI gates
- Unit, component, accessibility, and E2E smoke tests
- Error monitoring and privacy-aware operational logging
- Remove/rotate exposed API credentials
- Provider inventory, licenses, provenance, and rate-limit documentation
- Validated API adapters, common error types, timeout/retry policy
- Accessible UI primitives and global focus/reduced-motion rules
- Route-level code splitting and error boundaries
- Privacy policy, analytics disclosure, and location disclosure
- Security headers, dependency scanning, and release rollback process

**Exit gate:** Core routes pass automated smoke tests; no client secrets; lint is green; critical accessibility findings are resolved.

## Phase 1 — Quran reading foundation

**Outcome:** Al-Furqan becomes a dependable daily Quran reader.

- Canonical Quran domain model
- Reliable Surah/Juz/page navigation
- Last-read position and reading history
- Bookmarks v2 with migration, tags-ready schema, import/export
- Stable translation and reciter preferences
- Accessible audio player with repeat, speed, and sleep timer
- Safe loading, empty, offline, and retry behavior
- Quran search v2 with Arabic normalization and filters
- Route/deep-link state for Surah, ayah, page, translation, and tafsir
- Versioned offline downloads for selected text/audio

**Exit gate:** Complete Quran text verified; no synthetic fallback presented as scripture; core reader works on representative mobile devices and offline for downloaded content.

## Phase 2 — Quran study and word-by-word

**Outcome:** Users can move naturally from reading to understanding.

- Word-by-word translation and transliteration
- Token highlighting synchronized with audio
- Root, lemma, and morphology metadata
- Unified tafsir drawer and full-screen study mode
- Tafsir source comparison and persistent source preference
- Notes and study collections
- Related ayat and cross-reference links
- Study workspace optimized for tablet/desktop
- Content attribution and correction reporting

**Exit gate:** Token alignment and tafsir source metadata are validated; Al-Fatihah and selected pilot Surahs pass scholarly/content QA before full rollout.

## Phase 3 — Prayer and daily companion

**Outcome:** Daily worship utilities are accurate, explainable, and respectful of privacy.

- Prayer dashboard with next-prayer countdown
- Saved locations and local-first preferences
- Calculation method, Madhhab, high-latitude rule, and manual offsets
- Monthly prayer calendar
- Optional adhan/reminder notifications
- Routed Qibla experience with calibration/device guidance
- Hijri date adjustment and Islamic calendar
- Daily adhkar entry points and home dashboard personalization

**Exit gate:** Prayer results are reproducible from visible settings; location is requested only after explanation; notification behavior is testable and user-controlled.

## Phase 4 — Hisnul Muslim, Hadith, and books

**Outcome:** Supporting Islamic knowledge features meet the same trust standard as Quran content.

- Hisnul search, transliteration, references, repetition counters, and unified audio
- Hadith search, pagination, grading metadata, references, bookmarks, and sharing
- Verified collection/source catalog
- Islamic books categories, details, favorites, progress, and internal reader where licensing allows
- Curated collections and topic cross-links
- Content review workflow and correction log

**Exit gate:** Every item has source metadata and license status; large datasets are lazy-loaded or indexed; key flows are accessible and mobile-ready.

## Phase 5 — Accounts, localization, and platform maturity

**Outcome:** Users can safely carry their companion experience across devices and languages.

- Optional account creation
- Encrypted sync for bookmarks, notes, settings, and history
- Data export, deletion, and sync-conflict controls
- Localization framework and full RTL support
- SSR or static generation for indexable public content
- Mature PWA install/update/download management
- Editorial/admin tools for content versioning and review
- Native-wrapper evaluation only after the web experience is stable

## Backlog themes

- Reading plans and Ramadan mode
- Family/child reading profiles
- Memorization mode and recitation loops
- Widgets and lock-screen experiences
- Scholar-reviewed thematic collections
- Public API only after data licensing and operational ownership are mature

## First 10 implementation tickets

### AF-001 — Quality baseline and CI gates

Add Vitest, React Testing Library, Playwright, and axe. Define `test`, `test:unit`, `test:e2e`, and `typecheck` scripts. Cover home render, route smoke, Surah index, and one data adapter. Make lint blocking after existing findings are resolved.

**Status:** Completed June 20, 2026. The implemented script is `test` rather than a separate `test:unit`; full legacy lint remains non-blocking and explicitly documented until its existing findings are resolved.

### AF-002 — Secure provider boundary

Rotate exposed credentials. Remove secrets from client code and history where feasible. Introduce Vercel/Azure serverless endpoints or switch to approved public datasets. Add per-provider timeouts, rate limits, cache policy, and privacy notes.

### AF-003 — Canonical data contracts

Define domain types separately from provider DTOs. Validate external JSON at runtime. Normalize provider failures into typed results. Add fixture-based adapter tests.

### AF-004 — Route splitting and recovery

Lazy-load route modules, add suspense skeletons and global/route error boundaries, and measure initial bundle reduction. Preserve all current URLs.

### AF-005 — Accessible UI primitives

Create shared Button, IconButton, Dialog, Tabs, Select, Range, Toast, Skeleton, EmptyState, and ErrorState components. Retrofit Search and Settings dialogs first.

### AF-006 — Quran reader stabilization

Validate route params, remove synthetic “offline ayah” content, distinguish text/audio failures, restore last-read position, and add tested retry behavior.

### AF-007 — Bookmarks v2

Create a versioned local repository, migrate existing `{surah, ayah}` records, store timestamps and edition context, add export/import, and avoid N+1 network requests.

### AF-008 — Quran search v2

Escape or eliminate regex HTML injection, support Arabic normalization and translation filters, use accessible result navigation, and persist shareable query state.

### AF-009 — Audio player v2

Filter invalid sources, make progress an accessible range control, add repeat/speed/sleep timer, persist preferences, and test media lifecycle behavior.

### AF-010 — Word-by-word Al-Fatihah slice

Select and document a licensed token source. Implement token/translation/transliteration display for Surah 1, with mobile, keyboard, screen-reader, and content-integrity tests.

## Ticket sizing rule

A normal ticket should change one vertical behavior, include tests, and be independently releasable or safely feature-flagged. Avoid tickets that simultaneously replace data providers, redesign multiple screens, and migrate persistence.

# EPIC — Authoritative Sunnah browsing with sunnah.now (superseded)

> Status: cancelled on 2026-08-10. The available early-access catalog contains only Sahih al-Bukhari, so Al-Furqan did not adopt it as the public Sunnah source. The later UmmahAPI decision is documented in [EPIC-UMMAHAPI-AUDIT.md](EPIC-UMMAHAPI-AUDIT.md); it is enabled as an explicitly labelled interim source while Sunnah.com access remains pending.

## Goal

Restore Al-Furqan's Sunnah section using identified, unmodified source records from sunnah.now while keeping credentials private and failing closed whenever authoritative content is unavailable.

## Verified source contract

- Provider: sunnah.now API v0.1.0 Early Access; open-source under MIT.
- Base URL: `https://api.sunnah.now`; authentication uses a server-side `X-API-Key`.
- Current catalog: Sahih al-Bukhari in Arabic and English. Incomplete Albanian is not exposed.
- API surface: books, book metadata, paginated Hadith, chapter Hadith, and individual Hadith.
- No distinct per-Hadith grade field is documented or returned. Al-Furqan must not infer one.
- The provider announcement says free with no rate limits; Early Access stability is not guaranteed.

## Workstreams

1. **Source and security foundation — implemented**
   - [x] Swappable adapter, server-only key, deployment flag, and fail-closed routes.
   - [x] Normalization requiring ID, Arabic, and English.
   - [ ] Validate the owner's key against production responses.
2. **Bukhari browse and reading — implemented**
   - [x] Dynamic catalog, first 100 API records, detail view, narrator, and exact reference.
   - [x] Canonical `/sunnah` navigation and legacy redirect.
3. **Responsive experience — partially complete**
   - [x] Loading, unavailable, and empty states without substitute content.
   - [ ] Visual QA at 375, 430, 768, 1280, and 1440 pixels in all themes.
4. **Chapters and pagination — next**
   - [ ] Add API-backed page navigation and a reliable official chapter catalog.
   - [ ] Preserve stable deep links across provider updates.
5. **Search — next**
   - [x] Search within the currently loaded API page.
   - [ ] Add full-collection search only with an official endpoint or verified versioned index.
6. **Provenance and authenticity — partially complete**
   - [x] Show collection, volume/chapter context, Hadith number, and source.
   - [x] Show collection context without inferring a per-record grade.
   - [ ] Ask sunnah.now whether a scholarly per-record grade field is planned.
7. **Bookmarks — partially complete**
   - [x] Local bookmarks in the shared versioned store.
   - [ ] Design a provider-neutral external-content schema for cross-device sync/collections.
8. **Offline and resilience — planned**
   - [ ] Evaluate the official Bukhari dump, checksum/version policy, license attribution, and updates.
   - [ ] Never silently mix API and dump versions.
9. **Release gate — required**
   - [ ] Add `SUNNAH_NOW_API_KEY` to Vercel Production and Preview.
   - [ ] Verify catalog, list, detail, Arabic, English, references, and failure behavior.
   - [ ] Set `SUNNAH_NOW_ENABLED=true` only after verification.
   - [ ] Run the definition-of-done commands and responsive browser QA.

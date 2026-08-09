# Al-Furqan · الفرقان

Al-Furqan is a free, ad-free, privacy-respecting Quran and Islamic worship companion. The public experience includes all 114 Surahs, authoritative Arabic, dynamically selectable translations, continuous Ayah recitation, an optional Tajweed color lens, compact local prayer times, and sourced Hadith browsing.

Religious content is never generated or substituted. Quran content is fetched from Quran.Foundation through a server-only SDK boundary and protected from automatic browser translation.

## Stack and architecture

- Next.js App Router, React, TypeScript, npm
- `@quranjs/api/server` for confidential Content, Search, OAuth, and User API work
- `@quranjs/api/public` only for browser-safe OAuth initiation
- server-owned sessions with opaque HttpOnly cookies; optional Redis for shared production storage
- SWR for same-origin browser data loading
- locally persisted theme, reader text sizes, and last-read position
- swappable server-side adapters for non-Quran religious data

See [architecture](docs/ARCHITECTURE.md), [Quran.Foundation capability matrix](docs/QURAN-FOUNDATION.md), and [source registry](docs/DATA-SOURCES.md).

## Setup

Use a supported Node LTS release and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Required environment values:

```text
APP_BASE_URL=http://localhost:3000
CLIENT_ID=
CLIENT_SECRET=
SESSION_SECRET=
SCOPES=openid offline_access user note collection bookmark goal preference reading_session
```

Generate a high-entropy `SESSION_SECRET`. Never use `NEXT_PUBLIC_*` for secrets and never commit `.env.local`. Optional `REDIS_URL` enables shared sessions. OAuth scopes must exactly match those approved for the application; all feature-scope approvals are currently **OWNER CONFIRMATION REQUIRED**.

## Commands

```bash
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
npm run smoke:config
npm run smoke:routes
npm run sdk:status
```

## Phase 2 data sources

- Quran and Tajweed annotations use Quran.Foundation Content API v4. Tajweed mode renders the official `text_uthmani_tajweed` annotations through a strict rule-class allowlist; no Tajweed text or rules are generated.
- Prayer times use the keyless [AlAdhan Prayer Times API](https://aladhan.com/prayer-times-api). Location, method, Asr school, and the daily result remain in browser storage. Times are calculations and may differ from a local mosque timetable.
- Hadith uses [fawazahmed0/hadith-api](https://github.com/fawazahmed0/hadith-api) through jsDelivr. The dataset is released under the Unlicense. Al-Furqan displays a record only when that source supplies Arabic, English, collection/book/reference metadata, and at least one named grade. The adapter can be replaced or dual-sourced with Sunnah.com later.

Quran.Foundation Developer Terms prohibit storing QF Content longer than one week without express permission, so this build intentionally does not contain permanent offline Quran downloads. See the [source registry](docs/DATA-SOURCES.md), [Hadith source notes](docs/HADITH-SOURCE.md), and [offline strategy](docs/OFFLINE-STRATEGY.md).

## Known limitations

- Search UI is implemented, but Quran.Foundation rejected the Search app-token exchange in both production and pre-live during verification. Search-scope approval for the exact client is **OWNER CONFIRMATION REQUIRED**.
- Hadith bookmarks and prayer preferences work locally without sign-in. Cross-device sync is not enabled because the current Quran.Foundation user schemas/scopes have not been verified to support external Hadith entities and prayer settings safely; this remains **OWNER CONFIRMATION REQUIRED**.
- A Sunnah.com API key has not been requested from the owner's account. The adapter boundary is ready, but the account/key request is an owner action.
- Tafsir, localization/Arabic UI, accounts, and PWA are subsequent phases.
- Exact Mushaf/page rendering is not claimed.
- The official starter currently resolves to dependencies with known audit findings; these require compatibility-aware remediation rather than blind forced upgrades.

# Al-Furqan · الفرقان

Al-Furqan is a free, ad-free, privacy-respecting Quran and Islamic worship companion. The current greenfield milestone provides a polished public Quran path built on the official Quran.Foundation Next.js starter: Home → all 114 Surahs → authoritative Arabic, dynamically selectable translations, and continuous Ayah recitation → local last-read resume.

Religious content is never generated or substituted. Quran content is fetched from Quran.Foundation through a server-only SDK boundary and protected from automatic browser translation.

## Stack and architecture

- Next.js App Router, React, TypeScript, npm
- `@quranjs/api/server` for confidential Content, Search, OAuth, and User API work
- `@quranjs/api/public` only for browser-safe OAuth initiation
- server-owned sessions with opaque HttpOnly cookies; optional Redis for shared production storage
- SWR for same-origin browser data loading
- locally persisted theme, reader text sizes, and last-read position

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

## Data, licensing, and offline limits

Quran, translations, Tafsir, recitations, and Quran metadata come from Quran.Foundation. Current Developer Terms prohibit storing QF Content longer than one week without express permission, so this build intentionally does not contain permanent offline Quran downloads. See [offline strategy](docs/OFFLINE-STRATEGY.md).

A complete Hadith source has not been selected. Quran.Foundation documents Ayah-linked Hadith references, but the required complete corpus/license has not yet been verified; no Hadith feature is presented as complete. See [Hadith research](docs/HADITH-SOURCE.md).

## Known limitations

- Search UI is implemented, but Quran.Foundation rejected the Search app-token exchange in both production and pre-live during verification. Search-scope approval for the exact client is **OWNER CONFIRMATION REQUIRED**.
- Dynamic Quran font resources, Tafsir, audio, localization/Arabic UI, accounts, and PWA are subsequent phases.
- Exact Mushaf/page rendering is not claimed.
- The official starter currently resolves to dependencies with known audit findings; these require compatibility-aware remediation rather than blind forced upgrades.

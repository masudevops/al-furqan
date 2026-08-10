# Al-Furqan · الفرقان

Al-Furqan is a free, ad-free, privacy-respecting Quran and Islamic worship companion. The public experience includes all 114 Surahs, authoritative Arabic, translations, Tafsir, word-by-word study, official Mushaf pages, structural navigation, continuous Ayah recitation, Tajweed, Salah Times, Dua, Qibla, and a Masjid Finder.

Religious content is never generated or substituted. Quran content is fetched from Quran.Foundation through a server-only SDK boundary and protected from automatic browser translation.

## Stack and architecture

- Next.js App Router, React, TypeScript, npm
- `@quranjs/api/server` for confidential Content, Search, OAuth, and User API work
- `@quranjs/api/public` only for browser-safe OAuth initiation
- server-owned sessions with opaque HttpOnly cookies; optional Redis for shared production storage
- SWR for same-origin browser data loading
- versioned local storage for bookmarks, location, prayer preferences, theme, reader text sizes, and last-read position
- swappable server-side adapters for non-Quran religious data

See [architecture](docs/architecture.md), [Quran.Foundation capability matrix](docs/QURAN-FOUNDATION.md), the [Phase 3 Quran.Foundation feature audit](docs/QURAN-FOUNDATION-PHASE-3-AUDIT.md), and [source registry](docs/DATA-SOURCES.md).

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
SCOPES=openid offline_access bookmark note collection goal preference
```

Generate a high-entropy `SESSION_SECRET`. Never use `NEXT_PUBLIC_*` for secrets and never commit `.env.local`. Optional `REDIS_URL` enables shared sessions. OAuth scopes must exactly match those approved for the application; all feature-scope approvals are currently **OWNER CONFIRMATION REQUIRED**.

### Quran.Foundation access to request now

Request these exact permissions for both production and pre-production clients, with the exact callback URL for each deployment:

- **Application/server access:** `search`. This is separate from end-user consent and enables Quran search.
- **Minimum OIDC/User API consent:** `openid offline_access bookmark note collection goal preference`.
- **Optional future progress access:** `reading_session activity_day streak`. These are not needed for the current Phase 3 release, but requesting them now avoids another approval round for the deferred progress work.

Do not request a generic `user` scope unless Quran.Foundation explicitly adds it to the approval. After approval, set `SCOPES` to only the approved OIDC/User API values; `search` remains an application-token permission rather than a browser-visible secret.

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

## Phase 3 features and data sources

- Quran and Tajweed annotations use Quran.Foundation Content API v4. Tajweed mode renders the official `text_uthmani_tajweed` annotations through a strict rule-class allowlist in verse, structural, and Mushaf page reading; no Tajweed text or rules are generated. The Mushaf keeps its exact QCF glyph/line mode as a separate toggle because verse-level Tajweed markup does not encode QCF glyph color positions.
- Tafsir resources, word-by-word data, Quran structural divisions, QCF V2 page glyphs, line positions, and per-page Mushaf fonts are discovered from Quran.Foundation. No Mushaf line or page is approximated.
- Prayer times and Qibla bearings use the keyless [AlAdhan API](https://aladhan.com/prayer-times-api). Location, method, Asr school, and daily data remain in browser storage. Times are calculations and may differ from a local mosque timetable.
- Dua content uses the MIT-licensed [fitrahive/dua-dhikr](https://github.com/fitrahive/dua-dhikr) service through a same-origin server adapter. Reviewed entries can optionally stream matching Arabic recordings from Hisnul Muslim; recordings are not copied or cached, and ambiguous matches are omitted. The live English text endpoint was verified for this release, but it publishes no rate-limit or availability SLA and currently exposes five English categories. The app shows an unavailable state rather than substituting content.
- Nearby mosque data uses [OpenStreetMap](https://www.openstreetmap.org/copyright) through the public Overpass API; manual city lookup uses Nominatim. Results are session-cached and community data may be incomplete.
- Hadith is disabled in navigation, UI data loading, and server routes while Sunnah.com production API access is pending. The previous provider adapter remains non-public implementation scaffolding and must not be enabled in production.

Quran.Foundation Developer Terms prohibit storing QF Content longer than one week without express permission, so this build intentionally does not contain permanent offline Quran downloads. See the [source registry](docs/DATA-SOURCES.md), [Hadith source notes](docs/HADITH-SOURCE.md), and [offline strategy](docs/OFFLINE-STRATEGY.md).

## Known limitations

- Search UI is implemented. The owner reported Quran.Foundation production and pre-live Search approval on 2026-08-09; deployment verification remains required for the configured client.
- Quran Reflect Lessons & Reflections is implemented as a read-only, curated QDC feed with individual detail routes. Production access requires the separate Quran Reflect `post.read` application scope; approval is **OWNER CONFIRMATION REQUIRED** until verified against the deployed client.
- Quran and Dua bookmarks, location, and prayer preferences work locally without sign-in. The owner reported User API scope approval on 2026-08-09; the signed-in cross-device sync UI and deployed end-to-end validation are still pending.
- A Sunnah.com API key has not been requested from the owner's account. The adapter boundary is ready, but the account/key request is an owner action.
- Dua coverage reflects the source's current five-category English catalog; the intended broader Hisnul Muslim taxonomy is not yet available from this provider.
- Localization/Arabic UI, accounts, and PWA are subsequent phases. Reading goals and extended progress features are intentionally held for the next priority round.
- The official starter currently resolves to dependencies with known audit findings; these require compatibility-aware remediation rather than blind forced upgrades.

## Native app considerations

Provider adapters and data transformations are kept outside page components where practical, so they can be moved into a shared TypeScript core later. The current web shell still depends on browser geolocation, `DeviceOrientationEvent`, `FontFace`, `localStorage`, `sessionStorage`, and Next.js route handlers. A native client will need platform adapters for location/orientation, secure/versioned storage, official Mushaf font loading, and the same-origin API boundary. No native project or framework decision is included in this phase.

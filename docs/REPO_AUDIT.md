# Al-Furqan Repository Audit

**Audit date:** June 20, 2026  
**Scope:** Repository, production build output, and read-only deployed-page metadata at `https://al-furqan.app/`  
**Constraint:** Documentation only; no application behavior changed.

## Executive assessment

Al-Furqan is a client-rendered React single-page application with a broad prototype feature set: Quran reading and audio, Mushaf images, Quran search, tafsir, bookmarks, Hadith, prayer times, Hisnul Muslim, and an Islamic books catalog. The breadth is promising, but the implementation is not yet production-grade.

The highest-risk issues are exposed third-party API credentials, direct browser dependence on several unowned APIs, inconsistent data models, absent automated tests, stale documentation, limited accessibility semantics, weak offline behavior, no route-level code splitting, and a client-only SEO model. The safest path is to stabilize the Quran core and shared platform before adding more features.

## Current technology stack

| Area | Current implementation |
|---|---|
| UI | React 19.1, TypeScript 5.8 |
| Build | Vite 6.3 |
| Routing | React Router DOM 7.6 using declarative `BrowserRouter`, `Routes`, and `Route` |
| Styling | Tailwind CSS 3.4, global CSS, scattered utility compositions |
| Icons | Lucide React and React Icons |
| Animation | Framer Motion installed; most visible animation is CSS-based |
| State | React Context for theme, Quran settings, and audio; page-local state elsewhere |
| Persistence | Browser `localStorage` |
| SEO | `react-helmet-async` plus static tags in `index.html` |
| Analytics | Vercel Web Analytics |
| PWA | Hand-written manifest and service worker |
| Deployment | Vercel rewrite configuration; an Azure GitHub Actions workflow also exists |
| Quality | TypeScript strict build and ESLint; no unit, integration, or end-to-end test framework |

### Dependency concerns

- `@types/react-router-dom` is version 5 while runtime React Router is version 7; the package is unnecessary because modern React Router ships types.
- No data-fetching/cache library, schema validator, error monitoring SDK, test framework, accessibility test tool, or internationalization library is installed.
- The build emits one large JavaScript chunk: approximately 671 kB minified and 186 kB gzip.

## Repository structure

```text
.
├── .github/workflows/         # Azure build/deploy workflow
├── docs/                      # Product and engineering documentation
├── public/
│   ├── icons/                 # PWA icons
│   ├── manifest.json
│   └── service-worker.js
├── src/
│   ├── components/            # Shared and feature-adjacent UI
│   ├── config/                # Build-time feature flags
│   ├── context/               # Audio, settings, theme state
│   ├── data/                  # Local JSON/TS data and fallbacks
│   ├── hooks/                 # Feature flags and geolocation
│   ├── layouts/               # Unused alternate layout
│   ├── pages/                 # Route-level screens
│   ├── services/              # Direct browser API integrations
│   ├── App.tsx                # Providers and route table
│   ├── index.css              # Tailwind and global styles
│   └── main.tsx               # App entry, analytics, service worker
├── Dockerfile                 # Development server image, currently inconsistent
├── docker-compose.yml
├── vercel.json                # SPA rewrites
└── package.json
```

### Structural observations

- Route pages contain data access, transformation, persistence, and presentation logic in the same files.
- `SurahDetail.tsx` (737 lines) and `HisnulMuslim.tsx` (596 lines) are difficult to test and maintain.
- `Prayer.tsx`, `Qibla.tsx`, `Quran.tsx`, and `MainLayout.tsx` are not reachable from the current route table.
- Two separate tafsir services and experiences use different providers and source identifiers.
- Book detail mapping duplicates service logic and uses a different attachment field from the list service.
- Static files such as `hadith-data.json`, `hisnul-data.json`, `salah-times.json`, and `tafseer-data.json` appear to be legacy/demo data.
- Existing root-level architecture and testing documents contain claims that no longer match the source code.

## Routing

| Route | Screen | Status |
|---|---|---|
| `/` | Home | Active |
| `/al-quran`, `/quran` | Quran index and Mushaf tab | Active |
| `/quran/:surahId` | Surah reader | Active |
| `/mushaf` | Mushaf reader | Feature-flagged |
| `/hadith` | Hadith collections | Active |
| `/hadith/:collectionId` | Hadith chapters | Active |
| `/hadith/:collectionId/:bookNumber` | Hadith list | Active |
| `/tafseer` | Standalone tafsir | Active |
| `/library`, `/books` | Islamic books | Active |
| `/library/:bookId` | Book detail | Active but not linked from the list cards |
| `/salah`, `/prayer` | Prayer times | Active |
| `/hisnul` | Hisnul Muslim | Active |
| `/bookmarks` | Quran bookmarks | Active |
| `*` | Not found | Active |

Routing is centralized and understandable, but all route modules are imported eagerly. Aliases do not redirect to canonical URLs, so duplicate paths can be indexed. There are no route loaders, route error boundaries, scroll restoration, canonical link management, or route-level analytics conventions.

## UI and component structure

### Shared shell

- `Header` contains navigation, mobile navigation, Quran search, and settings triggers.
- `Footer` is static.
- `GlobalPlayer` provides persistent Quran playback controls.
- `ThemeProvider`, `SettingsProvider`, and `AudioProvider` wrap the entire app.

### Quran UI

- `AlQuranPage` shows a searchable Surah grid and an optional Mushaf tab.
- `SurahDetail` handles text fetching, translation selection, reciter selection, playback, bookmarks, copy/share, inline tafsir, navigation, and Mushaf switching.
- `PageView` renders per-ayah images from Islamic Network CDN for a 604-page Mushaf experience.
- `SearchModal` searches a translation edition through AlQuran Cloud.

### Other features

- Hadith pages are a three-level collection/chapter/hadith flow.
- Tafsir has both standalone and inline implementations.
- Prayer times support city/country and geolocation.
- Hisnul Muslim uses local data with grouping, favorites, copy, share, and optional audio.
- Islamic books are fetched from IslamHouse and exposed as external downloads.

### Design consistency

The app has a recognizable emerald/dark visual direction, but components use many one-off color, radius, typography, spacing, and interaction choices. There is no shared Button, IconButton, Modal, Select, Card, EmptyState, ErrorState, Skeleton, Toast, or ArabicText primitive.

## Data sources

| Domain | Source | Use | Risks |
|---|---|---|---|
| Quran metadata | Local `surah-list.json` | 114-Surah index | No provenance/version metadata |
| Quran text/translations | AlQuran Cloud | Surah, ayah, page, editions, search | Runtime dependency, inconsistent fallback, no validation |
| Quran audio | AlQuran Cloud and `verses.quran.com` | Verse audio | Provider-specific URL logic; empty audio can enter playlists |
| Mushaf images | Islamic Network CDN | Ayah image rendering | Many image requests; not a true page-layout Mushaf |
| Inline tafsir | AlQuran Cloud | Per-ayah tafsir | Separate source catalog from standalone tafsir |
| Standalone tafsir | `spa5k/tafsir_api` through jsDelivr | Multiple tafsir languages | GitHub/CDN dependency and no pinned content version |
| Hadith | HadithAPI.com | Books, chapters, hadiths | API key embedded in bundle; catalog metadata manually maintained |
| Prayer times | Aladhan | City/coordinates timings | No durable location preferences in active page; method defaults need localization |
| Reverse geocoding | BigDataCloud | Coordinate label | Precise coordinates sent to third party after permission |
| Hisnul Muslim | Local imported JSON | Dua content | Source noted in code but no version/license/review metadata |
| Islamic books | IslamHouse API v3 | Catalog and downloads | API key embedded in bundle; mapping inconsistency |

## Current feature gaps

### Quran and study

- No word-by-word Arabic, translation, morphology, root, lemma, or grammar.
- No tajweed text mode or token-level highlighting.
- No Juz, Hizb, Rub, Sajdah, page, or revelation-order navigation.
- No reading position, reading history, goals, streaks, notes, tags, or bookmark folders.
- Search is translation-only, remote-only, and lacks filters, Arabic normalization, transliteration, history, and offline index.
- Quran fallback behavior can display demo/error text as if it were ayah content.
- Tafsir sources are fragmented and attribution/versioning is incomplete.
- No recitation repeat ranges, speed, sleep timer, download manager, or gapless playback.

### Prayer and daily companion

- No next-prayer countdown, adhan notifications, monthly calendar, manual offsets, high-latitude rules, Madhhab-based Asr setting, or saved locations in the active prayer screen.
- Qibla exists in source but is not routed.
- No Hijri adjustment, Islamic calendar, fasting utilities, zakat, or mosque discovery.

### Hadith, Hisnul Muslim, and books

- No Hadith search, pagination, collection verification metadata, bookmarks, sharing, or source references.
- Hisnul Muslim lacks transliteration, references/grades in its rendered model, search, counters, and a unified media player.
- Books lack internal reading, categories, favorites, reading progress, source review status, and a working list-to-detail journey.

### Account and continuity

- No account, encrypted sync, cross-device bookmarks, export/import, backup, or data deletion flow.
- No privacy preferences or consent explanation for analytics and location.

## Performance concerns

1. All routes are bundled eagerly; production JavaScript is approximately 671 kB minified.
2. `HisnulMuslim` imports a 284 kB JSON dataset into the main bundle.
3. Quran settings load the complete remote edition catalog when the modal first opens.
4. Mushaf renders one remote image per ayah on a page, producing many requests and layout shifts.
5. Bookmarks issue two API requests per bookmark with no concurrency limit or cache.
6. No query cache, deduplication, stale-data policy, retry policy, or offline data versioning exists.
7. Google Fonts and a third-party background image are runtime dependencies.
8. The service worker caches every same-origin JSON response cache-first without version-aware content invalidation and references a missing `/offline.html`.
9. Duplicate service-worker registration exists in both `main.tsx` and `index.html`.
10. The active prayer page dynamically imports a module that it also statically imports; Vite reports no chunking benefit.

## Accessibility concerns

- Icon-only buttons frequently rely on `title` or have no accessible name.
- Search and settings dialogs lack `role="dialog"`, `aria-modal`, labelled titles, focus trapping, Escape handling, and focus restoration.
- Mobile navigation lacks `aria-expanded`, `aria-controls`, and a labelled menu button.
- Several clickable containers are `div` elements rather than links/buttons.
- Hisnul Muslim actions are hidden with hover opacity, making them hard to discover and potentially unavailable to touch and keyboard users.
- The Hisnul bottom navigation uses unlabeled icon-only controls.
- Custom toggle controls lack switch semantics.
- Audio progress is a clickable `div`, not an accessible range input.
- Loading and error changes are not announced through live regions.
- Focus styles are inconsistent and sometimes explicitly suppressed.
- No skip link is present.
- Heading structure and landmarks vary by route.
- `prefers-reduced-motion` is not honored.
- Arabic language spans generally lack `lang="ar"`; translation language is not declared.

## Mobile responsiveness concerns

- The header has seven desktop navigation links plus two actions at the `md` breakpoint, likely crowding tablet widths.
- Surah reader controls form a dense sticky region; wrapping can consume much of a small viewport.
- Previous/next Surah labels and the centered title compete horizontally.
- Qibla uses a fixed `w-80 h-80` compass that can overflow narrow devices.
- Hisnul groups force three columns on the smallest screens, creating cramped labels and targets.
- Hover-dependent actions do not translate well to touch.
- Multiple sticky layers (global header, Surah header, Mushaf controls, Hisnul header/footer, audio player) can overlap or reduce usable content.
- Bottom content padding is not consistently aware of the global audio player or device safe areas.

## SEO concerns

- The app is a client-rendered SPA; crawlers and social scrapers may receive only static `index.html` metadata.
- `HelmetProvider` is instantiated inside every `SEO` component instead of once at the app root.
- No canonical URLs, sitemap, robots file, structured data, breadcrumb schema, or alternate-language links exist.
- Alias routes can create duplicate content.
- Dynamic Surah, Hadith, tafsir, and book pages do not generate server-rendered metadata.
- Open Graph metadata is static for every route.
- The title convention can duplicate the brand on the home page.
- The deployed app title is observable, but browser-based visual verification was unavailable in this workspace; visual findings are therefore source-grounded.

## Security and privacy concerns

### Critical

- HadithAPI and IslamHouse API keys are hard-coded in client JavaScript and are included in the production bundle. They must be treated as public/compromised, rotated where supported, and moved behind a server-side boundary or replaced with an approved public-data strategy.
- `SearchModal` builds a regular expression from raw user input and injects highlighted HTML with `dangerouslySetInnerHTML`. Regex metacharacters can throw or cause expensive matching, and HTML from the provider is trusted without sanitization.

### High

- No Content Security Policy or other security headers are configured.
- External API responses are not runtime-validated before use.
- External downloads and media are trusted based on provider response.
- Precise geolocation is sent to Aladhan and BigDataCloud; the UI does not explain retention, third-party processing, or alternatives before the browser permission prompt.
- Analytics is initialized unconditionally, with no documented consent or privacy policy.

### Medium

- Local storage data has no schema version, validation, migration, expiration, or corruption recovery beyond isolated try/catch blocks.
- Service-worker caching may retain content longer than expected and has no user-facing cache controls.
- No dependency vulnerability scan is defined in CI.
- Console logs can expose request URLs and operational details in production.

## Build and quality baseline

Executed against the current working tree:

- TypeScript project build: **passed**
- Vite production build: **passed**
- ESLint: **failed** with 17 errors and 14 warnings
- Automated unit/integration/E2E tests: **none found**
- Production build warning: main JavaScript chunk exceeds 500 kB
- Git worktree: already heavily modified before this documentation ticket; those changes were preserved

The existing `npm run build` script is viable when Node/npm are available. This workspace did not expose `npm` on `PATH`, so the equivalent TypeScript and Vite commands were executed with the bundled Node runtime.

## Recommended phased roadmap

1. **Phase 0 — Trust and baseline:** remove exposed credentials, establish tests/CI, formalize source provenance, add monitoring, and fix critical accessibility/security defects.
2. **Phase 1 — Quran foundation:** canonical data contracts, reliable Quran reader, reading position, bookmarks v2, search v2, accessible audio, and offline strategy.
3. **Phase 2 — Study experience:** word-by-word, morphology, unified tafsir, notes, collections, cross-linking, and study workspace.
4. **Phase 3 — Daily companion:** prayer calculation preferences, notifications, Qibla route, Hijri controls, daily adhkar, and widgets.
5. **Phase 4 — Library depth:** verified Hadith, Hisnul references/transliteration, Islamic books reader, favorites, and content governance.
6. **Phase 5 — Accounts and ecosystem:** optional sync, privacy controls, import/export, localization, SSR/PWA maturity, and editorial/admin workflows.

See `FEATURE_ROADMAP.md` for outcomes and release gates.

## First 10 implementation tickets

| # | Ticket | Acceptance summary |
|---|---|---|
| AF-001 | Establish quality baseline and CI gates | Add Vitest, Testing Library, Playwright, axe, deterministic scripts, and CI; keep a small smoke suite green |
| AF-002 | Secure external provider access | Rotate/remove exposed keys; introduce server-side proxy or approved keyless source; document privacy and rate limits |
| AF-003 | Create canonical domain models and validated API adapters | Add Quran/Hadith/Tafsir/prayer schemas, normalized errors, timeouts, and provider adapters |
| AF-004 | Introduce route-level code splitting and app error boundaries | Lazy-load feature routes; add route/global error recovery; reduce initial bundle |
| AF-005 | Build accessible UI primitives | Button, IconButton, Dialog, Select, Tabs, Toast, Skeleton, Empty/Error states, focus and reduced-motion rules |
| AF-006 | Stabilize Quran reader data and error handling | Remove synthetic ayah fallback, validate Surah IDs, preserve last-read position, add loading/retry states |
| AF-007 | Bookmarks v2 storage and migration | Versioned repository, timestamps, notes/tags-ready schema, import/export, migration from `quranBookmarks` |
| AF-008 | Quran search v2 | Safe highlighting, Arabic normalization, filters, URL state, keyboard navigation, indexed/local strategy |
| AF-009 | Accessible global audio v2 | Valid playlist filtering, range control, speed/repeat/sleep timer, Media Session cleanup, persisted playback settings |
| AF-010 | Word-by-word vertical slice for Al-Fatihah | Provenanced token dataset, Arabic/token UI, translation/transliteration toggle, tests and mobile/accessibility QA |

## Audit conclusion

Al-Furqan should not be expanded through more isolated pages yet. The next investment should establish trustworthy data boundaries and automated quality gates, then deepen the Quran experience through small vertical slices. The current visual and feature breadth is a useful prototype foundation; production readiness depends on consolidation, verification, and disciplined release controls.

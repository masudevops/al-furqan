# Al-Furqan Testing Strategy

## Current baseline

- TypeScript strict compilation exists and passes.
- Vite production build passes.
- ESLint currently fails with 17 errors and 14 warnings.
- Vitest and React Testing Library run six landing, navigation, search, Quran-route, and tafsir-route smoke tests.
- Playwright runs four Chromium route/UI smoke tests against a production preview.
- `jest-axe` and `@axe-core/playwright` provide critical-impact accessibility smoke gates.
- Existing older Markdown test reports remain historical assertions; `QUALITY_BASELINE.md` describes the repeatable AF-001 evidence.

## Quality goals

1. Prevent corruption or mislabeling of Quran and religious content.
2. Keep reading, search, audio, bookmarks, and prayer flows stable on mobile.
3. Detect provider contract changes before production.
4. Meet WCAG 2.2 AA in core journeys.
5. Make every production release reproducible and reversible.

## Test layers

### Static checks

- TypeScript: strict, no emit
- ESLint: zero errors; warnings explicitly budgeted and reduced
- Formatting: deterministic formatter
- Dependency audit and secret scanning
- Content schema and source-manifest validation

### Unit tests

Use Vitest for:

- API DTO mapping and schema validation
- Quran reference and boundary utilities
- Arabic normalization and search highlighting
- Prayer settings serialization and time calculations
- Qibla bearing calculation
- Bookmark migrations
- Tafsir text formatting
- Audio playlist construction

### Component tests

Use React Testing Library and user-event:

- Search and settings dialogs
- Surah selector and reader controls
- Ayah actions and bookmark state
- Tafsir loading/error/success
- Prayer settings form
- Hisnul tabs, favorites, and touch-visible actions
- Global player keyboard and range behavior

Prefer user-visible behavior over implementation details.

### Contract tests

Store sanitized provider fixtures and test:

- Expected and malformed AlQuran Cloud responses
- Tafsir source availability and range mapping
- Hadith books/chapters/hadith payloads
- Aladhan city and coordinate responses
- IslamHouse list/detail attachment fields

Run optional scheduled live probes separately from deterministic PR tests. Live provider failures must not make ordinary unit tests flaky.

### End-to-end tests

Use Playwright for a small critical suite:

1. Home → Quran → Surah 1 renders verified Arabic and translation.
2. Search → result → deep-linked ayah.
3. Bookmark ayah → bookmarks page → remove bookmark.
4. Start audio → pause/seek/next → close player.
5. Open tafsir and switch source.
6. Prayer city search with mocked API.
7. Hisnul category → favorite → favorites tab.
8. Offline downloaded Quran smoke test when offline support is implemented.

Run Chromium on every PR; run Firefox and WebKit in nightly or release workflows.

### Accessibility tests

- axe in component and E2E tests
- Keyboard-only scripted checks for dialogs, tabs, menus, reader, and audio
- Screen-reader manual checks on VoiceOver/Safari and NVDA/Firefox before major releases
- 200% zoom and 320 px viewport
- Reduced motion and high-contrast/forced-colors checks
- Arabic/LTR direction boundary review

Automated accessibility tests are necessary but not sufficient.

### Visual regression

Capture stable screenshots for:

- Home
- Quran index
- Surah reader light/dark
- Word-by-word sheet
- Prayer dashboard
- Hisnul category
- Global player

Use deterministic fonts, mocked APIs, and fixed viewport/device settings.

### Performance tests

Track:

- Initial JavaScript/CSS budgets
- LCP, INP, and CLS on representative mobile profiles
- Route chunk sizes
- Quran reader and search interaction latency
- Number of requests per Mushaf page and bookmarks load
- Offline storage footprint

Initial budgets:

- Main entry JS: target below 200 kB gzip after route splitting
- Route chunk: target below 100 kB gzip unless content-heavy and justified
- Core route LCP: below 2.5 seconds at p75
- CLS: below 0.1

### Content integrity tests

For each Quran edition:

- Exactly 114 Surahs
- Expected total ayah count for the selected numbering convention
- Per-Surah ayah counts
- Non-empty text
- Stable checksums for versioned bundles
- Valid page/Juz references

For Hadith, tafsir, duas, and books:

- Source and version present
- Required attribution present
- IDs unique
- Language and direction metadata valid
- External URLs use approved schemes/origins

Religious-content fixture updates require explicit reviewer approval.

## Test environments

| Environment | Purpose |
|---|---|
| Local | Fast unit/component tests and mocked E2E |
| PR preview | Browser, accessibility, responsive, and product review |
| Staging | Provider integration, migrations, PWA updates, release candidate |
| Production | Synthetic smoke checks and monitoring only; no destructive test data |

## CI pipeline

Recommended order:

1. Install with lockfile
2. Secret scan
3. Typecheck
4. Lint
5. Unit/component tests with coverage
6. Content integrity checks
7. Production build and bundle budget
8. Playwright Chromium smoke
9. axe results
10. Preview deployment

Nightly:

- Cross-browser E2E
- Live provider probes
- Dependency audit
- Lighthouse/Web Vitals synthetic run

## Coverage policy

Do not optimize for a single global percentage. Require high coverage for:

- data adapters and migrations
- Quran reference/content integrity logic
- prayer calculation settings
- search normalization/highlighting
- audio playlist state

New feature tickets must include success, empty, error, and offline/timeout behavior where applicable.

## Definition of done for every ticket

- Acceptance criteria met
- Tests added or updated
- Typecheck, lint, tests, and build pass
- Accessibility reviewed
- Mobile viewport manually checked
- Loading/error/offline states considered
- Data source/provenance documented if changed
- No new client secret or sensitive logging
- Release notes and rollback impact identified

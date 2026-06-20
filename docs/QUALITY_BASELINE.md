# AF-001 Quality Baseline

**Established:** June 20, 2026

## Quality commands

| Command | Purpose |
|---|---|
| `npm run typecheck` | Strict TypeScript project build without emitting files |
| `npm run lint` | Full-repository ESLint check, including legacy source |
| `npm run lint:quality` | Blocking lint gate for the AF-001 test/configuration harness |
| `npm run test` | Deterministic Vitest unit/component smoke tests |
| `npm run test:e2e` | Playwright Chromium route/UI smoke tests |
| `npm run build` | TypeScript and Vite production build |
| `npm run verify` | Blocking CI sequence: typecheck, quality-harness lint, unit tests, E2E tests, and production build |

## Why `verify` uses `lint:quality`

The repository entered AF-001 with 17 ESLint errors and 14 warnings in existing application files. Fixing all of them would expand this ticket into unrelated application refactoring.

`npm run lint` remains the transparent full-repository check and continues to report that debt. `npm run lint:quality` prevents new quality-infrastructure files from introducing lint failures, allowing CI to provide a reliable passing baseline without suppressing or rewriting legacy findings.

## Pre-existing full lint failures

The June 20, 2026 baseline includes:

- Explicit `any` usage in audio, Quran, book, prayer, and tafsir code
- Unused error variables
- Variables that can be `const`
- React Hook dependency warnings
- React Fast Refresh export warnings

The detailed current report is produced by:

```bash
npm run lint
```

These findings should be reduced in small feature-adjacent tickets. They must not be converted into broad disable rules.

## Test coverage established

Vitest and React Testing Library:

- Landing page content
- Quran route rendering with all 114 Surahs
- Tafsir route rendering with provider calls mocked
- Primary navigation links
- Search input interaction
- Critical-impact axe scan of the landing page component

Playwright:

- Landing page and primary navigation
- Quran route
- Tafsir route
- Global search input
- Critical-impact axe scan on the landing page

Provider calls are not required for smoke-test success. Provider contract tests belong in AF-003.

## Known limitations

- Chromium is the only blocking E2E browser in this initial baseline.
- The axe E2E smoke gate blocks critical violations only; existing broader accessibility debt remains documented in `UX_DESIGN_SYSTEM.md` and `REPO_AUDIT.md`.
- The landing page currently reports a non-critical heading-order violation because feature cards move from `h1` to `h3`; AF-001 records but does not redesign that hierarchy.
- No coverage threshold is enforced yet.
- No visual regression suite is included.
- The existing React 19 / `react-helmet-async` peer mismatch requires npm's legacy peer-resolution mode until the dependency is upgraded or replaced. The repository-level `.npmrc` applies this consistently to local installs, CI, and Vercel's automatic install step.
- The clean install currently reports 23 dependency audit findings (2 low, 7 moderate, 13 high, and 1 critical). AF-001 records this baseline; dependency remediation requires a separate reviewed ticket because automatic upgrades may change application behavior.

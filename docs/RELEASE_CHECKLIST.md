# Al-Furqan Release Checklist

Use this checklist for production releases. A documentation-only change may mark behavior-specific items not applicable, but build and repository checks still apply.

## Scope and change control

- [ ] Release has a named owner and ticket list.
- [ ] Diff contains only intended changes.
- [ ] Existing unrelated working-tree changes were not overwritten.
- [ ] Feature flags and default states are documented.
- [ ] Database/local-storage/content migrations are versioned and idempotent.
- [ ] Rollback or disable path is defined.

## Religious content

- [ ] Quran text/edition integrity checks pass.
- [ ] New tafsir, Hadith, dua, or book content has source, author/compiler, language, license, and version.
- [ ] Religious-content changes received designated content review.
- [ ] Translation, grading, and scholarly-difference labels are accurate and neutral.
- [ ] Quotes and duas display references where available.
- [ ] No placeholder or synthetic text can appear as Quran/religious source text.

## Security and privacy

- [ ] No API keys, tokens, credentials, or private URLs are present in client bundles or source.
- [ ] Secret scan passes.
- [ ] Dependency vulnerability review is complete.
- [ ] CSP and other security headers remain valid for added origins.
- [ ] External HTML is sanitized or rendered as text.
- [ ] Download/media URLs are validated.
- [ ] Location and notification prompts are preceded by clear explanation.
- [ ] Analytics/logging excludes precise location, notes, bookmarks, reading history, and sensitive query text.
- [ ] Privacy policy and provider disclosures are updated when data flow changes.

## Automated quality gates

- [ ] Clean dependency install succeeds from lockfile.
- [ ] Typecheck passes.
- [ ] ESLint passes.
- [ ] Unit and component tests pass.
- [ ] Content integrity and provider-contract tests pass.
- [ ] Production build passes.
- [ ] Bundle budgets pass or approved variance is recorded.
- [ ] Playwright critical-path smoke tests pass.
- [ ] Automated accessibility checks pass.

## Manual functional verification

- [ ] Home and navigation
- [ ] Quran index and Surah reader
- [ ] Translation and reciter switching
- [ ] Audio play, pause, seek, next, previous, and close
- [ ] Quran search and deep link
- [ ] Bookmark add, view, migration, and remove
- [ ] Inline and standalone tafsir
- [ ] Mushaf navigation
- [ ] Prayer city search, geolocation, method change, and error state
- [ ] Hisnul category, favorite, copy, share, and audio
- [ ] Hadith collection/chapter/content
- [ ] Islamic books list, detail, and external download
- [ ] Not-found and global error recovery

## Accessibility and responsive verification

- [ ] Keyboard-only navigation completes core journeys.
- [ ] Dialog focus is trapped and restored; Escape closes.
- [ ] Icon-only controls have accessible names.
- [ ] Screen-reader smoke test completed.
- [ ] Light and dark contrast checked.
- [ ] Reduced motion checked.
- [ ] 320 px mobile viewport checked.
- [ ] Tablet and desktop breakpoints checked.
- [ ] 200% zoom checked.
- [ ] RTL Arabic and LTR translations render correctly.
- [ ] Sticky header/player/navigation do not overlap content.
- [ ] Safe-area insets work on supported mobile devices.

## PWA, offline, and caching

- [ ] Manifest is valid and icons load.
- [ ] Service worker installs and upgrades cleanly.
- [ ] Old app shell/content caches are retired without deleting user data.
- [ ] Offline behavior is explicit and accurate.
- [ ] Prayer times are not misrepresented as current when stale.
- [ ] Downloaded content storage and removal work.
- [ ] A failed update can recover without requiring manual browser data deletion.

## SEO and metadata

- [ ] Canonical URL is correct.
- [ ] Page title and description are route-specific.
- [ ] Open Graph/Twitter preview is correct.
- [ ] Alias routes redirect or canonicalize.
- [ ] Sitemap and robots rules include/exclude the route appropriately.
- [ ] Structured data validates where used.

## Deployment

- [ ] Staging/preview approval recorded.
- [ ] Environment variables are present in the target environment.
- [ ] Provider quotas and health are acceptable.
- [ ] Monitoring release/version marker is configured.
- [ ] Deployment target is confirmed (Vercel, Azure, or other) and duplicate pipelines cannot race.
- [ ] Production smoke test runs immediately after deploy.
- [ ] Rollback artifact/version is known.

## Post-release

- [ ] Error rate, Web Vitals, provider failures, and audio failures monitored.
- [ ] Quran/content correction channels monitored.
- [ ] No migration or service-worker update spike observed.
- [ ] Release notes published.
- [ ] Follow-up issues created for accepted risks.

## Documentation-only ticket verification

For a docs-only release:

- [ ] No application source or behavior changed.
- [ ] Markdown files exist at expected paths.
- [ ] Internal links and route/file names are accurate.
- [ ] Current build/typecheck result is recorded.
- [ ] Existing lint/test limitations are reported honestly.

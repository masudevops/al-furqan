# Al-Furqan v1 — Release hardening

Release date: August 12, 2026

This milestone strengthens the core Al-Furqan experience before wider release. It focuses on dependable navigation, clearer reading and discovery flows, consistent interactions, accessibility, and automated regression coverage.

## Highlights

- Added a private, device-local **Saved Library** for Quran, Sunnah, and Dua bookmarks.
- Replaced blank utility routes with an intentional destination, redirect, or not-found response.
- Improved Quran search results so available Arabic or translation match context appears with each Ayah.
- Grouped Quran translations by language for faster selection.
- Standardized bookmark controls across Quran, Sunnah, and Dua with accessible saved states.
- Improved settings accessibility with initial focus, keyboard trapping, Escape-to-close, and focus restoration.
- Standardized key loading, empty, and unavailable states across Quran-related content, Sunnah, Dua, and Lessons & Reflections.
- Increased compact controls to practical 44-pixel touch targets where appropriate.
- Added route metadata for Mushaf pages, Dua pages, and Quran Lessons & Reflections.
- Added reliable not-found handling for invalid Quran chapters, Mushaf pages, Quran structures, and malformed Dua or reflection identifiers.
- Removed unnecessary implementation-provider commentary from public-facing screens while preserving religious references and required attribution documentation.
- Updated Quran.Foundation documentation to reflect confirmed production Search and User API scope approval.

## Quality and regression coverage

- Added Playwright coverage for navigation, theme switching, keyboard-modal behavior, local bookmarks, Quran search context, and invalid-route handling.
- Browser coverage runs at 375, 430, 768, 1280, and 1440 pixels.
- Light, dark, and sepia themes are exercised with horizontal-overflow checks.
- Quran audio sequencing and follow/highlight behavior remain covered by the existing unit suite.

## Validation

- TypeScript type checking passed.
- ESLint passed with no warnings.
- 86 unit tests passed across 20 test files.
- The optimized Next.js production build passed.
- Configuration and route smoke checks passed.
- The release-critical Playwright suite passed across the supported browser-size matrix.

## Deployment notes

- No new production environment variables are required for this release.
- Playwright is a development-only dependency and does not increase the production client bundle.
- Signed-in cross-device synchronization remains separate from the anonymous local Saved Library and should only be marked complete after deployed OAuth end-to-end validation.

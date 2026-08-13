# P0 bug — Mushaf page font integrity regression

## Impact

Official QCF page glyph codes could be painted through a fallback Arabic font before the required page-specific QCF V4 color font was registered. This produced malformed, unreadable Quran text in Mushaf view.

## Root cause

The client loader called `document.fonts.check()` before adding the page font. A browser may report an unregistered family as renderable through fallback fonts, so the loader returned without downloading the QCF font.

## Acceptance criteria

- [x] Register and await the official page-specific QCF V4 font before rendering QCF glyph codes.
- [x] Deduplicate current and adjacent page font requests.
- [x] Never expose QCF glyph codes through a fallback font.
- [x] While loading, show a non-text page preparation state.
- [x] If the page font fails, show verified Quran.Foundation Tajweed text rather than malformed or reconstructed content.
- [x] Cover successful registration, request deduplication, and failure behavior with automated tests.

# EPIC — Optional Mushaf layouts and reading controls

## Status

Deferred. The production Mushaf remains the official Quran.Foundation QCF V4 Tajweed layout until each alternative is implemented and validated end to end.

## Outcome

Allow readers to choose among compatible, authoritative Mushaf layouts without treating Quran fonts as interchangeable presentation fonts. Every option must use its matching Quran.Foundation Mushaf ID, text or glyph field, page boundaries, line metadata, and font files.

## Non-negotiable integrity rules

- Never render QCF glyph codes through a font from another QCF version or page.
- Never approximate page or line boundaries.
- Never change a font without also changing to its matching API data and Mushaf identifier.
- Keep the current QCF V4 Tajweed experience as the default.
- Do not expose an option until its Quran text, verse endings, pages, lines, themes, loading state, and failure fallback have been verified.
- Load current fonts from Quran.Foundation's CDN rather than storing permanent local copies.
- If an expected font or source response fails, show verified Unicode Quran text or an unavailable state—never malformed glyphs.

## Candidate layouts

### 1. QCF V4 Tajweed

- Mushaf ID: `19`
- API field: `code_v2`
- Rendering: page-specific QCF V4 COLRv1 fonts
- Purpose: color-coded Tajweed Mushaf
- Status: implemented and remains the default

### 2. QCF V2 Madani

- Mushaf ID: `1`
- API field: `code_v2`
- Rendering: page-specific QCF V2 fonts
- Purpose: modern Madani Mushaf without Tajweed coloring
- Status: candidate; requires a complete separate rendering pipeline

### 3. QCF V1 Madani

- Mushaf ID: `2`
- API field: `code_v1`
- Rendering: page-specific QCF V1 fonts
- Purpose: traditional Madani appearance
- Status: candidate; lower priority than QCF V2

### 4. IndoPak layouts

- Mushaf IDs: `3`, `6`, or `7`, depending on the selected official layout
- API field: `text_indopak` and matching page metadata
- Purpose: South Asian reading conventions, including validated 15-line or 16-line layouts
- Status: research required; page counts and boundaries differ from the 604-page Madani Mushaf

### 5. QPC Hafs Unicode reading

- Mushaf ID: `5`
- API field: `text_qpc_hafs`
- Rendering: official Unicode font
- Purpose: accessible scalable reading, not a pixel-identical printed Mushaf page
- Status: candidate for a clearly named reading layout rather than a Mushaf font toggle

## Delivery plan

### Phase A — Resource and contract audit

- [ ] Confirm the currently available Mushaf resources through Quran.Foundation.
- [ ] Document each candidate's Mushaf ID, page count, API fields, font path, and browser support.
- [ ] Confirm whether the SDK exposes the Pages Lookup and page metadata operations needed for each layout.
- [ ] Define a typed `MushafLayout` contract outside the React component.

### Phase B — Settings design

- [ ] Add a compact Mushaf settings button.
- [ ] Label the control “Mushaf layout,” not “Font,” so users understand that pagination and script may change.
- [ ] Show only implemented and verified layouts.
- [ ] Explain when a layout does not include Tajweed colors.
- [ ] Persist the selected layout locally without requiring sign-in.
- [ ] Add safe display controls such as supported text scale and legend visibility.

### Phase C — Rendering architecture

- [ ] Make API requests include the selected Mushaf ID and matching word fields.
- [ ] Load the exact page font required by the selected layout.
- [ ] Isolate font registrations, request deduplication, loading gates, and fallbacks per layout.
- [ ] Use Pages Lookup when switching between layouts so navigation follows the chosen Mushaf's real boundaries.
- [ ] Preserve verse identity, bookmarks, and deep links across layout changes.

### Phase D — Validation and release

- [ ] Verify every Quran page or a deterministic representative set that covers chapter boundaries, Sajdah, Rub el Hizb, and multi-Surah pages.
- [ ] Test light, dark, and sepia themes, including Tajweed palette contrast.
- [ ] Test 375, 430, 768, 1280, and 1440px widths, RTL, zoom, keyboard access, and reduced motion.
- [ ] Test font timeout, font rejection, stale cache, navigation races, and offline/error states.
- [ ] Confirm no raw QCF glyph code can appear under any failure condition.
- [ ] Add browser regression coverage before enabling each option in production.
- [ ] Update architecture, data-source, and user documentation.

## Acceptance criteria

- Readers can select only authoritative, fully supported Mushaf layouts.
- Switching layouts never changes verse identity or displays malformed Quran text.
- Each layout uses its matching source data, pagination, line positions, and font.
- QCF V4 Tajweed remains the default unless the user explicitly selects another layout.
- Unsupported or failed layouts degrade safely without fabricated, reconstructed, or incorrectly mapped content.

## References

- [Quran.Foundation font rendering guide](https://api-docs.quran.foundation/docs/tutorials/fonts/font-rendering/)
- [Quran.Foundation page layout guide](https://api-docs.quran.foundation/docs/tutorials/fonts/page-layout/)

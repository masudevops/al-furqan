# Epic: Complete Quran.Foundation capability coverage

## Outcome

Use the remaining authoritative Quran.Foundation capabilities that add distinct reader value without duplicating transport variants or weakening Quran integrity. Every religious payload remains source-provided, unmodified, and unavailable when its source fails.

## Delivery order

### 1. Recitation synchronization and memorization

- [x] Play a selected Ayah range using Quran.Foundation Ayah audio.
- [x] Repeat each Ayah 1, 3, or 5 times.
- [x] Highlight the active Ayah and preserve correct pause/resume behavior.
- [ ] Integrate Quran.Foundation timestamp ranges and timestamp-to-Ayah lookup.
- [ ] Highlight the current word only when authoritative word timestamps are returned.
- [ ] Add configurable pauses and continuous range looping.
- [ ] Verify keyboard, reduced-motion, mobile, and screen-reader behavior.

Source: [Audio and timestamp APIs](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/audio-reciter-timestamp/)

### 2. Translation footnotes

- [ ] Discover footnote references in translation payloads.
- [ ] Add a same-origin footnote route.
- [ ] Sanitize provider HTML with an allowlist.
- [ ] Render accessible inline disclosure/popover UI with source attribution.

Source: [Footnote API](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/get-foot-note/)

### 3. Chapter information

- [ ] Retrieve the chapter-information resource dynamically.
- [ ] Add an introduction panel for revelation metadata and sourced background.
- [ ] Handle missing or untranslated information without generated substitutes.

Source: [Chapter APIs](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/list-chapters/)

### 4. Complete structural navigation

- [ ] Add Ruku navigation.
- [ ] Add Manzil navigation.
- [ ] Add a page index and verse-range entry point where it improves navigation.

Sources: [Ruku](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/list-rukus/) and [Manzil](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/list-manzils/)

### 5. Arabic script choices

- [ ] Dynamically confirm available Uthmani Simple, Imlaei, IndoPak, and IndoPak Nastaleeq resources.
- [ ] Add a reader script selector without changing translation, Tafsir, or Ayah identity.
- [ ] Preserve official QCF page rendering as the only exact Mushaf layout.

Source: [Quran script APIs](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/quran-verses-by-script/)

### 6. Ayah study references

- [ ] Add Quran.Foundation Ayah-linked hadith references and full records.
- [ ] Always show collection, hadith number, reference, and provider provenance.
- [ ] Keep this separate from the future Sunnah.com collection browser.
- [ ] Add published Ayah questions and answers with explicit source/type labels.
- [ ] Never present this material as generated advice or a fiqh ruling service.

Sources: [Ayah-linked Hadith](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/hadith-references-by-ayah/) and [Ayah Answers](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/list-ayah-answers/)

### 7. Curated learning and resource discovery

- [ ] Evaluate verified/QDC-curated Quran Reflect lessons before exposing a feed.
- [ ] Request and verify `post.read` (and `comment.read` only if comments are displayed).
- [ ] Audit verse-media resources and recitation-style metadata.
- [ ] Add language/source information pages for translations and Tafsir.
- [ ] Consider a clearly labelled random-Ayah reading prompt.

Sources: [Quran Reflect feed](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/posts-controller-feed/) and [Resource APIs](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/recitation-info/)

### 8. User synchronization completion

- [ ] Complete signed-in UI for bookmark, note, collection, goal, and preference synchronization.
- [ ] Verify production OAuth callback, consent, refresh, logout, and each approved scope end to end.
- [ ] Keep anonymous local reading and bookmarking fully functional.
- [ ] Define conflict behavior before merging local and remote records.

## Explicit exclusions and constraints

- Do not permanently store or ship a complete Quran.Foundation corpus. Current terms limit caching unless written permission says otherwise.
- Do not fabricate missing Quran, translation, Tafsir, Hadith, answer, or reflection content.
- Do not implement every equivalent by-Surah/by-Juz/by-page endpoint as a separate feature.
- Do not enable unmoderated community reflections by default.

## Definition of done for each item

- Authoritative source and scope documented in `docs/DATA-SOURCES.md`.
- Same-origin server boundary protects tokens and credentials.
- Loading, empty, unavailable, and malformed-provider states covered.
- Unit and route tests cover transforms and failure behavior.
- Responsive, keyboard, RTL, theme, and reduced-motion behavior checked.
- Required repository verification commands pass.

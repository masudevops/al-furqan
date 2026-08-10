# Epic: Complete Quran.Foundation capability coverage

## Outcome

Use the remaining authoritative Quran.Foundation capabilities that add distinct reader value without duplicating transport variants or weakening Quran integrity. Every religious payload remains source-provided, unmodified, and unavailable when its source fails.

## Delivery order

### 1. Recitation synchronization and memorization

- [x] Play a selected Ayah range using Quran.Foundation Ayah audio.
- [x] Repeat each Ayah 1, 3, or 5 times.
- [x] Highlight the active Ayah and preserve correct pause/resume behavior.
- [x] Integrate Quran.Foundation full-chapter timestamp ranges and timestamp-to-Ayah lookup.
- [x] Highlight the current word only when authoritative word timestamps are returned.
- [x] Add configurable pauses and continuous range looping.
- [x] Verify keyboard, reduced-motion, mobile, and screen-reader behavior.

Source: [Audio and timestamp APIs](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/audio-reciter-timestamp/)

### 2. Translation footnotes

- [x] Discover footnote references in translation payloads.
- [x] Add a same-origin footnote route.
- [x] Sanitize provider HTML with an allowlist.
- [x] Render accessible inline disclosure UI with source attribution.

Source: [Footnote API](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/get-foot-note/)

### 3. Chapter information

- [x] Retrieve the chapter-information resource dynamically.
- [x] Add an introduction panel for sourced background.
- [x] Handle missing or untranslated information without generated substitutes.

Source: [Chapter APIs](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/list-chapters/)

### 4. Complete structural navigation

- [x] Add Ruku navigation.
- [x] Add Manzil navigation.
- [x] Add a page entry point and verse-range reader.

Sources: [Ruku](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/list-rukus/) and [Manzil](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/list-manzils/)

### 5. Arabic script choices

- [x] Request official Uthmani Simple, Imlaei, IndoPak, and IndoPak Nastaleeq fields from the Content API and show unavailable states instead of substitutes.
- [x] Add a reader script selector without changing translation, Tafsir, or Ayah identity.
- [x] Preserve official QCF page rendering as the only exact Mushaf layout.

Source: [Quran script APIs](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/quran-verses-by-script/)

### 6. Ayah study references

- [x] Add Quran.Foundation Ayah-linked hadith full records.
- [x] Always show collection, hadith number, grade when returned, and provider provenance.
- [x] Keep this separate from the future Sunnah.com collection browser.
- [x] Add published Ayah questions and answers with explicit source/type labels.
- [x] Never present this material as generated advice or a fiqh ruling service.

Sources: [Ayah-linked Hadith](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/hadith-references-by-ayah/) and [Ayah Answers](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/list-ayah-answers/)

### 7. Quran Reflect Lessons & Reflections

- [ ] Request and verify the Quran Reflect `post.read` scope for the production client. **OWNER CONFIRMATION REQUIRED.**
- [x] Add a same-origin, read-only feed and individual lesson/reflection detail route.
- [x] Expose only the Quran.Foundation/QDC-curated English feed by default; do not present an unmoderated community feed as religious guidance.
- [x] Preserve provider-supplied author, type, verification state, Ayah links, and Quran Reflect attribution on every item.
- [x] Link Ayah-specific lessons back to the exact Quran reader location without merging reflection text into Quran or Tafsir.
- [x] Sanitize provider HTML with an allowlist and cover loading, empty, unavailable, and malformed-provider states.
- [x] Keep comments out of the initial release. Request `comment.read` separately only if a later reviewed design displays comments.

Source: [Quran Reflect Lessons and Reflections API](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/posts-controller-feed/)

### 8. Additional curated resource discovery

- [x] Audit and expose verse-media resources and recitation-style metadata dynamically.
- [x] Add a language/source information page for translations and Tafsir.
- [x] Consider a clearly labelled random-Ayah reading prompt. Deferred because it adds no distinct authoritative content beyond existing navigation and search.

Source: [Resource APIs](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/recitation-info/)

### 9. User synchronization completion

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

# EPIC — UmmahAPI expansion and source-quality audit

## Objective

Use UmmahAPI only where it adds a well-sourced capability that Quran.Foundation does not provide or materially improves a non-Quran utility. This is not a wholesale provider migration. Quran text, translations, Tafsir, recitation, Mushaf resources, Search, and Quran user data remain Quran.Foundation-first.

## Audit snapshot (2026-08-10)

- API/OpenAPI version: 2.0.0.
- Authentication: optional. Anonymous access is documented as 5,000 general requests per 15 minutes and 300 calculation requests per minute; a free API key raises those limits.
- Published license label: “Free to use (sadaqah jariah).” This is not a standard software/data license and does not fully define redistribution, mirroring, or long-term caching rights.
- Responses generally include a source or service identifier, but provenance quality differs significantly by dataset.
- Every religious-content adapter must retain upstream attribution, validate required fields, and fail closed.

## Critical Hadith decision

**Status: on hold pending the owner's Sunnah.com API request. Do not implement or publish.**

Although UmmahAPI advertises 36,000+ records across several collections, its live collection response identifies the source as `fawazahmed0/hadith-api (via jsDelivr CDN)`. That is the same dataset Al-Furqan previously declined to publish. Live checks also found nine reachable collections rather than the advertised ten, no separate book/chapter fields in tested records, and generic grades without a named grading authority. UmmahAPI remains only a fallback candidate if official Sunnah.com access is unavailable and the owner later accepts those limitations.

- [x] Keep `SUNNAH_NOW_ENABLED` off.
- [x] Do not point the Sunnah adapter at UmmahAPI.
- [ ] Wait for the owner's submitted Sunnah.com API-access request.
- [ ] If access is granted, audit Sunnah.com's collections, references, grading authority, terms, and response contract before implementation.
- [ ] Remove the abandoned sunnah.now implementation before the next production release.
- [ ] If Sunnah.com access is declined or unavailable, reassess alternatives with Arabic, translation, canonical reference, and named grade authority.
- [ ] Keep the Sunnah page in a clean unavailable state until that source exists.

## Prioritized workstreams

### P1 — Salah Times improvements (initial slice implemented)

UmmahAPI adds explicit IANA timezone output, ISO timestamps, 23 calculation methods, high-latitude rules, a month endpoint, and a Ramadan timetable.

- [x] Keep AlAdhan as the current stable provider for daily/monthly Salah calculations.
- [x] Add high-latitude rule selection and explain when it applies.
- [ ] Compare UmmahAPI and AlAdhan results across representative locations before choosing a default.
- [x] Add a Ramadan timetable view using Suhoor/Fajr and Iftar/Maghrib values, clearly labelled as calculations.
- [x] Cache Ramadan calculations by coordinates, year, method, madhab, timezone, and high-latitude rule.
- [ ] Never present calculated times as a local mosque's authoritative timetable.

### P2 — Dua catalog expansion

UmmahAPI documents 126 Arabic/transliteration/translation entries across 27 categories with a source field, which could improve the current five-category catalog. The API does not document audio.

- [ ] Obtain written clarification of the underlying Dua dataset, edition, translation source, and redistribution/caching license.
- [ ] Sample-audit every response shape and confirm source references are specific and traceable.
- [ ] Add an `UmmahApiDuaAdapter` only after the provenance gate passes.
- [ ] Preserve existing sourced audio matching as a separate optional layer; never infer an audio/text match.
- [ ] Compare category coverage, duplicates, repeat counts, and references against the current provider.
- [ ] Migrate bookmarks through stable provider-neutral Dua IDs if the source changes.

### P3 — Mutashabihat memorization aid (implemented)

This is a meaningful Quran-adjacent feature not currently supplied by Quran.Foundation. UmmahAPI attributes the relationship dataset to `Waqar144/Quran_Mutashabihat_Data` and verse text to Quran.com API v4.

- [x] Verify the upstream permission and documented methodology/maintainer attribution.
- [x] Confirm the relationships are curated and non-exhaustive, and display that distinction.
- [x] Use Quran.Foundation for displayed Quran text; use UmmahAPI only for verse-reference relationships.
- [x] Add “Similar Ayahs” under Memorize with direct reader links.
- [ ] Never alter or reconstruct Quran text from the relationship dataset.

### P4 — Hijri calendar and Islamic events (date adjustment implemented)

- [x] Add a calculated Hijri display date alongside the existing AlAdhan prayer response.
- [x] Allow a user-visible, locally persisted Hijri-date adjustment because communities may differ.
- [ ] Label the moon endpoint accurately: its documentation says it uses the Kuwaiti tabular algorithm, so it must not be presented as verified local moon sighting.
- [ ] Treat event descriptions as religious content and require documented provenance before display.

### P5 — Qibla enhancement (implemented)

- [x] Keep AlAdhan as the current bearing source unless comparison testing establishes a reason to switch.
- [x] Show approximate distance to the Kaaba from UmmahAPI when available.
- [ ] Cross-check bearings for a geographic test matrix and retain the existing sensor/static fallbacks.

## Deferred or blocked services

### Asma-ul-Husna — blocked pending provenance

The API supplies Arabic, transliteration, English label, and explanatory meaning but does not identify the edition, translator, or scholarly source in the endpoint response/documentation.

- [ ] Request data provenance and licensing.
- [ ] Do not publish meanings until verified; Arabic names alone also require a declared canonical source.

### Zakat calculator — blocked pending scholarly and financial review

This is high-stakes religious and financial functionality. A generic 2.5% computation does not cover all asset classifications and school-specific rulings.

- [ ] Require named scholarly methodology, jurisdiction/fiqh review, price-provider attribution, precision rules, liability treatment, and prominent limitations.
- [ ] Do not ship personalized rulings or present computed results as a fatwa.

### Islamic names — low priority, blocked pending provenance

- [ ] Verify linguistic/scholarly sources for meanings, roots, origins, and notes before considering UI work.

### Duplicate Quran and Tafsir services — do not adopt

- [x] Keep Quran.Foundation as source of truth for Quran, translations, Tafsir, word-by-word, Tajweed, Mushaf, audio, Search, and user APIs.
- [ ] Consider UmmahAPI Quran endpoints only as an operational diagnostic, never an automatic content fallback.

## Architecture

- All calls go through same-origin server routes and provider adapters.
- Optional `UMMAH_API_KEY` is server-only and must never use a `NEXT_PUBLIC_` prefix.
- Start anonymously during evaluation; request/use a key only if measured traffic requires it.
- Cache calculations and non-religious metadata conservatively; do not mirror religious corpora until licensing explicitly permits it.
- Record provider, upstream dataset, version, attribution, cache policy, and failure behavior in `docs/DATA-SOURCES.md` before enabling each feature.
- Feature flags are independent per service; there is no global “enable UmmahAPI” switch.

## Questions for UmmahAPI before religious-content adoption

1. What is the exact license for each dataset and may applications cache or redistribute responses?
2. What are the original editions/translations and correction workflows for Dua, Tafsir, Asma-ul-Husna, Islamic names, and event descriptions?
3. Who assigned Hadith `grade`, and can the API return the named grading authority and canonical book/chapter references?
4. How are breaking data corrections/version changes announced?
5. Is there a status/SLA policy and are API keys restricted by origin or server IP?

## Delivery order

1. Provider-neutral Salah comparison and high-latitude/ISO support.
2. Ramadan timetable.
3. Dua provenance decision and, if approved, catalog migration.
4. Mutashabihat provenance decision and memorization UI.
5. Hijri calendar/date adjustment and Qibla distance.
6. Reconsider blocked services only after written provenance answers.
7. Handle Hadith separately after the Sunnah.com request is resolved; it is not part of the active UmmahAPI implementation scope.

## Definition of done for each enabled service

- Source and license are documented.
- Required fields and identifiers are validated; source failures show unavailable states.
- No religious text, translation, grade, meaning, or ruling is inferred.
- Responsive, theme, keyboard, loading, empty, and failure states are verified.
- Unit, route, build, and smoke checks pass.

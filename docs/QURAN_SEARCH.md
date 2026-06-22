# AF-005B Quran Search 2.0

**Completed:** June 21, 2026

## Supported search editions

- Arabic — `quran-simple`
- English — `en.sahih`
- Bengali — `bn.bengali`
- Urdu — `ur.jalandhry`

The list is intentionally curated to editions already used by Al-Furqan. Adding an edition requires provider availability, attribution, and fixture coverage.

## Search behavior

- Ordinary searches use the provider search endpoint.
- A selected Surah is sent as the provider search scope.
- A selected Juz uses the provider Juz endpoint and performs normalized matching locally because provider search responses do not include reliable Juz metadata.
- A combined Surah and Juz filter returns only matches satisfying both.
- Requests are debounced, cancellable, and protected against stale responses.
- Provider responses are validated before entering UI state.

## Arabic normalization

Search comparison:

- removes Quranic/Arabic vowel and recitation marks;
- removes tatweel;
- normalizes alif variants, including alif wasla, to `ا`;
- normalizes `ى` to `ي`;
- normalizes hamza-on-waw/ya to their base letters.

The displayed Quran text is never modified. Highlighting maps normalized matches back to the original provider text, preserving its marks.

## Shareable state

Search state is represented by URL parameters:

- `q`
- `edition`
- `surah`
- `juz`

Loading a URL containing `q` opens the search dialog and restores valid filters. Invalid filter values fall back safely.

## Privacy and history

Up to five successful queries are stored locally under `alFurqan.quran.searchHistory`. Queries are deduplicated case-insensitively and can be cleared in the dialog. Search text is not sent to analytics by this feature.

## Deferred

- Search analytics
- Offline full-Quran search index
- Morphology, root, and topic search
- Additional editions pending source review

# AF-004 Reading Continuity

**Completed:** June 21, 2026

## Behavior

- Bookmarks, last read, and recent Surahs share one versioned local document.
- Saving “last read” is an explicit reader action; merely scrolling does not record progress.
- Opening a Surah records it in a bounded five-item recent list.
- Resume links use canonical `/quran/:surah#ayah-:ayah` routes.
- The bookmarks page renders Quran references and local metadata without per-bookmark network requests.

## Storage

- Current key: `alFurqan.quran.continuity`
- Schema version: `1`
- Legacy key: `quranBookmarks`

Valid legacy `{surah, ayah}` and `{surahNumber, ayahNumber}` records migrate automatically. Duplicate and invalid Quran references are discarded. The legacy key is retained as rollback evidence and is not used for subsequent writes.

Corrupted or unknown current documents recover to a validated legacy migration or an empty state. User continuity data remains local and is not logged or transmitted.

## Boundaries

Domain contracts and repository behavior live under `src/core/quran`. Browser storage selection lives under `src/platform/web`. Future mobile adapters can implement the same repository contract without importing React or browser APIs.

## Deferred

- Import/export UI
- Tags, notes, folders, and reading statistics
- Accounts and cloud sync
- IndexedDB migration

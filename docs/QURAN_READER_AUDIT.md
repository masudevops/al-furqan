# AF-003 Quran Reader Audit

**Audit date:** June 20, 2026

## Flow before AF-003

| Area | Existing behavior | Finding |
|---|---|---|
| Surah list | Local JSON, client-side name/number search | Fast and complete, but typed fields claimed ayah counts that the JSON did not contain |
| Surah detail | Two direct AlQuran Cloud requests merged in the route | Provider payloads were cast with `any`; text, audio, bookmarks, tafsir, and UI state lived in one page |
| Ayah rendering | Card per ayah with Arabic, translation, and actions | Arabic typography was inconsistent and fixed; action density and sticky controls were tight on mobile |
| Translation | Selected edition stored in global settings | Always rendered; provider failure could return Arabic fallback content in the translation position |
| Search | Remote AlQuran Cloud translation search | Deep links work; raw regular-expression HTML highlighting remains a separate security/search ticket |
| Bookmarks | `{surah, ayah}` records in `localStorage` | Add/remove and deep links work; no schema version, timestamps, notes, or efficient enrichment |
| Last read/progress | Not implemented | No reliable reading-position model existed |
| Loading/error | Full-screen text and generic return-home action | No skeleton, retry action, or Arabic-only partial-success state |

## AF-003 changes

- Canonical Surah, edition, ayah-reference, reader-ayah, and reader-Surah contracts now live under `src/core/quran`.
- Local metadata is validated and enriched with canonical ayah counts.
- Quran provider responses are validated before entering the UI.
- Arabic text is required; translation failure now produces an Arabic-only reader with a clear status message.
- Synthetic “offline ayah” content was removed so application messages cannot be mistaken for Quran text.
- Reader preferences are platform-neutral and accept a generic key/value storage interface.
- Arabic size, translation visibility, and comfortable/compact spacing persist locally.
- Surah header, ayah references, Arabic typography, translation separation, loading, retry, and mobile spacing were improved.

## Intentionally deferred

- Search safety and normalized Arabic search
- Bookmark schema migration and last-read progress
- Audio architecture and controls
- Tafsir architecture
- Offline Quran download/versioning
- Full Surah detail component decomposition

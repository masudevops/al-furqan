# Quran.Foundation Phase 3 feature audit

Audit date: 2026-08-09

This report compares the installed `@quranjs/api` SDK, the official Quran.Foundation API documentation, and the current Al-Furqan source. It intentionally precedes any new Quran feature implementation.

## Access baseline

- **Confirmed now:** Quran.Foundation Content API v4 through the server-side app-token flow and the `content` scope.
- **Documented but not approved/working for this client:** Search v1. Both production and pre-production token requests for `search` were rejected during verification. Keep the sourced unavailable state until Quran.Foundation approves the scope.
- **Owner-confirmed on 2026-08-09:** Search and the requested user scopes (`bookmark`, `collection`, `note`, `goal`, `preference`, and related user access) were enabled for production. Signed-in synchronization still needs complete product UI and deployed end-to-end validation.

The Phase 3 brief describes tafsir, word-by-word, Mushaf view, Quran search, synced bookmarks, and memorization tools as already built. The current source does not support that description: some have server scaffolding, while others are not implemented. The table below is the release-accurate status.

## Current implementation

| Quran.Foundation capability | Current Al-Furqan status | Release assessment |
|---|---|---|
| Chapters and chapter metadata | All 114 chapters are listed from Content v4 | Implemented |
| Verses by chapter | Verse-by-verse reader uses authoritative Uthmani text | Implemented |
| Tajweed text | Official `text_uthmani_tajweed` is rendered through a strict annotation allowlist | Implemented in verse mode |
| Translation resources and verse translations | Resources are discovered dynamically; users can select available translations | Implemented |
| Ayah-by-ayah recitations | Reciters are discovered dynamically with sequential verse playback | Implemented |
| Search v1 | Same-origin adapter and UI code exist, but the required scope is rejected | Built but unavailable; not production-complete |
| Bookmarks, collections, notes, goals, preferences | User API route plumbing exists; production scope approval and a complete account-facing UX are not verified | Partially wired; not production-complete |
| Reading sessions | SDK capability is present; no complete app feature | Not implemented |
| Tafsir | Resources are discovered dynamically and verse content is available from the reader | Implemented in Phase 3 |
| Word-by-word data | Optional reader lens renders sourced Arabic, transliteration, and translation | Implemented in Phase 3 |
| Local bookmarks | Versioned provider-neutral local bookmarks for Quran and Dua | Implemented in Phase 3; no sign-in required |
| Exact Mushaf/page view | Official QCF V2 page data, line numbers, glyph codes, and per-page fonts | Implemented in Phase 3 |
| Juz/hizb/rub navigation | Authoritative structural verse navigation | Implemented in Phase 3 |
| Memorization tools | No complete repeat/range/session/goal workflow | Not implemented |

## Available Content API features reviewed for prioritization

These use the already working server-side Content v4 access and fit naturally inside **Quran**; none needs another top-level navigation item.

| Feature | What Quran.Foundation provides | Natural product placement | Suggested priority |
|---|---|---|---|
| Tafsir | Discoverable tafsir resources plus tafsir content by chapter/verse | Reader study control | Implemented |
| Word-by-word | Word text, position, translation/transliteration, and related word metadata/audio where returned | Optional reader lens | Implemented |
| Quran structure navigation | Verses and metadata by Juz, page, Hizb, and Rub el Hizb | Quran browse/index | Implemented for Juz/Hizb/Rub |
| Official Mushaf rendering | Page data and QCF font/code resources for exact layouts | Dedicated Mushaf route | Implemented with official QCF V2 resources |
| Chapter information | Sourced chapter introductions and metadata | Chapter information panel | P2 |
| Full-chapter audio | Chapter-reciter files; timestamp/word segments may be requested | Audio player and memorization controls | P2 |
| Recitation metadata/styles | More descriptive reciter/style information than the current selector exposes | Audio settings | P2 |
| Random ayah | Server-selected verse, optionally constrained by Quran structure and enriched with translations/tafsir/audio | A clearly labelled sourced “Random ayah” card | P3 |
| Footnotes | Translation footnote lookup | Translation footnote popover | P2 |
| Verse media | Discoverable media resources associated with verses | Optional verse resources area | P3; inspect every resource before exposure |
| Ayah-linked hadith references | References related to a Quran verse | Verse study panel | P3; this is not a complete Sunnah collection |
| Quran Reflect material | Lessons/reflections are documented in the broader API surface | Separate, clearly attributed study content within Quran | Defer pending access, provenance, and product review |

The current dynamic translation and recitation selectors already benefit when Quran.Foundation adds or removes resources; there is no reason to hard-code “additional” resources as separate features.

## Features requiring additional approved scopes

| Feature | Required access | Current status | Placement if approved |
|---|---|---|---|
| Quran search | App-token `search` scope | Rejected for both configured environments during verification | Quran search |
| Synced bookmarks and collections | User OAuth `bookmark collection` | Owner confirmation required | Quran reader/account library |
| Synced notes | User OAuth `note` | Owner confirmation required | Clearly labelled “My Notes” in reader |
| Synced preferences | User OAuth `preference` | Owner confirmation required | Settings |
| Reading goals and daily estimates | User OAuth `goal` | Owner confirmation required | Quran reading plan, not top-level nav |
| Reading sessions | User OAuth `reading_session` | Owner confirmation required | Reading history/progress |
| Streaks and activity days | User OAuth `streak activity_day`; newer documented endpoints may require an SDK update or raw operation | Owner confirmation required | Optional progress view; avoid pressure or manipulative mechanics |

Quran.Foundation bookmarks are Quran-user data. Sunnah and Dua bookmarks must use Al-Furqan's provider-neutral local/domain model unless Quran.Foundation explicitly documents support for those external entity types.

## Recommended implementation order

1. **Completed now:** Tafsir, word-by-word, local bookmarks, official Mushaf pages, and Juz/Hizb/Rub navigation.
2. **Held priority 4:** full-chapter audio with timestamps, footnotes, and chapter information.
3. **Held priority 5:** synced bookmarks/notes/collections/preferences, reading goals/sessions, and other progress features after actual scope approval.

This ordering closes the biggest gaps in the existing reader before adding secondary discovery or progress features.

## Exact access request checklist

- Application/server scope: `search`.
- Minimum OIDC/User API scope string: `openid offline_access bookmark note collection goal preference`.
- Optional forward-looking additions: `reading_session activity_day streak`.
- Ask Quran.Foundation to approve both the production and pre-production clients and their exact callback URLs. Until approval is verified against each real client, status remains **OWNER CONFIRMATION REQUIRED**.

## Official references

- [Content API v4 overview](https://api-docs.quran.foundation/docs/category/content-apis-4.0.0/)
- [Content API authentication](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/content-apis/)
- [User API categories](https://api-docs.quran.foundation/docs/category/user-related-apis/)
- [User OAuth and scopes](https://api-docs.quran.foundation/docs/tutorials/sync/getting-started/)
- [Search API](https://api-docs.quran.foundation/docs/search_apis_versioned/1.0.0/quran-foundation-search-api/)
- [Random verse](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/random-verse/)
- [Chapter information](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/get-chapter-info/)
- [Chapter audio with segments](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/chapter-reciter-audio-file/)
- [Hadith references by ayah](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/hadith-references-by-ayah/)

# Quran.Foundation capability matrix

Verified against official documentation on 2026-08-09. “Verified” means documented, not approved for this specific OAuth client.

| Feature | API | Auth | Scope | Documented | Implementation |
|---|---|---|---|---|---|
| Chapters | Content v4 | App | content | Yes | Complete slice |
| Verses | Content v4 | App | content | Yes | Complete slice, max 50/page |
| Translation resources | Content v4 Resources | App | content | Yes | Implemented; English catalog discovered at runtime |
| Tafsir/resources | Content v4 | App | content | Yes | Planned |
| Recitations/audio | Content v4 | App | content | Yes | Implemented; reciters discovered dynamically, per-Ayah audio with continuous playback |
| Pages/Juz/Hizb/Rub/Ruku/Manzil | Content v4 | App | content | Yes | Planned |
| Word-by-word | Content v4 verses | App | content | Yes | Planned |
| Tajweed-annotated Uthmani text | Content v4 verses | App | content | Yes | Implemented as optional sanitized color lens in verse mode |
| Search | Search v1 | App | search | Yes | UI and server adapter complete; client token exchange rejected in production and pre-live on 2026-08-09; owner approval required |
| Bookmarks | User | User | bookmark | Yes | Server route inherited; owner approval required |
| Notes | User | User | note | Yes | Server route inherited; owner approval required |
| Collections | User | User | collection | Yes | Server route inherited; owner approval required |
| Goals | User | User | goal | Yes | Server route inherited; owner approval required |
| Preferences | User | User | preference | Yes | Server route inherited; owner approval required |
| Reading sessions | User | User | reading_session | Yes | Planned; owner approval required |

SDK boundary: `@quranjs/api/server` is required for Content, Search, confidential exchange, refresh, and normal web User API calls. `@quranjs/api/public` is limited to public-client/browser-safe OAuth helpers. Production and pre-live user stacks must not be mixed.

Requested v1 scopes: `openid offline_access user note collection bookmark goal preference reading_session`. Every feature scope is **OWNER CONFIRMATION REQUIRED** for the actual client. `post` and `comment` were removed.

## Environment verification

- Production Content v4 returned all 114 chapters, authoritative Uthmani verse text, and 145 discoverable translation resources across available languages on 2026-08-09.
- Official documentation exposes both QCF V4 Tajweed (Mushaf 19) for page/font rendering and `text_uthmani_tajweed` annotations. Phase 2 uses the annotated text in the existing verse renderer; exact QCF page layout is not claimed.
- Production Content v4 returned 12 Ayah-by-Ayah reciters. Al-Fatihah recitation ID 7 returned seven HTTPS audio files; the first asset responded `206 audio/mpeg` during playback verification on 2026-08-09.
- Production and pre-live Search v1 both rejected the app-token request with HTTP 400. The application displays a sourced-feature unavailable state and does not substitute results. The owner must confirm that the `search` scope is approved for the exact client and environment.
- Production and pre-live credentials are separate configurations. Do not combine an OAuth host or user session from one environment with API credentials from the other.

Sources: Quran.Foundation JavaScript SDK, API Reference, OAuth Scopes, OAuth2 Quickstart, Content API v4, and Developer Terms.

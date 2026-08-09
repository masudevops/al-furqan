# Quran.Foundation capability matrix

Verified against official documentation on 2026-08-09. “Verified” means documented, not approved for this specific OAuth client.

| Feature | API | Auth | Scope | Documented | Implementation |
|---|---|---|---|---|---|
| Chapters | Content v4 | App | content | Yes | Complete slice |
| Verses | Content v4 | App | content | Yes | Complete slice, max 50/page |
| Translation resources | Content v4 Resources | App | content | Yes | Discovery planned; configured ID is temporary |
| Tafsir/resources | Content v4 | App | content | Yes | Planned |
| Recitations/audio | Content v4 | App | content | Yes | Planned |
| Pages/Juz/Hizb/Rub/Ruku/Manzil | Content v4 | App | content | Yes | Planned |
| Word-by-word | Content v4 verses | App | content | Yes | Planned |
| Search | Search v1 | App | search | Yes | Server adapter inherited; product UI planned |
| Bookmarks | User | User | bookmark | Yes | Server route inherited; owner approval required |
| Notes | User | User | note | Yes | Server route inherited; owner approval required |
| Collections | User | User | collection | Yes | Server route inherited; owner approval required |
| Goals | User | User | goal | Yes | Server route inherited; owner approval required |
| Preferences | User | User | preference | Yes | Server route inherited; owner approval required |
| Reading sessions | User | User | reading_session | Yes | Planned; owner approval required |

SDK boundary: `@quranjs/api/server` is required for Content, Search, confidential exchange, refresh, and normal web User API calls. `@quranjs/api/public` is limited to public-client/browser-safe OAuth helpers. Production and pre-live user stacks must not be mixed.

Requested v1 scopes: `openid offline_access user note collection bookmark goal preference reading_session`. Every feature scope is **OWNER CONFIRMATION REQUIRED** for the actual client. `post` and `comment` were removed.

Sources: Quran.Foundation JavaScript SDK, API Reference, OAuth Scopes, OAuth2 Quickstart, Content API v4, and Developer Terms.

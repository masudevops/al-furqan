# Data source registry

| Feature | Provider | Purpose | License/storage/update | Status |
|---|---|---|---|---|
| Quran, translations, Tafsir, recitations, metadata | Quran.Foundation Content API v4 and Quran CDN URLs returned by the API | Authoritative Quran experience | Developer Terms; display in app, unmodified Quran; cache at most one week unless expressly permitted; refresh from API; source attribution required | Quran, dynamic translations, and dynamic Ayah recitations active; Tafsir planned |
| Tajweed annotations | Quran.Foundation Content API v4 `text_uthmani_tajweed` | Color-rule lens over the verse reader | Same Quran.Foundation Developer Terms; fetched with the verse and sanitized to documented Tajweed rule tags/classes | Active; QCF V4 page-font rendering remains separate future Mushaf work |
| Search | Quran.Foundation Search API | Quran search | Same Foundation terms; app-token server access | Adapter present, UI planned |
| User Quran data | Quran.Foundation User APIs | Bookmarks, notes, collections, goals, preferences, reading sessions | OAuth consent and approved scopes; private server session; user revoke/delete support required | Owner confirmation required |
| Hadith | Sunnah.com API planned | Browse/search Arabic + English records with references and grades | API key and production terms pending | Disabled at navigation, UI, and API route layers; do not enable until Sunnah.com integration is verified |
| Prayer calculation and calculated Hijri date | AlAdhan API v1 | Five daily times, next-prayer countdown, calculation methods, Asr school | No key; browser daily cache; follow AlAdhan credits/terms; calculated Hijri date is not presented as a moon-sighting declaration | Active |
| Dua/Adhkar/Names/Adhan audio | Not selected | Daily worship | Authoritative text and explicit license required | Later phase |

There is no mystery or LLM-generated religious content in the production path.

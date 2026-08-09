# Data source registry

| Feature | Provider | Purpose | License/storage/update | Status |
|---|---|---|---|---|
| Quran, translations, Tafsir, recitations, metadata | Quran.Foundation Content API v4 | Authoritative Quran experience | Developer Terms; display in app, unmodified Quran; cache at most one week unless expressly permitted; refresh from API; source attribution required | Quran slice active; dynamic secondary-resource discovery planned |
| Search | Quran.Foundation Search API | Quran search | Same Foundation terms; app-token server access | Adapter present, UI planned |
| User Quran data | Quran.Foundation User APIs | Bookmarks, notes, collections, goals, preferences, reading sessions | OAuth consent and approved scopes; private server session; user revoke/delete support required | Owner confirmation required |
| Hadith | Not selected | Complete library | License, Arabic, translations, grading, numbering and storage must be verified | Blocked from implementation pending research |
| Prayer calculation | Not selected | Local Salah times/Qibla | Library license and calculation behavior must be reviewed | Later phase |
| Hijri calendar | Not selected | Calculated Hijri dates | Must distinguish calculation from declared moon sighting | Later phase |
| Dua/Adhkar/Names/Adhan audio | Not selected | Daily worship | Authoritative text and explicit license required | Later phase |

There is no mystery or LLM-generated religious content in the production path.

# Hadith source and integrity policy

Status: active with UmmahAPI as an interim provider while the owner waits for Sunnah.com API access.

UmmahAPI supplies the live collection catalog, Arabic text, English translation, collection/Hadith identifiers, search results, and a grade where available. Its catalog identifies `fawazahmed0/hadith-api (via jsDelivr CDN)` as the upstream dataset. Al-Furqan discloses that provenance and keeps the integration behind `HadithSourceAdapter` so it can be replaced without rewriting the UI.

Al-Furqan intentionally excludes Shah Waliullah's 40 Hadith from the published catalog and blocks direct access to that collection. All other valid collections returned by the live catalog remain dynamically available.

The tested API responses do not identify the scholar responsible for a grade and do not consistently supply separate book, chapter, or narrator fields. Al-Furqan therefore:

- labels grades as “supplied by UmmahAPI”;
- never invents a grading scholar, book, chapter, narrator, or missing grade;
- always displays the collection and Hadith number;
- requires an identifier plus Arabic and English before publishing a record;
- shows an unavailable state instead of substitute content when the provider fails.

Local bookmarks use the shared versioned bookmark store. Cross-device synchronization remains deferred until an external-content bookmark schema is defined. `HADITH_ENABLED=false` can disable all provider access immediately. `UMMAH_API_KEY` is optional and server-only.

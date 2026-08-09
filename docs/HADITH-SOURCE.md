# Hadith source and integrity policy

Status: Phase 2 ships a constrained browser backed by `fawazahmed0/hadith-api` through jsDelivr.

The repository supplies multiple collections and language editions, collection/book structure, references, and grade metadata. Its repository license is the Unlicense. The app never infers a grade from a collection name and never asks an LLM to complete or translate a record. A record is published only when the selected provider response contains Arabic, English translation, collection, book, Hadith/reference numbers, and at least one grade with the named grader. This deliberately excludes some well-known collection records whose current provider payload has an empty `grades` array.

`HadithSourceAdapter` isolates catalog, list/search, and detail operations. A Sunnah.com adapter can replace or dual-source the current provider without changing the UI. Requesting a Sunnah.com key through the owner's GitHub/account is still an owner action and was not performed by this build.

Bookmarks are local and keyed by provider collection plus Hadith number. They are not sent through Quran.Foundation's Quran bookmark schema because that would misrepresent external content. Cross-device synchronization needs an explicitly supported external-content schema and approved user scope before it can be enabled.

Source: <https://github.com/fawazahmed0/hadith-api>. CDN: jsDelivr pinned to repository release tag `1`, with a one-day Next.js revalidation interval.

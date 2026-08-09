# Hadith source and integrity policy

Status: disabled. No Hadith provider is published while Sunnah.com API access is pending.

The initial `fawazahmed0/hadith-api` adapter remains in the working tree as non-public scaffolding, but its feature flag is off, navigation is hidden, and all same-origin Hadith API routes return HTTP 503 without contacting that provider. It must not be enabled in production.

`HadithSourceAdapter` isolates catalog, list/search, and detail operations so a verified Sunnah.com adapter can replace the disabled provider without rewriting the UI. The owner has initiated the Sunnah.com API-key request. When access is granted, the server adapter, response mappings, attribution, caching limits, and production behavior must be verified before the feature flag changes.

Hadith bookmarks are also disabled. They must not be sent through Quran.Foundation's Quran bookmark schema because that would misrepresent external content. Cross-device synchronization needs an explicitly supported external-content schema before it can be enabled.

Planned source documentation: <https://sunnah.stoplight.io/docs/api/skano6c6wbtl5-sunnah-com-api>.

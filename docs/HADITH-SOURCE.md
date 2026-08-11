# Hadith source and integrity policy

Status: disabled and on hold while the owner waits for a submitted Sunnah.com API-access request. The sunnah.now integration was cancelled because its early-access catalog contains only Sahih al-Bukhari. UmmahAPI Hadith is not approved: its live response identifies `fawazahmed0/hadith-api via jsDelivr` as the upstream source, and tested grades do not name a grading authority.

The provider-neutral `HadithSourceAdapter` remains an architectural boundary, but no external Hadith source is approved for publication. Keep `SUNNAH_NOW_ENABLED` unset/false. Source failures and disabled access must produce an unavailable state rather than fallback content.

Version 0.1.0 currently publishes Sahih al-Bukhari in Arabic and English. The API supplies collection, volume, chapter, Hadith identifiers, narrator, and texts. It does not currently supply a distinct per-Hadith authenticity-grade field. Al-Furqan displays the exact collection-level context and explicitly states that no per-Hadith grade was supplied; it never infers or generates one.

Records missing an identifier, Arabic text, or English text are omitted. Source failures produce an unavailable state rather than fallback religious content. Local Hadith bookmarks use the shared versioned bookmark store; cross-device sync remains deferred until an external-content bookmark schema is defined.

If Sunnah.com access is granted, its source contract must be audited before implementation. If it is unavailable, alternative providers—including UmmahAPI—can be reassessed explicitly. See [EPIC-UMMAHAPI-AUDIT.md](EPIC-UMMAHAPI-AUDIT.md) for the non-Hadith roadmap and fallback-source findings.

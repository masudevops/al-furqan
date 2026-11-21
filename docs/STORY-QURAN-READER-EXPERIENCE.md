# Story — Quran reader experience and interactions (PR 2 of 2)

## User outcome

As a Quran reader, I can move between verse-by-verse and Mushaf reading without losing my place, open study material for one Ayah without the page jumping, and control recitation and bookmarks with clear feedback.

## Acceptance criteria

- [x] Verse-by-verse is the default. `af-reading-mode` is only written when the reader explicitly chooses a mode (toolbar switch, Mushaf switch, or Reader settings); no existing preference is overwritten.
- [x] Begin reading / Resume honor the chosen mode (`/quran/mushaf/{last page}` in Mushaf mode). Direct Surah, Ayah, and Mushaf URLs are never redirected, so links and SEO URLs behave as before.
- [x] Verse → Mushaf opens the page of the Ayah under the toolbar; Mushaf → verse opens the first Ayah of the current page. The Mushaf page now has the same two-option switch.
- [x] A single Ayah's Tafsir panel fetches only that Ayah (`/api/quran/tafsir/{chapter}/{verse}?tafsir={id}`) instead of reloading the Surah; "Tafsir under every Ayah" still loads with the Surah.
- [x] Deep-link scrolling runs once per Surah/Ayah, so changing translation, script, Tafsir, or word-by-word no longer scrolls the reader back.
- [x] Audio player has Previous / Next Ayah controls for ordinary playback (hidden during range and synchronized playback, which manage their own sequence).
- [x] Bookmarking shows "Saved · Library" (with a link) or "Bookmark removed" in a live status region.
- [x] Tools menu adds a Tajweed colors toggle; Reader settings add the preferred reading mode and Follow recitation.
- [ ] Tajweed text integrity — still tracked in `BUG-TAJWEED-U0672-RENDERING.md`.

# Story — Quran reader visual redesign (PR 1 of 2)

## User outcome

As a Quran reader, I reach the Arabic text sooner and read each Ayah in a calm, consistent layout, with study tools one tap away instead of stacked across several toolbars.

## Scope

Presentation and layout only. Reading-mode persistence, Mushaf → verse position return, per-Ayah Tafsir fetching, and audio/bookmark interaction changes are PR 2.

## Acceptance criteria

- [x] Compact Surah header with number, name, English meaning (sourced), Ayah count, revelation place, Arabic name, and All Surahs link.
- [x] One sticky toolbar: Surah selector, page · Juz / Hizb from the Ayah under the toolbar, Verse by Verse / Mushaf switch (opens the current page), Tools menu, Reader settings.
- [x] Jump to Ayah, Word by word, Tafsir, Memorize, Introduction, Quran structure, and Lessons & reflections consolidated in the Tools menu.
- [x] Ayah layout: action row, Arabic, translation with attribution and footnotes, study row (Tafsir, Hadith, Answers) opening inline panels. Lessons, Reflections, and Related Content are not shown per Ayah because no per-Ayah source exists.
- [x] Hairline dividers replace verse cards; the playing Ayah gets a sage rule.
- [x] Uthmani Hafs font for plain Uthmani text, from the Quran.Foundation CDN (registered in `DATA-SOURCES.md`).
- [x] Charcoal dark theme app-wide; sepia remains the default theme.
- [x] Chapter catalog requests English meanings (`language: "en"`), which also fixes Arabic fallbacks in the Surah list.
- [x] No horizontal scroll at 375–1440px; 44px touch targets; labelled icon buttons; menus close on Escape and outside press; reduced motion respected.
- [ ] Tajweed text integrity — tracked separately in `BUG-TAJWEED-U0672-RENDERING.md`.

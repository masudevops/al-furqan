# Bug — Tajweed text renders U+0672 as the wrong letter

**Status:** Fixed (verse-by-verse, structure, and Mushaf fallback no longer render `text_uthmani_tajweed`)  
**Priority:** High (Quran text integrity)  
**Area:** Quran reader / Tajweed

## Problem

Quran.Foundation's `text_uthmani_tajweed` encodes some marks with code points that its plain Uthmani text does not use. The most frequent is U+0672 (ARABIC LETTER ALEF WITH WAVY HAMZA ABOVE), which appears where the plain Uthmani text has U+0670 (superscript alef), for example in ذَٰلِكَ (2:2) and ٱلسَّمَـٰوَٰتِ (2:255).

- With platform fonts (current production) U+0672 renders as a full alef with wavy hamza, so the displayed word is wrong.
- With Quran.Foundation's Uthmani Hafs font it renders as a dotted-circle placeholder.

In Surah Al-Baqarah, 107 of 286 Ayahs contain U+0672 in the Tajweed source. U+066E (dotless beh) also appears 7 times and has not been audited.

## Fix

- Verse-by-verse and structure (Juz/Hizb/Rub/Ruku/Manzil) views render Tajweed with the official QCF V4 glyphs (Mushaf 19 `code_v2`) and their per-page COLRv1 fonts — the same source the Mushaf view uses. Each word is drawn only with its own page's font, so Ayahs that cross a page boundary stay correct.
- Fonts load as an Ayah nears the viewport. Until they load, or if any page font fails, the verified plain Uthmani text is shown; raw glyph codes are never displayed. Screen readers get the plain Uthmani text; the glyph layer is `aria-hidden`.
- The Mushaf view's font-failure fallback shows plain Uthmani text instead of `text_uthmani_tajweed`.
- No character substitution is performed anywhere.

## Follow-up

- The old Tajweed color legend described the `text_uthmani_tajweed` class colors, which do not match the QCF V4 font palette. It was removed from all views until an official QCF V4 color key is sourced and registered.
- Done: `text_uthmani_tajweed` is no longer requested by any loader; its sanitizer, the `tajweedHtml` fields, the `--tj-*` color variables, and the old Tajweed tag/legend CSS were removed.

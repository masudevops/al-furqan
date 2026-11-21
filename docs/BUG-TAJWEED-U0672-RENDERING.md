# Bug — Tajweed text renders U+0672 as the wrong letter

**Status:** Open; pre-existing in production; needs an owner decision  
**Priority:** High (Quran text integrity)  
**Area:** Quran reader / Tajweed

## Problem

Quran.Foundation's `text_uthmani_tajweed` encodes some marks with code points that its plain Uthmani text does not use. The most frequent is U+0672 (ARABIC LETTER ALEF WITH WAVY HAMZA ABOVE), which appears where the plain Uthmani text has U+0670 (superscript alef), for example in ذَٰلِكَ (2:2) and ٱلسَّمَـٰوَٰتِ (2:255).

- With platform fonts (current production) U+0672 renders as a full alef with wavy hamza, so the displayed word is wrong.
- With Quran.Foundation's Uthmani Hafs font it renders as a dotted-circle placeholder.

In Surah Al-Baqarah, 107 of 286 Ayahs contain U+0672 in the Tajweed source. U+066E (dotless beh) also appears 7 times and has not been audited.

## What was done

The verse-by-verse redesign applies the Uthmani Hafs font only to plain Uthmani text, which renders correctly. Tajweed text keeps the previous platform font, so the redesign does not make this worse — but it does not fix it.

## Not acceptable fixes

- Replacing U+0672 with U+0670 (or any other substitution) in our code. That is rewriting Quran text.

## Options for the owner

1. Render Tajweed in verse-by-verse view with the official QCF V4 Tajweed per-page fonts and `code_v2` glyphs, as the Mushaf view already does. This is the approach Quran.com uses.
2. Confirm with Quran.Foundation which font `text_uthmani_tajweed` is designed for and register it in `DATA-SOURCES.md`.
3. Until 1 or 2 ships, consider defaulting Tajweed colors off in verse-by-verse view so readers see correct plain Uthmani text by default.

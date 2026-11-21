# Design system

Al-Furqan uses warm paper surfaces, restrained evergreen accents, fine borders, minimal elevation, editorial serif headings, and a Quran-dominant reader. Semantic tokens define surface, card, soft, ink, translation, muted, accent, and border values across light, dark, and sepia themes.

Spacing follows a compact 4/8-based rhythm; controls target at least 44px on touch surfaces. Focus rings are explicit. Reduced-motion preferences disable nonessential animation. Desktop uses a deliberate top navigation; mobile uses a fixed primary bar. Quran, translation, and interface labels maintain separate hierarchy. Reader font sizes are user-adjustable and persisted locally.

Dark mode uses deep charcoal surfaces (`#141615` / `#1b1e1c`), soft off-white ink, and a muted sage accent. Text placed on the accent uses the `--on-green` token so filled buttons keep AA contrast in every theme.

## Verse-by-verse reader

- One sticky reading toolbar sits under the global top bar: Surah selector (left), page · Juz / Hizb of the Ayah under the toolbar (center, from source metadata), and the Verse by Verse / Mushaf switch, Tools menu, and Reader settings (right). A 2px sage bar shows progress through the Surah.
- Secondary controls (Jump to Ayah, Word by word, Tafsir under every Ayah, Memorize, Surah introduction, Quran structure, Lessons & reflections) live in the Tools menu instead of stacked chip rows.
- The Surah header is a compact card: number, transliterated name, English meaning (only when the source provides one), Ayah count, revelation place, Arabic name, and Listen / Surah info / translation actions.
- Each Ayah is separated by a hairline, not a card: action row (reference, play, bookmark · copy, share, more), Arabic, translation with attribution and footnotes, then a quiet study row (Tafsir, Hadith, Answers) that opens inline panels. Only study links backed by a working source are shown.
- Plain Uthmani text uses Quran.Foundation's Uthmani Hafs font. Tajweed text and IndoPak/Imlaei scripts keep platform fonts until a verified font pipeline exists for them. Below 760px the Arabic renders at 0.82× the reader's chosen size so common Ayahs wrap cleanly on phones.

# Learn — Noorani Qaidah (public preview)

**Status:** Public preview, switched on in production at the owner's request on 2026-11-23. Lessons are still drafts. The preview banner was removed at the owner's request on 2026-11-23; each lesson's sources footer, the recording labels and the "Teaching notes awaiting review" lines still state provenance and review status.  
**Flag:** `NEXT_PUBLIC_FEATURE_LEARN` (default `true`; set to `false` and redeploy to take the section down). When off, `/learn`, `/learn/qaidah/*` and `/api/learn/words` return 404 and no navigation links appear. Pages are `noindex` and are not in the sitemap even when on.

## What exists

- `/learn` — course overview: all 30 days with progress and a "go at your own pace" note (no streaks).
- **Days 1–7 — letters** (four steps): meet four letters (Unicode name, code point, letter recording, contextual forms, real Quran words that begin with each) → recognise them in random forms (+ spaced review of earlier mistakes) → find them at the start of real Quran words → finish.
- **Days 8–30** (Learn → Practice → Finish), every exercise built only from sourced material:

| Days | Focus | Practice |
|---|---|---|
| 8 | Review all 28 letters | Recognition, weighted to the learner's mistakes |
| 9–11 | Start, middle, end forms | Identify letters shown in one position (right-joining letters only have end forms) |
| 12 | First letters | Which letter begins a real Quran word |
| 13–15 | Fatha, kasra, damma | Which word contains the mark |
| 16 | Short vowels together | Which short vowel is on the word's first letter |
| 17–19 | Tanween (fathatan, dammatan, kasratan), sukun, shadda | Which word contains the mark |
| 20 | Review of marks | Mixed |
| 21–22 | Maddah, superscript alef | Which word contains the mark |
| 23 | Review of all ten marks | Mixed |
| 24–26 | Listen: short, medium, longer words | Play a recited word and choose it (options are not playable) |
| 27–30 | Read along: Al-Kawthar, Al-Ikhlas, An-Nas, Al-Fatihah | Word by word with recitation, transliteration and translation; then listen-and-choose within the Surah |

- Progress is stored on the device in versioned local storage (`af-learn-v1`, `src/lib/learn/progress.ts`); unknown versions start fresh. No account is needed.

## Content provenance

| Content | Source | Notes |
|---|---|---|
| The 28 letters, their order, Unicode names, code points, joining types | Unicode Character Database (generated with Python `unicodedata`, Unicode 13.0) | `src/lib/learn/alphabet-data.ts` is generated, not hand-typed |
| Contextual letter forms | The letter plus a tatweel (U+0640), shaped by the font | Shown in a standard Arabic font: the Uthmani Quran font draws an isolated yeh without dots |
| Practice words and their recitation | Quran.Foundation Content API v4 (`verses.byChapter`, words with `text_uthmani` and `audio_url`), Surahs 1, 93–95, 97, 99–114 | Words are never constructed; audio is served from `verses.quran.foundation` |
| Vowel and annotation marks, their names and code points | Unicode Character Database (`src/lib/learn/marks-data.ts`, generated) | A mark shown alone sits on a dotted circle (U+25CC) |
| Mark detection in words | Presence of the mark's code point in Quran.Foundation `text_uthmani` | "First-letter vowel" questions only use words with exactly one short vowel on the first letter |
| Word transliteration and translation | Quran.Foundation word-by-word (`transliteration`, `translation`, English) | Shown in Learn and read-along |
| Read-along word order | Quran.Foundation words for Surahs 1, 108, 112, 114 in order | `sequences` in `/api/learn/words` |
| Lesson order and grouping (all 30 days) | Placeholder built from the material above | Pending a qualified teacher's lesson plan |

**Not included, by design (project rule: no AI-written religious or linguistic content):** teaching names (e.g. "Alif", "Ba"), explanations of how each mark is pronounced, makharij, tajweed rules, and reviewed pronunciation audio (the letter recordings below are unreviewed). Days 8–30 teach recognition only — finding marks and letters in real recited words — and every lesson says teaching notes await review.

## Before removing the preview label

1. A qualified teacher reviews and supplies: the lesson plan for all 30 days (currently a placeholder order), teaching names and short explanations for letters and marks, and sign-off per lesson (`QaidahLesson.review.reviewer`).
2. Letter and syllable recordings by a qualified reciter, with written permission, registered in `DATA-SOURCES.md`.
3. Open questions for the reviewer: whether words starting with hamza on alef (أ إ) or hamzat al-wasl (ٱ) should count as "begins with alef" (currently they do), and the grouping of letters by day.
4. Set each lesson's `status` to `"published"`, update the lesson status in the sources footer, and allow indexing.

## Letter pronunciation audio

Decision (updated 2026-11-21): each letter card has a play button using an **MIT-licensed recording set**, self-hosted in `public/learn/letters/` with its `LICENSE.txt` and `SOURCE.txt`.

- **Source:** [razunatmohammed88-cyber/arabic-alphabet-audio](https://github.com/razunatmohammed88-cyber/arabic-alphabet-audio) (MIT, © 2025). Found via the `theilgaz/mahfuz` app, which downloads the same files; we take them from the original repository, not from mahfuz (whose own license is stated only in its README).
- **What is known:** human recordings made on an Android phone (file metadata); all 28 files are distinct. The speaker is **unidentified** and the set has **not been reviewed** — every play button and the lesson footer say so.
- **Reviewer checklist:** confirm each recording is the correct letter (source file names are loose, e.g. `taa'` = ت and `taa` = ط) and that pronunciation is acceptable for teaching; replace any that fail, or remove the set if a reviewed recording or licensed API becomes available.
- Rejected alternatives: device text-to-speech (unreviewed machine pronunciation); `nooresahar/noorani` (no license); copying `theilgaz/mahfuz` (separate app, license only stated in README, unreviewed lesson text).

| Letter | Unicode | Our file | Source file |
|---|---|---|---|
| ا | U+0627 ALEF | `0627.mp3` | `alif.mp3` |
| ب | U+0628 BEH | `0628.mp3` | `baa.mp3` |
| ت | U+062A TEH | `062A.mp3` | `taa'.mp3` |
| ث | U+062B THEH | `062B.mp3` | `thaa.mp3` |
| ج | U+062C JEEM | `062C.mp3` | `jiim.mp3` |
| ح | U+062D HAH | `062D.mp3` | `haa.mp3` |
| خ | U+062E KHAH | `062E.mp3` | `khaa.mp3` |
| د | U+062F DAL | `062F.mp3` | `daal.mp3` |
| ذ | U+0630 THAL | `0630.mp3` | `thaal.mp3` |
| ر | U+0631 REH | `0631.mp3` | `raa.mp3` |
| ز | U+0632 ZAIN | `0632.mp3` | `zaay.mp3` |
| س | U+0633 SEEN | `0633.mp3` | `siin.mp3` |
| ش | U+0634 SHEEN | `0634.mp3` | `shiin.mp3` |
| ص | U+0635 SAD | `0635.mp3` | `saad.mp3` |
| ض | U+0636 DAD | `0636.mp3` | `daad.mp3` |
| ط | U+0637 TAH | `0637.mp3` | `taa.mp3` |
| ظ | U+0638 ZAH | `0638.mp3` | `thaa'.mp3` |
| ع | U+0639 AIN | `0639.mp3` | `àyn.mp3` |
| غ | U+063A GHAIN | `063A.mp3` | `ghayn.mp3` |
| ف | U+0641 FEH | `0641.mp3` | `faa.mp3` |
| ق | U+0642 QAF | `0642.mp3` | `qaaf.mp3` |
| ك | U+0643 KAF | `0643.mp3` | `kaaf.mp3` |
| ل | U+0644 LAM | `0644.mp3` | `laam.mp3` |
| م | U+0645 MEEM | `0645.mp3` | `miim.mp3` |
| ن | U+0646 NOON | `0646.mp3` | `nuun.mp3` |
| ه | U+0647 HEH | `0647.mp3` | `haa'.mp3` |
| و | U+0648 WAW | `0648.mp3` | `waaw.mp3` |
| ي | U+064A YEH | `064A.mp3` | `yaa.mp3` |

## Introducing an API later

Lesson content is read through the `QaidahContentSource` interface (`src/lib/learn/source.ts`); today `localQaidahSource` returns the draft curriculum in `curriculum.ts`. A future source only needs to implement `lessons()` returning `QaidahLesson[]`. Options evaluated on 2026-11-21:

| Option | Status | What it would take |
|---|---|---|
| **SunnahSource Noorani Qaida API** | Paid for production (~$10 7-day pass / ~$30 month). Free sample JSON exists but is marked `is_free: false`, covers 5 of 17 lessons, its audio URLs returned 403, and no terms page was found. | A paid plan with written license terms; map its lessons to `QaidahLesson`; verify audio provenance and reciter. |
| **Self-hosted lesson JSON + audio** (e.g. Azure Blob Storage / Cloudflare R2) | Recommended long-term: a Qaidah is a small, fixed set of lessons. | Licensed or commissioned content and recordings; a `QaidahContentSource` that fetches the JSON; register in `DATA-SOURCES.md`. |
| **`nooresahar/noorani` (GitHub)** | No license (all rights reserved), last updated 2016. | Written permission from the author before any use. |
| **QUL (Tarteel) datasets** | Free Quran script, word-by-word and audio datasets; no Qaidah lessons. | Could add practice words/audio; check each dataset's license. |

Whatever the source, keep the review gate: content from an API is still shown as a draft until a qualified teacher signs it off.

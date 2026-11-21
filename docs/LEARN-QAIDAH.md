# Learn — Noorani Qaidah (draft, behind a feature flag)

**Status:** Draft preview. Off in production.  
**Flag:** `NEXT_PUBLIC_FEATURE_LEARN` (default `false`). When off, `/learn`, `/learn/qaidah/*` and `/api/learn/words` return 404 and no navigation links appear. Pages are `noindex` and are not in the sitemap even when on.

## What exists

- `/learn` — course overview: a 30-day Noorani Qaidah path with days 1–7 available, progress, and a "go at your own pace" note (no streaks).
- `/learn/qaidah/{1–7}` — four steps per day:
  1. **Learn** — the day's four letters, each with its Unicode name and code point, its contextual forms (isolated / start / middle / end, shown with a tatweel), and real Quran words that begin with it, playable with Quran.Foundation word recitation.
  2. **Recognise** — eight "which letter is this?" questions on random forms, plus up to four review questions on earlier letters the learner got wrong or has not seen recently.
  3. **In the Quran** — "which word begins with this letter?" using only real Quran words, each playable.
  4. **Finish** — scores, mark the day complete, practise again, next day.
- Progress is stored on the device in versioned local storage (`af-learn-v1`, `src/lib/learn/progress.ts`); unknown versions start fresh. No account is needed.

## Content provenance

| Content | Source | Notes |
|---|---|---|
| The 28 letters, their order, Unicode names, code points, joining types | Unicode Character Database (generated with Python `unicodedata`, Unicode 13.0) | `src/lib/learn/alphabet-data.ts` is generated, not hand-typed |
| Contextual letter forms | The letter plus a tatweel (U+0640), shaped by the font | Shown in a standard Arabic font: the Uthmani Quran font draws an isolated yeh without dots |
| Practice words and their recitation | Quran.Foundation Content API v4 (`verses.byChapter`, words with `text_uthmani` and `audio_url`), Surahs 1, 93–95, 97, 99–114 | Words are never constructed; audio is served from `verses.quran.foundation` |
| Day 1–7 grouping | Standard alphabetical order, four letters a day | A placeholder until a teacher sets the lesson plan |

**Not included, by design (project rule: no AI-written religious or linguistic content):** teaching names (e.g. "Alif", "Ba"), pronunciation guidance, makharij explanations, vowel/tanween/sukun/madd lessons (days 8–30), and isolated-letter pronunciation audio. The UI states these are awaiting review.

## Before publishing

1. A qualified teacher reviews and supplies: the lesson plan for all 30 days, teaching names and short explanations, and sign-off per lesson (`QaidahLesson.review.reviewer`).
2. Letter and syllable recordings by a qualified reciter, with written permission, registered in `DATA-SOURCES.md`.
3. Open questions for the reviewer: whether words starting with hamza on alef (أ إ) or hamzat al-wasl (ٱ) should count as "begins with alef" (currently they do), and the grouping of letters by day.
4. Set each lesson's `status` to `"published"`, then turn on `NEXT_PUBLIC_FEATURE_LEARN`.

## Letter pronunciation audio

Decision (2026-11-21): letter recordings are deferred until a licensed API or recording set is available. Options considered: a commissioned or licensed reciter recording (preferred), volunteer CC BY-SA recordings (Wikimedia Commons / Lingua Libre, consistency unknown), the Quran's own muqatta'at recitations (only ص ق ن alone; others in groups such as الٓمٓ), and device text-to-speech (rejected — unreviewed machine pronunciation). No play button is shown for letters until a source is added, so there is no dead control.

## Introducing an API later

Lesson content is read through the `QaidahContentSource` interface (`src/lib/learn/source.ts`); today `localQaidahSource` returns the draft curriculum in `curriculum.ts`. A future source only needs to implement `lessons()` returning `QaidahLesson[]`. Options evaluated on 2026-11-21:

| Option | Status | What it would take |
|---|---|---|
| **SunnahSource Noorani Qaida API** | Paid for production (~$10 7-day pass / ~$30 month). Free sample JSON exists but is marked `is_free: false`, covers 5 of 17 lessons, its audio URLs returned 403, and no terms page was found. | A paid plan with written license terms; map its lessons to `QaidahLesson`; verify audio provenance and reciter. |
| **Self-hosted lesson JSON + audio** (e.g. Azure Blob Storage / Cloudflare R2) | Recommended long-term: a Qaidah is a small, fixed set of lessons. | Licensed or commissioned content and recordings; a `QaidahContentSource` that fetches the JSON; register in `DATA-SOURCES.md`. |
| **`nooresahar/noorani` (GitHub)** | No license (all rights reserved), last updated 2016. | Written permission from the author before any use. |
| **QUL (Tarteel) datasets** | Free Quran script, word-by-word and audio datasets; no Qaidah lessons. | Could add practice words/audio; check each dataset's license. |

Whatever the source, keep the review gate: content from an API is still shown as a draft until a qualified teacher signs it off.

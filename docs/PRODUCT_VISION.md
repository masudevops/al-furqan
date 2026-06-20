# Al-Furqan Product Vision

## Product promise

Al-Furqan is a calm, trustworthy Islamic companion that helps Muslims read, understand, remember, and live with the Quran every day.

It should combine the depth of a serious study tool with the simplicity of a daily-use app. Every religious text must be traceable to a named source, every personal feature must respect privacy, and every core flow must work beautifully on a phone.

## Product principles

1. **The Quran is the center.** Prayer, adhkar, Hadith, and books support the Quran journey rather than compete with it.
2. **Trust before breadth.** Provenance, edition, author, grading, and content version are visible and reviewable.
3. **Quiet, not noisy.** The interface supports khushu, reading, and reflection; it avoids engagement tricks.
4. **Fast path, deep path.** A user can resume reading in one tap or open word-level and tafsir study when desired.
5. **Private by default.** Reading history, bookmarks, notes, location, and goals remain local unless the user explicitly enables sync.
6. **Accessible worship support.** Keyboard, screen reader, low-vision, reduced-motion, RTL, and one-handed mobile use are first-class.
7. **Honest uncertainty.** Prayer calculation differences, Hadith grading, translation choices, and scholarly differences are explained.
8. **Offline resilience.** Previously downloaded core content remains useful without a connection.

## Primary audiences

### Daily reader

Wants to resume the Quran, listen during a commute, save an ayah, and complete a regular reading plan.

### Learner

Needs translations, word-by-word meaning, transliteration, roots, recitation repetition, and approachable tafsir.

### Serious student

Needs source comparison, notes, collections, deep links, search filters, Arabic tools, and reliable references.

### New or returning Muslim

Needs clear navigation, gentle terminology, transliteration, essential duas, prayer guidance, and no assumed expertise.

### Family and community user

Needs shareable references, multiple profiles or local preferences, child-friendly reading support, and dependable prayer information.

## Core user journeys

1. Open app → resume last ayah → read/listen → save progress.
2. Search a concept or Arabic term → filter Quran results → open ayah → inspect word-by-word and tafsir.
3. Open prayer dashboard → confirm location/method → see next prayer → optionally schedule a notification.
4. Open Hisnul Muslim → find a situation → read Arabic/transliteration/translation/reference → favorite or count repetitions.
5. Explore Hadith or a book → verify source metadata → save to a study collection.
6. Create a private note or collection around an ayah → export or opt into encrypted sync.

## Target capability pillars

### Quran reading

- Surah, Juz, page, Hizb, and last-read navigation
- High-quality Uthmani text and optional Mushaf mode
- Translation selection and comparison
- Verse audio, continuous playback, repeat, speed, and downloads
- Bookmarks, notes, collections, goals, and reading history

### Quran understanding

- Word-by-word translation and transliteration
- Root, lemma, morphology, and grammar where licensed and reviewed
- Unified tafsir drawer with source attribution and comparison
- Arabic and translated search with normalization and filters
- Cross-links between ayat, Hadith, duas, and books

### Daily worship

- Prayer times with explicit calculation settings
- Next prayer countdown, monthly view, offsets, and high-latitude handling
- Qibla with clear device limitations
- Hijri date adjustment and local calendar
- Optional notifications controlled by the user

### Knowledge library

- Verified Hadith collections with grading and references
- Hisnul Muslim with references, transliteration, audio, favorites, and counters
- Curated Islamic books with author, publisher, language, edition, and review status

### Personal continuity

- Local-first profile and preferences
- Versioned bookmarks, notes, history, and downloads
- Import/export and reset controls
- Optional account and encrypted sync in a later phase

## Non-goals for early releases

- Issuing fatwas or personalized religious rulings
- Replacing qualified scholars
- Social feeds, public comments, streak pressure, or gamified worship rankings
- AI-generated tafsir or unsourced religious answers presented as authority
- Collecting precise location, reading history, or notes without clear user intent
- Hosting unreviewed community-uploaded religious content

## Content trust standard

Every content surface should answer:

- What is this text?
- Who authored, translated, graded, or published it?
- Which edition or dataset version is shown?
- What license permits its use?
- When was it imported or reviewed?
- How can an error be reported?

Religious-content changes require a content review in addition to engineering review.

## Success measures

### Quality

- Quran text integrity checks pass for every supported edition.
- No critical accessibility violations in core journeys.
- Crash-free and API-success rates meet defined service-level targets.
- Prayer settings are visible and reproducible.

### Usefulness

- Users can resume a reading session in under two interactions.
- Search-to-ayah success and word-by-word engagement improve without slowing reading.
- Bookmarks and last-read position survive upgrades and offline use.
- Core Quran reading remains usable on constrained mobile networks.

### Trust

- Source attribution is present on all religious content.
- Privacy controls are discoverable and understandable.
- Corrections have an auditable process and response target.

## Product decision rule

When scope conflicts arise, choose the option that improves Quran reliability, content trust, accessibility, or user privacy before adding another feature category.

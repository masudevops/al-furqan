# Al-Furqan Data Model

## Goals

- Separate canonical domain entities from provider payloads.
- Preserve religious-content provenance and edition/version metadata.
- Version all persisted user data.
- Support local-first use and optional future sync.
- Avoid storing display text redundantly when a stable content reference is enough.

## Identity conventions

- Quran reference: `surahNumber:ayahNumber`, for example `2:255`.
- Quran word reference: `surahNumber:ayahNumber:position`.
- Hadith reference: provider/collection/book/hadith plus canonical source metadata.
- Dua reference: dataset/version/item ID.
- Book reference: source/provider ID plus edition where available.
- IDs stored locally should be strings to support composite and future server IDs.

## Provenance model

```ts
interface ContentSource {
  id: string;
  name: string;
  provider?: string;
  canonicalUrl?: string;
  licenseId?: string;
  version: string;
  language?: string;
  importedAt: string;
  reviewedAt?: string;
  reviewStatus: "unreviewed" | "technical-reviewed" | "content-reviewed";
}
```

Every Quran edition, tafsir, Hadith collection, dua dataset, and book record references a `ContentSource`.

## Quran domain

```ts
interface SurahMetadata {
  number: number;
  arabicName: string;
  transliteratedName: string;
  translatedName: string;
  revelationPlace: "makkah" | "madinah";
  ayahCount: number;
  startPage: number;
  juzNumbers: number[];
}

interface AyahReference {
  surahNumber: number;
  ayahNumber: number;
}

interface Ayah {
  ref: AyahReference;
  globalNumber: number;
  pageNumber: number;
  juzNumber: number;
  hizbQuarter: number;
  sajdah?: "recommended" | "obligatory";
}

interface AyahText {
  ref: AyahReference;
  editionId: string;
  text: string;
  language: string;
  script: "uthmani" | "simple" | "translation";
  sourceId: string;
}
```

### Word-by-word

```ts
interface QuranWord {
  id: string; // 2:255:4
  ref: AyahReference;
  position: number;
  arabic: string;
  translation?: string;
  transliteration?: string;
  root?: string;
  lemma?: string;
  morphology?: MorphologySegment[];
  audioUrl?: string;
  sourceId: string;
}
```

Morphology should preserve the source representation rather than flattening uncertain grammatical analysis.

## Audio

```ts
interface Reciter {
  id: string;
  name: string;
  arabicName?: string;
  style?: "murattal" | "mujawwad";
  sourceId: string;
}

interface AyahAudio {
  ref: AyahReference;
  reciterId: string;
  url: string;
  durationMs?: number;
  checksum?: string;
}

interface PlaybackPreferences {
  reciterId: string;
  speed: number;
  repeatAyah: number;
  repeatRange?: { start: AyahReference; end: AyahReference };
  gapMs: number;
  autoAdvance: boolean;
}
```

## Tafsir

```ts
interface TafsirEdition {
  id: string;
  title: string;
  author: string;
  language: string;
  abridged?: boolean;
  sourceId: string;
}

interface TafsirEntry {
  editionId: string;
  start: AyahReference;
  end: AyahReference;
  text: string;
  sourceId: string;
}
```

Range support is necessary because tafsir passages do not always map one-to-one to an ayah.

## Hadith

```ts
interface HadithCollection {
  id: string;
  title: string;
  arabicTitle?: string;
  compiler?: string;
  language: string;
  sourceId: string;
}

interface HadithRecord {
  id: string;
  collectionId: string;
  bookNumber?: string;
  chapterNumber?: string;
  hadithNumber: string;
  arabicText?: string;
  translations: LocalizedText[];
  narrator?: string;
  grades: HadithGrade[];
  sourceId: string;
}
```

Grades must include grader/source and must not be collapsed to a single unlabeled status.

## Prayer

```ts
interface SavedLocation {
  id: string;
  label: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  countryCode?: string;
  timezone: string;
  precision: "coordinates" | "city";
}

interface PrayerPreferences {
  locationId: string;
  calculationMethodId: number;
  asrMethod: "standard" | "hanafi";
  highLatitudeRule: string;
  adjustments: Partial<Record<PrayerName, number>>;
  hijriAdjustment: number;
  timeFormat: "12h" | "24h";
}
```

Prayer schedules are derived/cacheable data and should record calculation input, provider/version, and generated time.

## Hisnul Muslim and books

```ts
interface Dua {
  id: string;
  categoryId: string;
  arabic: string;
  translations: LocalizedText[];
  transliterations: LocalizedText[];
  references: ContentReference[];
  repetitionCount?: number;
  audioUrl?: string;
  sourceId: string;
}

interface IslamicBook {
  id: string;
  title: string;
  authors: PersonReference[];
  language: string;
  description?: string;
  coverUrl?: string;
  edition?: string;
  publisher?: string;
  attachments: BookAttachment[];
  sourceId: string;
}
```

## User data

```ts
interface UserDataEnvelope<T> {
  schemaVersion: number;
  updatedAt: string;
  data: T;
}

interface Bookmark {
  id: string;
  target: ContentTarget;
  createdAt: string;
  label?: string;
  tags: string[];
  noteId?: string;
  context?: {
    translationEditionId?: string;
    tafsirEditionId?: string;
  };
}

interface ReadingPosition {
  quranRef: AyahReference;
  pageNumber?: number;
  mode: "ayah" | "mushaf";
  updatedAt: string;
}

interface Note {
  id: string;
  target: ContentTarget;
  body: string;
  createdAt: string;
  updatedAt: string;
}
```

## Persistence plan

### Local storage

Reserve for small preferences and migration pointers:

- theme
- locale
- default translation/reciter
- storage schema version

### IndexedDB

Use for:

- bookmarks and notes
- reading history
- downloaded content indexes
- search indexes
- offline text and metadata
- sync queue

### Server storage

Only after opt-in account/sync:

- encrypted or privacy-minimized user records
- sync versions and conflict metadata
- never require server storage for basic reading

## Migration from current keys

| Current key | Target |
|---|---|
| `quranBookmarks` | `bookmarks` repository, schema v2 |
| `hisnulMuslimFavorites` | Generic favorites/bookmarks target type |
| `reciter` | Settings envelope |
| `translation` | Settings envelope |
| `theme` | Settings envelope |

Migration must be idempotent, preserve valid records, quarantine invalid records, and record completion. Do not delete legacy data until the new write is verified.

## Validation and integrity

- Validate provider DTOs at runtime.
- Validate Surah 1–114 and ayah bounds.
- Maintain Quran edition checksums and expected ayah counts.
- Reject empty audio URLs before playlist creation.
- Sanitize/validate external URLs and allow only HTTPS.
- Include source/version in cache keys.
- Store dates in ISO 8601 UTC; display in user locale.
- Never treat provider HTML as trusted UI.

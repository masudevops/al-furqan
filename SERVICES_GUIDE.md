# Al-Furqan Services Organization Guide

## Overview

All external API calls and data fetching are centralized in `src/services/`. This guide explains how existing services are organized and how to add new ones.

---

## Current Services

### 1. Quran Service (`src/services/quranService.ts`)

**Purpose**: Fetch Quranic text, translations, audio, and Mushaf pages

**API**: `https://api.alquran.cloud/v1`

#### Functions

##### `fetchSurahList(): Promise<Surah[]>`
Returns all 114 Surahs with metadata.

**Returns**:
```typescript
[
  {
    number: 1,
    name: "سُورَةُ ٱلْفَاتِحَةِ",
    englishName: "Al-Fatiha",
    englishNameTranslation: "The Opening",
    revelationType: "Meccan"
  },
  // ... 113 more
]
```

**Usage**:
```typescript
const surahs = await fetchSurahList();
```

**Data Source**: Local JSON fallback (`src/data/surah-list.json`)

---

##### `fetchSurahByIdWithTranslation(id: string, translation?: string): Promise<SurahData>`
Fetches a specific Surah with translation.

**Parameters**:
- `id`: Surah number (1-114)
- `translation`: Translation edition (default: "en.sahih")
  - `"ar"` - Arabic text
  - `"en.sahih"` - English Sahih
  - `"en.pickthall"` - English Pickthall
  - `"ur.junagarhi"` - Urdu

**Returns**:
```typescript
{
  number: 1,
  name: "سُورَةُ ٱلْفَاتِحَةِ",
  englishName: "Al-Fatiha",
  englishNameTranslation: "The Opening",
  ayahs: [
    {
      number: 1,
      text: "بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
      audio?: "https://..."
    },
    // ... more ayahs
  ]
}
```

**Usage**:
```typescript
const surah = await fetchSurahByIdWithTranslation("1", "en.sahih");
```

**Fallback**: Local Surah 1 data if API fails

---

##### `fetchSurahAudio(surahNumber: string, reciter?: string): Promise<Ayah[]>`
Fetches audio URLs for all Ayahs in a Surah.

**Parameters**:
- `surahNumber`: Surah number (1-114)
- `reciter`: Reciter identifier (default: "ar.alafasy")
  - `"ar.alafasy"` - Mishary al-Afasy
  - `"ar.sudais"` - Sheikh as-Sudais (manual URL construction)
  - `"ar.minshawi"` - Muhammad Siddiq al-Minshawi
  - `"ar.maher"` - Khalid al-Jalil

**Returns**:
```typescript
[
  {
    number: 1,
    text: "بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    audio: "https://verses.quran.com/Alafasy/mp3/001001.mp3"
  },
  // ... more ayahs
]
```

**Usage**:
```typescript
const audioAyahs = await fetchSurahAudio("1", "ar.alafasy");
```

**Special Handling**: 
- Sudais reciter uses manual URL construction: `https://verses.quran.com/Sudais/mp3/{surah}{ayah}.mp3`
- Other reciters use API's built-in audio endpoint

---

##### `fetchPage(pageNumber: number, edition?: string): Promise<PageAyah[]>`
Fetches all Ayahs on a specific Mushaf page.

**Parameters**:
- `pageNumber`: Page number (1-604)
- `edition`: Mushaf edition (default: "quran-uthmani")

**Returns**:
```typescript
[
  {
    number: 1,  // Global Ayah number
    text: "بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ",
    numberInSurah: 1,
    surah: {
      number: 1,
      name: "سُورَةُ ٱلْفَاتِحَةِ",
      englishName: "Al-Fatiha"
    }
  },
  // ... more ayahs on page
]
```

**Usage**:
```typescript
const pageAyahs = await fetchPage(1, "quran-uthmani");
```

**Total Pages**: 604 (Madani Mushaf)

---

### 2. Hadith Service (`src/services/hadithService.ts`)

**Purpose**: Fetch Hadith collections, books, and individual hadiths

**API**: `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1`

#### Supported Collections

```typescript
HADITH_COLLECTIONS = [
  { id: "bukhari", title: "Sahih al-Bukhari", total: 7563 },
  { id: "muslim", title: "Sahih Muslim", total: 7563 },
  { id: "abudawud", title: "Sunan Abu Dawud", total: 5274 },
  { id: "tirmidhi", title: "Jami' at-Tirmidhi", total: 3956 },
  { id: "nasai", title: "Sunan an-Nasa'i", total: 5761 },
  { id: "ibnmajah", title: "Sunan Ibn Majah", total: 4341 },
  { id: "malik", title: "Muwatta Malik", total: 1842 },
  { id: "ahmad", title: "Musnad Ahmad", total: 26363 }
]
```

#### Functions

##### `fetchBooks(collectionId: string): Promise<HadithBook[]>`
Returns all books/chapters in a Hadith collection.

**Parameters**:
- `collectionId`: Collection ID (e.g., "bukhari", "muslim")

**Returns**:
```typescript
[
  {
    bookNumber: "1",
    bookName: "Book of Revelation",
    hadithCount: 152
  },
  // ... more books
]
```

**Usage**:
```typescript
const books = await fetchBooks("bukhari");
```

**Strategy**: Samples API responses to discover book names and counts

---

##### `fetchHadithsByBook(collectionId: string, bookNumber: string): Promise<Hadith[]>`
Returns all hadiths in a specific book.

**Parameters**:
- `collectionId`: Collection ID
- `bookNumber`: Book number within collection

**Returns**:
```typescript
[
  {
    hadithNumber: "1",
    hadithArabic: "إِنَّمَا الأَعْمَالُ بِالنِّيَّاتِ",
    hadithEnglish: "The reward of deeds depends upon the intentions...",
    englishNarrator: "Umar bin Al-Khattab",
    bookNumber: "1",
    status: "Sahih",
    grade: "Sahih"
  },
  // ... more hadiths
]
```

**Usage**:
```typescript
const hadiths = await fetchHadithsByBook("bukhari", "1");
```

**Performance**: Uses batching and sampling to avoid overwhelming API

---

##### `fetchHadithByNumber(collectionId: string, hadithNumber: number, language?: string): Promise<Hadith | null>`
Fetches a single hadith by number.

**Parameters**:
- `collectionId`: Collection ID
- `hadithNumber`: Hadith number
- `language`: Language code (default: "eng")

**Returns**:
```typescript
{
  hadithNumber: "1",
  hadithArabic: "...",
  hadithEnglish: "...",
  englishNarrator: "...",
  bookNumber: "1",
  status: "Sahih"
}
```

**Usage**:
```typescript
const hadith = await fetchHadithByNumber("bukhari", 1);
```

---

### 3. Tafsir Service (`src/services/tafsirService.ts`)

**Purpose**: Fetch Quranic explanations (Tafsir)

**API**: `https://api.alquran.cloud/v1`

#### Available Tafsirs

```typescript
AVAILABLE_TAFSIRS = [
  {
    identifier: "en.ibnkathir",
    name: "Tafsir Ibn Kathir",
    language: "en",
    author: "Hafiz Ibn Kathir",
    englishName: "Tafsir Ibn Kathir (English)"
  },
  {
    identifier: "ar.muyassar",
    name: "Tafseer Al-Muyassar",
    language: "ar",
    author: "King Fahad Quran Complex",
    englishName: "Tafseer Al-Muyassar"
  }
]
```

#### Functions

##### `fetchTafsir(surahNumber: number, ayahNumber: number, edition?: string): Promise<TafsirAyah | null>`
Fetches tafsir for a specific Ayah.

**Parameters**:
- `surahNumber`: Surah number (1-114)
- `ayahNumber`: Ayah number within Surah
- `edition`: Tafsir edition (default: "en.ibnkathir")

**Returns**:
```typescript
{
  surah: 1,
  ayah: 1,
  text: "In the name of Allah, the Most Gracious, the Most Merciful..."
}
```

**Usage**:
```typescript
const tafsir = await fetchTafsir(1, 1, "en.ibnkathir");
```

**Returns `null`** if tafsir not available for that Ayah

---

## Service Architecture Patterns

### Error Handling

All services follow this pattern:

```typescript
export async function fetchData() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { data } = await res.json();
    return data;
  } catch (error) {
    console.error("Error:", error);
    // Return fallback or null
    return null;
  }
}
```

**Key Points**:
- 5-second timeout to prevent hanging
- Proper cleanup of timeout
- Descriptive error messages
- Graceful fallback

---

### Caching Strategy

**Current Approach**: No explicit caching (relies on browser cache)

**Recommended for Future**:
```typescript
const cache = new Map<string, CacheEntry>();

export async function fetchWithCache(key: string, fetcher: () => Promise<T>) {
  if (cache.has(key)) {
    const entry = cache.get(key)!;
    if (Date.now() - entry.timestamp < 3600000) { // 1 hour
      return entry.data;
    }
  }
  
  const data = await fetcher();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}
```

---

### Type Definitions

All services export TypeScript interfaces:

```typescript
export interface Surah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: "Meccan" | "Medinan";
}

export interface Ayah {
  number: number;
  text: string;
  audio?: string;
}

export interface Hadith {
  hadithNumber: string;
  hadithArabic: string;
  hadithEnglish: string;
  englishNarrator: string;
  status?: string;
  bookNumber: string;
  grade?: string;
}
```

---

## Adding a New Service

### Step 1: Create Service File

**File**: `src/services/newFeatureService.ts`

```typescript
// Define API base
const API_BASE = "https://api.example.com/v1";

// Define types
export interface NewFeatureData {
  id: string;
  title: string;
  // ... other fields
}

// Export constants
export const NEW_FEATURE_ITEMS: NewFeatureData[] = [];

// Export functions
export async function fetchNewFeature(id: string): Promise<NewFeatureData | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(`${API_BASE}/feature/${id}`, { 
      signal: controller.signal 
    });
    clearTimeout(timeout);
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { data } = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching feature:", error);
    return null;
  }
}
```

### Step 2: Use in Component

```typescript
import { fetchNewFeature } from "../services/newFeatureService";

export default function NewFeaturePage() {
  const [data, setData] = useState<NewFeatureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchNewFeature("123")
      .then(result => {
        if (!cancelled) {
          if (result) setData(result);
          else setError("Failed to load data");
        }
      })
      .catch(err => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  return <div>{/* render data */}</div>;
}
```

### Step 3: Add to App Routes

```typescript
import NewFeaturePage from "./pages/NewFeaturePage";

<Route path="/new-feature" element={<NewFeaturePage />} />
```

---

## API Response Patterns

### Quran API Response
```json
{
  "code": 200,
  "status": "OK",
  "data": {
    "number": 1,
    "name": "سُورَةُ ٱلْفَاتِحَةِ",
    "englishName": "Al-Fatiha",
    "ayahs": [
      {
        "number": 1,
        "text": "بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"
      }
    ]
  }
}
```

### Hadith API Response
```json
{
  "metadata": {
    "section": {
      "1": "Book of Revelation"
    }
  },
  "hadiths": [
    {
      "hadithnumber": 1,
      "text": "The reward of deeds depends upon the intentions...",
      "reference": {
        "book": 1
      }
    }
  ]
}
```

---

## Performance Considerations

### API Rate Limiting
- Quran API: No documented limits
- Hadith API: Reasonable limits (use CDN)
- Tafsir API: Part of Quran API

### Optimization Tips
1. **Batch requests** when fetching multiple items
2. **Use timeouts** to prevent hanging requests
3. **Cache responses** in localStorage for offline support
4. **Lazy load** data on demand
5. **Debounce** search/filter operations

### Example: Batch Fetch
```typescript
export async function fetchMultipleSurahs(ids: number[]): Promise<Surah[]> {
  const promises = ids.map(id => 
    fetchSurahByIdWithTranslation(String(id))
  );
  return Promise.all(promises);
}
```

---

## Testing Services

### Unit Test Example
```typescript
import { fetchSurahList } from "../services/quranService";

describe("quranService", () => {
  it("should fetch surah list", async () => {
    const surahs = await fetchSurahList();
    expect(surahs).toHaveLength(114);
    expect(surahs[0].number).toBe(1);
  });
});
```

### Mock Service for Testing
```typescript
export const mockQuranService = {
  fetchSurahList: jest.fn().mockResolvedValue([
    { number: 1, name: "Al-Fatiha", englishName: "Al-Fatiha" }
  ])
};
```

---

## Troubleshooting

### Issue: API calls timing out
**Solution**: Increase timeout or check network connectivity

### Issue: CORS errors
**Solution**: Use CORS-enabled APIs or proxy

### Issue: Stale data
**Solution**: Implement cache invalidation strategy

### Issue: Rate limiting
**Solution**: Implement request queuing or backoff strategy

---

## Future Enhancements

1. **Service Worker Caching**: Cache API responses for offline support
2. **Request Queuing**: Queue requests to avoid overwhelming API
3. **Retry Logic**: Automatic retry with exponential backoff
4. **Analytics**: Track API performance and errors
5. **GraphQL**: Consider GraphQL for more efficient queries
6. **WebSocket**: Real-time updates for prayer times

---

**Last Updated**: 2024
**Version**: 1.0

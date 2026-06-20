# Al-Furqan Islamic Application - Complete Architecture Guide

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Directory Structure](#directory-structure)
4. [Frontend Architecture](#frontend-architecture)
5. [State Management](#state-management)
6. [Services & APIs](#services--apis)
7. [Styling System](#styling-system)
8. [Routing & Navigation](#routing--navigation)
9. [Naming Conventions](#naming-conventions)
10. [Adding New Services](#adding-new-services)
11. [Component Patterns](#component-patterns)

---

## Project Overview

**Al-Furqan** is a production Islamic application built with React + TypeScript + Vite. It provides:
- **Quran Reading**: Full Quranic text with translations and audio recitations
- **Mushaf View**: Traditional Madani Mushaf page-by-page reading
- **Hadith Collections**: Access to major Hadith collections (Bukhari, Muslim, etc.)
- **Tafseer**: Quranic explanations (Ibn Kathir focus)
- **Prayer Times**: Location-based Salah times
- **Hisnul Muslim**: Daily Adhkar and Duas
- **Bookmarks**: User-saved verses and hadiths
- **Dark Mode**: Full dark theme support with localStorage persistence
- **Audio Player**: Global audio context for Quran recitations

---

## Technology Stack

### Core
- **React 19.1.0** - UI framework
- **TypeScript 5.8.3** - Type safety
- **Vite 6.3.5** - Build tool & dev server
- **React Router DOM 7.6.0** - Client-side routing

### Styling
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **PostCSS 8.5.3** - CSS processing
- **Autoprefixer 10.4.21** - Browser compatibility

### UI Components & Icons
- **Lucide React 0.511.0** - Modern icon library
- **React Icons 5.5.0** - Icon sets (FontAwesome, etc.)
- **Framer Motion 12.15.0** - Animation library

### Utilities
- **React Helmet Async 2.0.5** - SEO/Head management
- **Vercel Analytics 1.6.1** - Analytics integration
- **js-cookie** - Cookie management (if needed)

### Development
- **ESLint 9.25.0** - Code linting
- **TypeScript ESLint** - TS-specific linting
- **Vite React Plugin** - Fast Refresh support

---

## Directory Structure

```
al-furqan/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Header.tsx       # Navigation header
│   │   ├── Footer.tsx       # Footer component
│   │   ├── GlobalPlayer.tsx # Audio player UI
│   │   ├── PageView.tsx     # Mushaf page viewer
│   │   ├── TafsirView.tsx   # Tafsir display
│   │   └── SEO.tsx          # Meta tags helper
│   │
│   ├── context/             # React Context (state management)
│   │   ├── ThemeContext.tsx # Dark/light mode
│   │   └── AudioContext.tsx # Audio playback state
│   │
│   ├── pages/               # Page components (route-level)
│   │   ├── Home.tsx         # Landing page
│   │   ├── AlQuranPage.tsx  # Quran reader
│   │   ├── SurahDetail.tsx  # Single surah view
│   │   ├── MushafPage.tsx   # Mushaf page view
│   │   ├── HadithHome.tsx   # Hadith collections list
│   │   ├── HadithCollection.tsx # Books in collection
│   │   ├── HadithBook.tsx   # Hadiths in book
│   │   ├── TafseerPage.tsx  # Tafsir viewer
│   │   ├── SalahTimesPage.tsx # Prayer times
│   │   ├── HisnulMuslim.tsx # Daily Adhkar
│   │   ├── Bookmarks.tsx    # Saved items
│   │   ├── Prayer.tsx       # Prayer guide (legacy)
│   │   ├── Qibla.tsx        # Qibla direction
│   │   └── NotFound.tsx     # 404 page
│   │
│   ├── services/            # API & data services
│   │   ├── quranService.ts  # Quran API calls
│   │   ├── hadithService.ts # Hadith API calls
│   │   └── tafsirService.ts # Tafsir API calls
│   │
│   ├── hooks/               # Custom React hooks
│   │   └── useLocation.ts   # Geolocation hook
│   │
│   ├── layouts/             # Layout wrappers
│   │   └── MainLayout.tsx   # Main page layout
│   │
│   ├── data/                # Static JSON data
│   │   ├── surah-list.json  # All 114 Surahs
│   │   ├── surah-1.json     # Surah 1 (Fatiha)
│   │   ├── hadith-data.json # Hadith metadata
│   │   ├── hisnul-data.json # Hisnul Muslim
│   │   ├── salah-times.json # Prayer times data
│   │   └── tafseer-data.json # Tafsir data
│   │
│   ├── assets/              # Static assets
│   │   └── react.svg
│   │
│   ├── App.tsx              # Main app component & routes
│   ├── App.css              # App-level styles
│   ├── index.css            # Global styles + Tailwind
│   ├── main.tsx             # Entry point
│   └── vite-env.d.ts        # Vite type definitions
│
├── public/                  # Static files
│   ├── icons/               # PWA icons
│   ├── manifest.json        # PWA manifest
│   ├── service-worker.js    # Service worker
│   └── favicon.svg
│
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
├── tailwind.config.js       # Tailwind config
├── postcss.config.js        # PostCSS config
├── vite.config.ts           # Vite config
├── eslint.config.js         # ESLint config
└── index.html               # HTML entry point
```

---

## Frontend Architecture

### Component Hierarchy

```
App (Router)
├── Header (Navigation)
├── main (Routes)
│   ├── Home
│   ├── AlQuranPage
│   │   ├── SurahList (search/filter)
│   │   └── PageView (Mushaf)
│   ├── SurahDetail
│   ├── HadithHome
│   ├── HadithCollection
│   ├── HadithBook
│   ├── TafseerPage
│   ├── SalahTimesPage
│   ├── HisnulMuslim
│   ├── Bookmarks
│   └── NotFound
├── GlobalPlayer (Audio UI)
└── Footer
```

### Component Types

**Page Components** (`/pages`)
- Route-level components
- Handle data fetching
- Manage page-specific state
- Named: `{Feature}Page.tsx` or `{Feature}.tsx`

**Layout Components** (`/layouts`)
- Wrapper components for consistent structure
- Example: `MainLayout.tsx` for standard page layout

**UI Components** (`/components`)
- Reusable, presentational components
- No page-specific logic
- Examples: `Header.tsx`, `GlobalPlayer.tsx`, `PageView.tsx`

---

## State Management

### Context API (Recommended Pattern)

**1. ThemeContext** (`src/context/ThemeContext.tsx`)
```typescript
// Manages dark/light mode
- darkMode: boolean
- toggleDarkMode(): void
- Persists to localStorage
- Applies 'dark' class to document.documentElement
```

**2. AudioContext** (`src/context/AudioContext.tsx`)
```typescript
// Manages Quran audio playback
- currentAyah: AudioAyah | null
- isPlaying: boolean
- isLoading: boolean
- playlist: AudioAyah[]
- playAyah(ayah): void
- playPlaylist(ayahs, startIndex): void
- togglePlay(): void
- playNext/playPrevious(): void
- seek(time): void
- progress, duration, currentTime: number
```

### Local Storage
- Theme preference: `localStorage.getItem('theme')`
- Bookmarks: Can be stored as JSON array
- User preferences: Location, language, etc.

### No Redux/Zustand
- Context API is sufficient for current scope
- If app grows, consider Zustand for lighter state management

---

## Services & APIs

### Service Files Location
`src/services/` - All API calls and data fetching

### 1. Quran Service (`quranService.ts`)

**API Base**: `https://api.alquran.cloud/v1`

**Functions**:
```typescript
fetchSurahList(): Promise<Surah[]>
  // Returns all 114 Surahs with metadata
  // Uses local JSON fallback

fetchSurahByIdWithTranslation(id, translation): Promise<SurahData>
  // Fetches specific Surah with translation
  // Default: "en.sahih" (English Sahih)
  // Fallback: Local Surah 1 data

fetchSurahAudio(surahNumber, reciter): Promise<Ayah[]>
  // Fetches audio URLs for all Ayahs in Surah
  // Default reciter: "ar.alafasy"
  // Special handling for "ar.sudais" (manual URL construction)

fetchPage(pageNumber, edition): Promise<PageAyah[]>
  // Fetches all Ayahs on a Mushaf page
  // Default edition: "quran-uthmani"
  // Returns 604 pages total
```

**Data Types**:
```typescript
interface Surah {
  number: number
  name: string (Arabic)
  englishName: string
  englishNameTranslation: string
  revelationType: "Meccan" | "Medinan"
}

interface Ayah {
  number: number (verse index in Surah)
  text: string (Arabic)
  audio?: string (MP3 URL)
}

interface PageAyah {
  number: number (global Ayah number)
  text: string
  numberInSurah: number
  surah: { number, name, englishName }
}
```

### 2. Hadith Service (`hadithService.ts`)

**API Base**: `https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1`

**Collections Supported**:
- Sahih al-Bukhari (7563 hadiths)
- Sahih Muslim (7563 hadiths)
- Sunan Abu Dawud (5274 hadiths)
- Jami' at-Tirmidhi (3956 hadiths)
- Sunan an-Nasa'i (5761 hadiths)
- Sunan Ibn Majah (4341 hadiths)
- Muwatta Malik (1842 hadiths)
- Musnad Ahmad (26363 hadiths)

**Functions**:
```typescript
fetchBooks(collectionId): Promise<HadithBook[]>
  // Returns all books/chapters in a collection

fetchHadithsByBook(collectionId, bookNumber): Promise<Hadith[]>
  // Returns all hadiths in a specific book

fetchHadithByNumber(collectionId, hadithNumber): Promise<Hadith | null>
  // Fetches a single hadith by number
```

**Data Types**:
```typescript
interface HadithCollection {
  id: string
  title: string
  total: number
  arabicName?: string
  description?: string
}

interface Hadith {
  hadithNumber: string
  hadithArabic: string
  hadithEnglish: string
  englishNarrator: string
  status?: string
  bookNumber: string
  grade?: string
}
```

### 3. Tafsir Service (`tafsirService.ts`)

**API Base**: `https://api.alquran.cloud/v1`

**Available Tafsirs**:
- `en.ibnkathir` - Ibn Kathir (English)
- `ar.muyassar` - Al-Muyassar (Arabic)

**Functions**:
```typescript
fetchTafsir(surahNumber, ayahNumber, edition): Promise<TafsirAyah | null>
  // Fetches tafsir for specific Ayah
  // Default: "en.ibnkathir"
```

---

## Styling System

### Tailwind CSS Configuration

**File**: `tailwind.config.js`

**Custom Theme**:
```javascript
colors: {
  golden: {
    light: '#fdf6e3',
    base: '#d4af37',
    dark: '#a67c00',
  }
}

fontFamily: {
  arabic: ['"Amiri"', '"Scheherazade"', 'serif'],
  noto: ['"Noto Naskh Arabic"', 'serif'],  // For Mushaf
}
```

### Dark Mode

**Implementation**:
- Strategy: `class` (manual toggle)
- Applied to `document.documentElement`
- Persisted in localStorage

**Usage**:
```html
<!-- Light mode -->
<div class="bg-white text-gray-900">

<!-- Dark mode -->
<div class="dark:bg-gray-900 dark:text-gray-100">
```

### Color Palette

**Primary Colors**:
- Emerald: `#10b981` (primary action, links)
- Gray: `#6b7280` (text, borders)
- Golden: `#d4af37` (accent, premium)

**Semantic Colors**:
- Success: Emerald
- Error: Red (`#ef4444`)
- Warning: Amber (`#f59e0b`)
- Info: Blue (`#3b82f6`)

### Typography

**Font Families**:
- **UI Text**: System fonts (sans-serif)
- **Arabic UI**: Amiri, Scheherazade
- **Quran Text**: Noto Naskh Arabic (Mushaf)

**Font Sizes**:
- Headings: `text-4xl` to `text-6xl`
- Body: `text-base` to `text-lg`
- Small: `text-sm` to `text-xs`

### Responsive Design

**Breakpoints** (Tailwind defaults):
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

**Pattern**:
```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### Custom CSS

**File**: `src/index.css`

**Animations**:
```css
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fadeIn {
  animation: fadeIn 0.3s ease-out forwards;
}
```

**Component Classes**:
```css
.btn-primary { /* Button styling */ }
.card { /* Card styling */ }
```

---

## Routing & Navigation

### Route Structure

**File**: `src/App.tsx`

```typescript
/                          → Home (landing)
/al-quran                  → AlQuranPage (Surah list + Mushaf tabs)
/quran                     → Alias for /al-quran
/quran/:surahId            → SurahDetail (single Surah)
/mushaf                    → MushafPage (page-by-page view)
/hadith                    → HadithHome (collections list)
/hadith/:collectionId      → HadithCollection (books in collection)
/hadith/:collectionId/:bookNumber → HadithBook (hadiths in book)
/tafseer                   → TafseerPage (Tafsir viewer)
/salah                     → SalahTimesPage (prayer times)
/prayer                    → Alias for /salah
/hisnul                    → HisnulMuslim (daily Adhkar)
/bookmarks                 → Bookmarks (saved items)
*                          → NotFound (404)
```

### Navigation Components

**Header** (`src/components/Header.tsx`)
- Sticky navigation bar
- Mobile hamburger menu
- Active link highlighting
- Dark mode toggle (if added)

**Link Usage**:
```typescript
import { Link } from "react-router-dom";

<Link to="/quran/1" className="...">
  Surah Al-Fatiha
</Link>
```

### Programmatic Navigation

```typescript
import { useNavigate } from "react-router-dom";

const navigate = useNavigate();
navigate("/quran/2");
```

---

## Naming Conventions

### Files & Folders

**Components**:
- PascalCase: `Header.tsx`, `GlobalPlayer.tsx`
- Descriptive names: `PageView.tsx`, `TafsirView.tsx`

**Pages**:
- PascalCase: `Home.tsx`, `AlQuranPage.tsx`
- Suffix with "Page": `SalahTimesPage.tsx`, `HadithHome.tsx`
- Exception: `NotFound.tsx` (standard 404 name)

**Services**:
- camelCase: `quranService.ts`, `hadithService.ts`
- Suffix with "Service": `tafsirService.ts`

**Contexts**:
- PascalCase: `ThemeContext.tsx`, `AudioContext.tsx`
- Suffix with "Context"

**Hooks**:
- camelCase: `useLocation.ts`
- Prefix with "use"

**Data Files**:
- kebab-case: `surah-list.json`, `hadith-data.json`
- Descriptive: `hisnul-data.json`, `salah-times.json`

### Variables & Functions

**React Components**:
```typescript
export default function Header() { }
export const useTheme = () => { }
```

**API Functions**:
```typescript
export async function fetchSurahList() { }
export async function fetchHadithsByBook() { }
```

**State Variables**:
```typescript
const [darkMode, setDarkMode] = useState(false);
const [currentAyah, setCurrentAyah] = useState<AudioAyah | null>(null);
```

**Constants**:
```typescript
const API_BASE = "https://api.alquran.cloud/v1";
const MAX_PAGE = 604;
const HADITH_COLLECTIONS: HadithCollection[] = [ ];
```

---

## Adding New Services

### Step 1: Create Service File

**Location**: `src/services/{feature}Service.ts`

**Template**:
```typescript
// src/services/exampleService.ts

const API_BASE = "https://api.example.com/v1";

// Define types
export interface ExampleData {
  id: string;
  title: string;
  // ... other fields
}

// Export constants
export const EXAMPLE_CONSTANTS = [ ];

// Export functions
export async function fetchExample(id: string): Promise<ExampleData> {
  try {
    const res = await fetch(`${API_BASE}/example/${id}`);
    if (!res.ok) throw new Error("Failed to fetch");
    const { data } = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching example:", error);
    throw error;
  }
}
```

### Step 2: Error Handling

**Pattern**:
```typescript
export async function fetchData() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Fetch error:", error);
    // Return fallback data or null
    return null;
  }
}
```

### Step 3: Use in Components

**Pattern**:
```typescript
import { fetchExample } from "../services/exampleService";

export default function ExamplePage() {
  const [data, setData] = useState<ExampleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchExample("123")
      .then(result => {
        if (!cancelled) setData(result);
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

### Step 4: Add to App Routes

**File**: `src/App.tsx`

```typescript
import ExamplePage from "./pages/ExamplePage";

<Route path="/example" element={<ExamplePage />} />
```

---

## Component Patterns

### Page Component Pattern

```typescript
import { useEffect, useState } from "react";
import { fetchData } from "../services/dataService";
import SEO from "../components/SEO";

export default function FeaturePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    fetchData()
      .then(result => {
        if (!cancelled) setData(result);
      })
      .catch(err => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <SEO title="Feature" description="Feature description" />
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {data && <div>{/* render data */}</div>}
      </div>
    </>
  );
}
```

### Reusable Component Pattern

```typescript
interface ComponentProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function Card({ title, children, className = "" }: ComponentProps) {
  return (
    <div className={`card p-6 ${className}`}>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      {children}
    </div>
  );
}
```

### Hook Pattern

```typescript
import { useEffect, useState } from "react";

export function useCustomHook(dependency: string) {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Logic here
  }, [dependency]);

  return state;
}
```

---

## Best Practices

### 1. Type Safety
- Always define interfaces for API responses
- Use `unknown` → `as Type` sparingly
- Leverage TypeScript strict mode

### 2. Performance
- Use `useCallback` for event handlers in lists
- Memoize expensive computations
- Lazy load routes with `React.lazy()`

### 3. Accessibility
- Use semantic HTML (`<button>`, `<nav>`, etc.)
- Add `aria-labels` for icon buttons
- Ensure color contrast ratios

### 4. Error Handling
- Always wrap API calls in try-catch
- Provide user-friendly error messages
- Log errors to console in development

### 5. Code Organization
- Keep components small and focused
- Extract logic into custom hooks
- Use services for all API calls

### 6. Testing (Future)
- Unit tests for services
- Component tests with React Testing Library
- E2E tests with Cypress/Playwright

---

## Deployment

### Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

### Deployment Targets
- Vercel (recommended, already configured)
- Netlify
- GitHub Pages
- Docker (Dockerfile provided)

---

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com)
- [React Router](https://reactrouter.com)
- [Vite Documentation](https://vitejs.dev)
- [Quran API](https://alquran.cloud)
- [Hadith API](https://github.com/fawazahmed0/hadith-api)

---

**Last Updated**: 2024
**Version**: 1.0
